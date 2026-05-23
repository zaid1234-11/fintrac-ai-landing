import { NormalizedTransaction } from '@/lib/parsers/types';
import { cleanMerchantString } from '@/lib/normalization/merchantCleaner';
import { resolveCanonicalMerchant } from '@/lib/normalization/canonicalResolver';
import { CATEGORY_KEYWORDS } from '@/lib/normalization/normalizationRules';
import { INGESTION_BATCH_SIZE } from './constants';

export { INGESTION_BATCH_SIZE };

export interface ChunkPersistenceResult {
  savedCount: number;
  transactionIds: string[];
}

export type IngestibleTransaction = Omit<NormalizedTransaction, 'timestamp'> & {
  timestamp: Date | string;
};

interface DeterministicClassification {
  merchant: string;
  category: string;
  confidence: number;
  source: 'rules' | 'fallback_other';
  ruleMatched?: string;
  cleanedDescription: string;
}

export function chunkTransactions<T>(transactions: T[], batchSize = INGESTION_BATCH_SIZE): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < transactions.length; i += batchSize) {
    chunks.push(transactions.slice(i, i + batchSize));
  }

  return chunks;
}

export async function persistTransactionChunk(params: {
  supabase: any;
  userId: string;
  transactions: IngestibleTransaction[];
  statementId?: string;
}): Promise<ChunkPersistenceResult> {
  const { supabase, userId, transactions, statementId } = params;
  const transactionIds: string[] = [];
  let savedCount = 0;

  for (const rawTx of transactions) {
    const originalDescription = rawTx.raw_payload?.original_description || rawTx.merchant || 'Statement transaction';
    const classification = classifyDeterministically(
      originalDescription,
      rawTx.amount,
      rawTx.transaction_type
    );

    const categoryId = await getOrCreateCategory(
      supabase,
      userId,
      classification.category,
      rawTx.transaction_type
    );

    const { data: newTx, error: insertErr } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        category_id: categoryId,
        amount: rawTx.amount,
        currency: rawTx.currency || 'INR',
        type: rawTx.transaction_type,
        status: 'completed',
        merchant_name: classification.merchant,
        upi_id: rawTx.transaction_ref_id || null,
        description: originalDescription,
        date: new Date(rawTx.timestamp).toISOString(),
        ai_confidence_score: classification.confidence,
        classification_source: classification.source,
        normalized_merchant: classification.merchant,
        raw_parsed_data: {
          ...rawTx.raw_payload,
          deterministic_categorization: {
            category: classification.category,
            confidence: classification.confidence,
            classification_source: classification.source,
            rule_matched: classification.ruleMatched || null,
          },
        },
        source: rawTx.source || 'statement',
        source_id: statementId || null,
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error('[Chunk Persistence] Insert error:', insertErr);
      continue;
    }

    if (!newTx) continue;

    savedCount++;
    transactionIds.push(newTx.id);

    const { error: classErr } = await supabase
      .from('transaction_classifications')
      .insert({
        transaction_id: newTx.id,
        raw_description: originalDescription,
        cleaned_description: classification.cleanedDescription,
        resolved_merchant: classification.merchant,
        category: classification.category,
        confidence_score: classification.confidence,
        classification_source: classification.source,
        rule_matched: classification.ruleMatched || null,
      });

    if (classErr) {
      console.error('[Chunk Persistence] Classification log error:', classErr);
    }
  }

  return {
    savedCount,
    transactionIds,
  };
}

function classifyDeterministically(
  rawDescription: string,
  amount: number,
  type: 'credit' | 'debit'
): DeterministicClassification {
  const cleanedDescription = cleanMerchantString(rawDescription);
  const { brand, category: canonicalCategory } = resolveCanonicalMerchant(cleanedDescription);

  let category = canonicalCategory || '';
  let ruleMatched = canonicalCategory ? `Canonical resolution brand mapping for ${brand}` : '';

  if (type === 'credit' && amount >= 30000 && /(salary|payroll|stipend|wages|bonus)/i.test(rawDescription)) {
    category = 'Salary';
    ruleMatched = 'Amount credit >= 30000 + salary keywords';
  } else if (type === 'debit' && amount >= 10000 && /(rent|landlord|pg stay|monthly rent)/i.test(rawDescription)) {
    category = 'Rent';
    ruleMatched = 'Amount debit >= 10000 + rent keywords';
  } else if (!category) {
    const cleanedLower = cleanedDescription.toLowerCase();
    const rawLower = rawDescription.toLowerCase();

    for (const [candidateCategory, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      const keyword = keywords.find((item) => cleanedLower.includes(item) || rawLower.includes(item));
      if (keyword) {
        category = candidateCategory;
        ruleMatched = `Keyword match: "${keyword}"`;
        break;
      }
    }
  }

  if (category) {
    return {
      merchant: brand || cleanedDescription || 'Unknown',
      category,
      confidence: 0.85,
      source: 'rules',
      ruleMatched,
      cleanedDescription,
    };
  }

  return {
    merchant: brand || cleanedDescription || 'Unknown',
    category: 'Other',
    confidence: 0.5,
    source: 'fallback_other',
    cleanedDescription,
  };
}

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

    const { data: newCategory, error: insertError } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name: categoryName,
        type,
        icon: categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase(),
        color: type === 'credit' ? '#10b981' : '#6366f1',
      })
      .select('id')
      .single();

    if (insertError) throw insertError;
    return newCategory?.id || null;
  } catch (err) {
    console.error(`[Chunk Persistence] Failed to resolve category "${categoryName}":`, err);
    return null;
  }
}
