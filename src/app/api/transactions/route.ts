import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = "force-dynamic";

/**
 * Helper to check or create a transaction category dynamically to avoid foreign key errors
 */
async function getOrCreateCategory(
  supabase: any,
  userId: string,
  categoryName: string,
  type: 'credit' | 'debit'
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id')
      .eq('name', categoryName)
      .eq('type', type)
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      return data[0].id;
    }

    const { data: newCat, error: insertError } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name: categoryName,
        type,
        icon: categoryName,
        color: type === 'credit' ? '#10b981' : '#6366f1',
      })
      .select('id')
      .single();

    if (insertError) throw insertError;
    return newCat?.id || null;
  } catch (err) {
    console.error(`[getOrCreateCategory API] Failed for "${categoryName}":`, err);
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const type = searchParams.get('type'); // 'credit' | 'debit'
    const categoryName = searchParams.get('category');

    const supabase = await createClient();

    let query = supabase
      .from('transactions')
      .select('*, categories(*)')
      .order('date', { ascending: false })
      .limit(limit);

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('[Transactions GET API] Select error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter by category name in JS if needed (since it's a joined relation)
    let result = transactions || [];
    if (categoryName && categoryName !== 'all') {
      result = result.filter(
        (t: any) => t.categories?.name?.toLowerCase() === categoryName.toLowerCase()
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message?.includes('Dynamic server usage') || error.digest === 'DYNAMIC_SERVER_USAGE') {
      throw error;
    }
    console.error('[Transactions GET API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { merchant, amount, type, category, date, description, upi_id } = body;

    if (!merchant || !amount || !type || !category) {
      return NextResponse.json(
        { error: 'Merchant, amount, type, and category are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Resolve category UUID
    const categoryId = await getOrCreateCategory(supabase, userId, category, type);

    // 2. Insert transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        category_id: categoryId,
        merchant_name: merchant,
        amount: parseFloat(amount),
        type,
        status: 'completed',
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        description: description || 'Manual transaction',
        upi_id: upi_id || null,
        source: 'manual',
        ai_confidence_score: 1.0, // manually created is 100% confidence
      })
      .select('*, categories(*)')
      .single();

    if (error) {
      console.error('[Transactions POST API] Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(transaction);
  } catch (error: any) {
    if (error.message?.includes('Dynamic server usage') || error.digest === 'DYNAMIC_SERVER_USAGE') {
      throw error;
    }
    console.error('[Transactions POST API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
