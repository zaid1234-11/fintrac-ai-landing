export const runtime = 'nodejs';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { uploadStatement } from '@/lib/storage/actions';
import { createClient } from '@/lib/supabase/server';
import { parserRegistry } from '@/lib/parsers/registry';

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const password = formData.get('password') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 3. Validate file type and size
    const allowedTypes = [
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Invalid file format. Only PDF and CSV bank statements are supported.' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB limit
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds the 10MB limit.' },
        { status: 400 }
      );
    }

    // 4. Read file content into Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Upload to Supabase Storage
    console.log(`[Upload API] Uploading ${file.name} to Storage...`);
    const uploadResult = await uploadStatement(buffer, file.name, file.type);

    // 6. Create bank statement record in DB
    const supabase = await createClient();
    const { data: statement, error: dbError } = await supabase
      .from('bank_statements')
      .insert({
        user_id: userId,
        bank_name: 'Analyzing...', // will be updated below
        file_url: uploadResult.filePath,
        status: 'processing',
        extracted_transactions_count: 0,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Upload API] Database insert error:', dbError);
      return NextResponse.json(
        { error: `Database logging failed: ${dbError.message}` },
        { status: 500 }
      );
    }

    // 7. Parse file content synchronously
    console.log(`[Upload API] Parsing file content for statementId: ${statement.id}`);
    const parseResult = await parserRegistry.parseFile(buffer, file.name, password);

    if (!parseResult.success) {
      // Update statement record to failed
      await supabase
        .from('bank_statements')
        .update({
          status: 'failed',
          error_message: parseResult.error || 'Parsing failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', statement.id);

      return NextResponse.json(
        { error: parseResult.error || 'Failed to parse bank statement file.' },
        { status: 400 }
      );
    }

    // Update statement metadata in database
    const bankName = parseResult.bankName || 'Detected Bank';
    const accountLast4 = parseResult.accountLast4 || '****';
    const cleanAccountLast4 = accountLast4.substring(Math.max(0, accountLast4.length - 4));

    await supabase
      .from('bank_statements')
      .update({
        bank_name: bankName,
        account_number_last_4: cleanAccountLast4,
        extracted_transactions_count: parseResult.transactions.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', statement.id);

    return NextResponse.json({
      success: true,
      message: 'Statement parsed successfully. Ready for chunked upload.',
      statementId: statement.id,
      bankName,
      accountLast4: cleanAccountLast4,
      transactions: parseResult.transactions,
    });
  } catch (error: any) {
    if (error.message?.includes('Dynamic server usage') || error.digest === 'DYNAMIC_SERVER_USAGE') {
      throw error;
    }
    console.error('[Upload API] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error during upload' },
      { status: 500 }
    );
  }
}

