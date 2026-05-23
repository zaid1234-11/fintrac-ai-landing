import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cleanMerchantString } from '@/lib/normalization/merchantCleaner';
import { resolveCanonicalMerchant } from '@/lib/normalization/canonicalResolver';
import { learnMerchantMemory, learnMerchantRegistry } from '@/lib/ai/intelligenceDb';
import { generateBehavioralInsights } from '@/lib/ai/behavioralIntel';

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

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { transactionId, category } = body;

    if (!transactionId || !category) {
      return NextResponse.json({ error: 'Missing required parameters: transactionId and category' }, { status: 400 });
    }

    // Initialize clients
    const userSupabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. Fetch transaction using user-scoped client to guarantee ownership (RLS)
    const { data: tx, error: fetchErr } = await userSupabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (fetchErr || !tx) {
      return NextResponse.json({ error: 'Transaction not found or access denied' }, { status: 404 });
    }

    const rawDesc = tx.description || 'Manual correction';
    const type = tx.type; // 'credit' | 'debit'

    // 2. Normalize and resolve brand
    const cleaned = cleanMerchantString(rawDesc);
    const { brand } = resolveCanonicalMerchant(cleaned);

    // 3. Update User Memory and Global Registry (using admin client to bypass user RLS constraints on write)
    await learnMerchantMemory(adminSupabase, userId, cleaned, brand, category, 1.00);
    await learnMerchantRegistry(adminSupabase, cleaned, brand, category, 0.95);

    // 4. Resolve corrected category ID
    const categoryId = await getOrCreateCategory(adminSupabase, userId, category, type);
    if (!categoryId) {
      return NextResponse.json({ error: 'Failed to resolve or create category' }, { status: 500 });
    }

    // 5. Update transaction records in DB
    const { error: updateErr } = await adminSupabase
      .from('transactions')
      .update({
        category_id: categoryId,
        merchant_name: brand,
        normalized_merchant: brand,
        classification_source: 'manual',
        ai_confidence_score: 1.00,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId);

    if (updateErr) {
      console.error('[Correct Transaction API] Update error:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 6. Update transaction_classifications audit record
    await adminSupabase
      .from('transaction_classifications')
      .upsert({
        transaction_id: transactionId,
        raw_description: rawDesc,
        cleaned_description: cleaned,
        resolved_merchant: brand,
        category: category,
        confidence_score: 1.00,
        classification_source: 'manual',
        rule_matched: 'User manual override correction loop'
      }, { onConflict: 'transaction_id' });

    // 7. Re-generate behavioral insights now that spending categories have changed
    await generateBehavioralInsights(adminSupabase, userId);

    return NextResponse.json({ success: true, brand, category });
  } catch (error: any) {
    if (error.message?.includes('Dynamic server usage') || error.digest === 'DYNAMIC_SERVER_USAGE') {
      throw error;
    }
    console.error('[Correct Transaction API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
