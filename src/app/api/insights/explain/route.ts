import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const insightId = searchParams.get('insight_id');

    if (!insightId) {
      return NextResponse.json(
        { error: 'insight_id parameter is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch the explanation from insight_explanations
    const { data: explanation, error: explanationError } = await supabase
      .from('insight_explanations')
      .select('*')
      .eq('insight_id', insightId)
      .single();

    if (explanationError) {
      console.error('[API] Error fetching explanation:', explanationError);
      return NextResponse.json(
        { error: 'Failed to fetch explanation' },
        { status: 500 }
      );
    }

    if (!explanation) {
      return NextResponse.json(
        { error: 'Explanation not found' },
        { status: 404 }
      );
    }

    // Fetch the source transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id, amount, type, date, merchant_name, description, categories(name)')
      .in('id', explanation.source_transaction_ids);

    if (transactionsError) {
      console.error('[API] Error fetching transactions:', transactionsError);
      return NextResponse.json(
        { error: 'Failed to fetch source transactions' },
        { status: 500 }
      );
    }

    // Return the merged payload
    return NextResponse.json({
      explanation: {
        trigger_reason: explanation.trigger_reason,
        recurrence_signals: explanation.recurrence_signals,
        source_transactions: transactions || [],
      },
    });
  } catch (error: any) {
    if (error.message?.includes('Dynamic server usage') || error.digest === 'DYNAMIC_SERVER_USAGE') {
      throw error;
    }
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
