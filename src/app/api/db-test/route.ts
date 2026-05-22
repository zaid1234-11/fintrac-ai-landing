import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 1. Security Check: Require a custom verification secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const expectedSecret = process.env.VERIFICATION_SECRET;

    // We only allow access if VERIFICATION_SECRET is set in Vercel and it matches the URL param
    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json(
        { 
          status: 'failed', 
          error: 'Unauthorized', 
          message: 'Please set VERIFICATION_SECRET in Vercel Environment Variables and pass it as ?secret=YOUR_SECRET' 
        }, 
        { status: 401 }
      );
    }

    // 2. Validate core Supabase Environment Variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { 
          status: 'failed',
          error: 'Missing Environment Variables',
          message: 'Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correctly set in Vercel.'
        }, 
        { status: 500 }
      );
    }

    // 3. Initialize Supabase Admin Client
    // We use the Service Role Key here to bypass Row Level Security (RLS) specifically for this server-side test.
    // NEVER expose the Service Role Key to the client/browser.
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    const verificationResults: any = {
      status: 'success',
      message: 'Supabase production connection verified successfully.',
      environment_variables: 'loaded',
    };

    // 4. Test Read Query
    const { data: readData, error: readError } = await supabaseAdmin
      .from('users')
      .select('id, email, created_at')
      .limit(1);

    if (readError) {
      return NextResponse.json({
        ...verificationResults,
        status: 'failed',
        step: 'read_query',
        error: readError.message,
        details: readError.details
      }, { status: 500 });
    }

    verificationResults.read_test = 'passed';
    verificationResults.sample_data = readData;

    // 5. Test Insert Query (Safe Mock Data)
    const mockId = `verification_test_${Date.now()}`;
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          id: mockId,
          email: `test_${Date.now()}@verification.fintrac.ai`,
        }
      ]);

    if (insertError) {
      return NextResponse.json({
        ...verificationResults,
        status: 'failed',
        step: 'insert_query',
        error: insertError.message,
        details: insertError.details
      }, { status: 500 });
    }

    verificationResults.insert_test = 'passed';

    // 6. Test Delete Query (Cleanup Mock Data immediately)
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', mockId);

    if (deleteError) {
       verificationResults.cleanup_test = 'failed';
       verificationResults.cleanup_error = deleteError.message;
    } else {
       verificationResults.cleanup_test = 'passed';
    }

    // 7. Return Final Verification Payload
    verificationResults.instructions = 'Connection is working perfectly. You MUST delete this route (`src/app/api/db-test/route.ts`) before final production launch for security.';
    
    return NextResponse.json(verificationResults);

  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      message: 'Unexpected server error occurred during verification',
      error: err.message || String(err)
    }, { status: 500 });
  }
}
