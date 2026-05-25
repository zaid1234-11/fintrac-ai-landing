import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cleanMerchantString } from '@/lib/normalization/merchantCleaner';
import { resolveCanonicalMerchant } from '@/lib/normalization/canonicalResolver';
import { learnMerchantMemory, learnMerchantRegistry } from '@/lib/ai/intelligenceDb';
import { generateBehavioralInsights } from '@/lib/ai/behavioralIntel';
import { inngest } from '@/lib/jobs/inngest-client';

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
      .select(`
        *,
        categories:category_id (
          name
        )
      `)
      .eq('id', transactionId)
      .single();

    if (fetchErr || !tx) {
      return NextResponse.json({ error: 'Transaction not found or access denied' }, { status: 404 });
    }

    const originalCategory = tx.categories?.name || 'Other';
    const rawDesc = tx.description || 'Manual correction';
    const type = tx.type; // 'credit' | 'debit'

    // 2. Normalize and resolve brand
    const cleaned = cleanMerchantString(rawDesc);
    const { brand } = resolveCanonicalMerchant(cleaned);

    // 3. Update User Memory and Global Registry (using admin client to bypass user RLS constraints on write)
    // Upsert merchant memory with incremented usage count and 1.0 confidence score
    const { data: existingMemory } = await adminSupabase
      .from('merchant_memory')
      .select('id, usage_count')
      .eq('user_id', userId)
      .eq('raw_pattern', cleaned.toUpperCase())
      .limit(1);

    const usageCount = existingMemory && existingMemory.length > 0 
      ? (existingMemory[0].usage_count || 1) + 1 
      : 1;

    const { error: memoryErr } = await adminSupabase
      .from('merchant_memory')
      .upsert({
        user_id: userId,
        raw_pattern: cleaned.toUpperCase(),
        canonical_name: brand,
        category: category,
        confidence_score: 1.00,
        usage_count: usageCount,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,raw_pattern' });

    if (memoryErr) {
      console.error('[Correct Transaction API] Merchant Memory Upsert error:', memoryErr);
    }

    // Crowd-sourcing Merchant Intelligence / Global Registry Stub
    // Pushes this correction globally so other users benefit from the corrected categorization
    await learnMerchantRegistry(adminSupabase, cleaned, brand, category, 0.95);

    // 4. Resolve corrected category ID
    const categoryId = await getOrCreateCategory(adminSupabase, userId, category, type);
    if (!categoryId) {
      return NextResponse.json({ error: 'Failed to resolve or create category' }, { status: 500 });
    }

    // 5. Update transaction records in DB and retrieve updated item
    const { data: updatedTx, error: updateErr } = await adminSupabase
      .from('transactions')
      .update({
        category_id: categoryId,
        merchant_name: brand,
        normalized_merchant: brand,
        classification_source: 'manual',
        ai_confidence_score: 1.00,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId)
      .select(`
        *,
        categories:category_id (
          name
        )
      `)
      .single();

    if (updateErr || !updatedTx) {
      console.error('[Correct Transaction API] Update error:', updateErr);
      return NextResponse.json({ error: updateErr?.message || 'Failed to update transaction' }, { status: 500 });
    }

    // 6. Log correction to intelligence_telemetry for future ML training
    const { error: telemetryErr } = await adminSupabase
      .from('intelligence_telemetry')
      .upsert({
        metric_date: new Date().toISOString().split('T')[0],
        metric_name: `correction_${transactionId}`,
        metric_value: 1.0,
        metadata: {
          original_category: originalCategory,
          corrected_category: category,
          transaction_id: transactionId,
          merchant_name: brand,
          cleaned_description: cleaned
        }
      }, { onConflict: 'metric_date,metric_name' });

    if (telemetryErr) {
      console.error('[Correct Transaction API] Telemetry insert error:', telemetryErr);
    }

    // 7. Update transaction_classifications audit record
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

    // 8. Trigger async background insights recomputation via Inngest event
    try {
      await inngest.send({
        name: 'fintrac/user.insights.recalculate',
        data: { userId }
      });
      console.log(`[Correct Transaction API] Dispatched Inngest insights recalculation event for user: ${userId}`);
    } catch (inngestErr) {
      console.error('[Correct Transaction API] Failed to trigger Inngest async event, falling back to sync:', inngestErr);
      await generateBehavioralInsights(adminSupabase, userId);
    }

    // Map database schema to Context type
    const responseTx = {
      id: updatedTx.id,
      merchant: updatedTx.merchant_name || 'Unknown',
      amount: Number(updatedTx.amount),
      type: updatedTx.type,
      date: updatedTx.date || updatedTx.created_at,
      category: updatedTx.categories?.name || category,
      description: updatedTx.description,
      upi_id: updatedTx.upi_id,
      blockchain_hash: updatedTx.blockchain_hash,
      source: updatedTx.source,
      classification_source: updatedTx.classification_source,
      ai_confidence_score: updatedTx.ai_confidence_score ? Number(updatedTx.ai_confidence_score) : 1.00,
    };

    return NextResponse.json(responseTx);
  } catch (error: any) {
    if (error.message?.includes('Dynamic server usage') || error.digest === 'DYNAMIC_SERVER_USAGE') {
      throw error;
    }
    console.error('[Correct Transaction API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
