import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { generateBehavioralInsights } from '@/lib/ai/behavioralIntel';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const statementId = body.statement_id || body.statementId;

    const supabase = await createClient();
    await generateBehavioralInsights(supabase, userId);

    if (statementId) {
      await supabase
        .from('bank_statements')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', statementId)
        .eq('user_id', userId);
    }

    return NextResponse.json({
      success: true,
      message: 'Financial wellness insights generated.',
    });
  } catch (error: any) {
    if (error.message?.includes('Dynamic server usage') || error.digest === 'DYNAMIC_SERVER_USAGE') {
      throw error;
    }

    console.error('[Insights Generate API] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Insight generation failed' },
      { status: 500 }
    );
  }
}

