import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { uploadStatement } from '@/lib/storage/actions';
import { createClient } from '@/lib/supabase/server';
import { inngest } from '@/lib/jobs/inngest-client';

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
        bank_name: 'Analyzing...', // will be updated by parser
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

    // 7. Fire Inngest background event
    console.log(`[Upload API] Dispatching statement.uploaded for statementId: ${statement.id}`);
    await inngest.send({
      name: 'statement.uploaded',
      data: {
        userId,
        statementId: statement.id,
        filePath: uploadResult.filePath,
        filename: file.name,
        password,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Statement uploaded and queued for processing successfully.',
      statement,
    });
  } catch (error: any) {
    console.error('[Upload API] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error during upload' },
      { status: 500 }
    );
  }
}
