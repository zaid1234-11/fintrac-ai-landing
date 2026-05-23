import { cleanMerchantString } from '../normalization/merchantCleaner';
import { resolveCanonicalMerchant } from '../normalization/canonicalResolver';
import { CATEGORY_KEYWORDS } from '../normalization/normalizationRules';
import {
  lookupMerchantMemory,
  lookupMerchantRegistry,
  fuzzyMatchMerchantMemory,
  fuzzyMatchMerchantRegistry,
  learnMerchantMemory,
  learnMerchantRegistry,
} from './intelligenceDb';
import { classifyTransactionWithAI } from './aiClassifier';

export interface PipelineResult {
  merchant: string;
  category: string;
  confidence: number;
  source: 'merchant_memory' | 'global_registry' | 'rules' | 'fuzzy_match' | 'ai' | 'fallback_other';
  ruleMatched?: string;
  cleanedDescription: string;
}

/**
 * Runs the complete multi-stage transaction classification pipeline.
 * Evaluates:
 * 1. Cleaned text
 * 2. User Merchant Memory
 * 3. Global Merchant Registry
 * 4. Rule Engine (Keyword checks & amount heuristics)
 * 5. Fuzzy Matcher (Fuse.js against historical memory)
 * 6. AI Fallback (OpenRouter)
 * 7. Default Fallback
 */
export async function classifyTransaction(
  supabase: any,
  userId: string,
  rawDescription: string,
  amount: number,
  type: 'credit' | 'debit'
): Promise<PipelineResult> {
  // Step 1: Clean raw string
  const cleaned = cleanMerchantString(rawDescription);

  // Step 2: Canonical resolution
  const { brand: resolvedBrand, category: canonicalCategory } = resolveCanonicalMerchant(cleaned);

  // Step 3: Check User Merchant Memory
  const userMemoryHit = await lookupMerchantMemory(supabase, userId, cleaned);
  if (userMemoryHit) {
    return {
      merchant: userMemoryHit.canonical_name,
      category: userMemoryHit.category,
      confidence: userMemoryHit.confidence_score,
      source: 'merchant_memory',
      cleanedDescription: cleaned,
    };
  }

  // Step 4: Check Global Merchant Registry
  const globalRegistryHit = await lookupMerchantRegistry(supabase, cleaned);
  if (globalRegistryHit) {
    // Learn into user memory for faster future lookups
    await learnMerchantMemory(supabase, userId, cleaned, globalRegistryHit.canonical_name, globalRegistryHit.category, 0.95);
    return {
      merchant: globalRegistryHit.canonical_name,
      category: globalRegistryHit.category,
      confidence: globalRegistryHit.confidence_score,
      source: 'global_registry',
      cleanedDescription: cleaned,
    };
  }

  // Step 5: Rule Engine
  let ruleCategory: string | null = null;
  let ruleMatched: string | null = null;

  // Amount and Direction based rules
  if (type === 'credit' && amount >= 30000 && /(salary|payroll|stipend|wages|bonus)/i.test(rawDescription)) {
    ruleCategory = 'Salary';
    ruleMatched = 'Amount credit >= 30000 + salary keywords';
  } else if (type === 'debit' && amount >= 10000 && /(rent|landlord|pg stay|monthly rent)/i.test(rawDescription)) {
    ruleCategory = 'Rent';
    ruleMatched = 'Amount debit >= 10000 + rent keywords';
  } else if (canonicalCategory) {
    // Hit from canonical resolution rules dictionary
    ruleCategory = canonicalCategory;
    ruleMatched = `Canonical resolution brand mapping for ${resolvedBrand}`;
  } else {
    // General keyword mapping checks
    const cleanedLower = cleaned.toLowerCase();
    const rawLower = rawDescription.toLowerCase();

    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (cleanedLower.includes(keyword) || rawLower.includes(keyword)) {
          ruleCategory = cat;
          ruleMatched = `Keyword match: "${keyword}"`;
          break;
        }
      }
      if (ruleCategory) break;
    }
  }

  // If we got a rule match, register and return
  if (ruleCategory) {
    // Learn this pattern into DB
    await learnMerchantMemory(supabase, userId, cleaned, resolvedBrand, ruleCategory, 0.85);
    await learnMerchantRegistry(supabase, cleaned, resolvedBrand, ruleCategory, 0.85);
    return {
      merchant: resolvedBrand,
      category: ruleCategory,
      confidence: 0.85,
      source: 'rules',
      ruleMatched: ruleMatched || 'Keyword logic match',
      cleanedDescription: cleaned,
    };
  }

  // Step 6: Fuzzy Similarity Matching
  const userFuzzyHit = await fuzzyMatchMerchantMemory(supabase, userId, cleaned);
  if (userFuzzyHit) {
    return {
      merchant: userFuzzyHit.canonical_name,
      category: userFuzzyHit.category,
      confidence: userFuzzyHit.confidence_score,
      source: 'fuzzy_match',
      cleanedDescription: cleaned,
    };
  }

  const globalFuzzyHit = await fuzzyMatchMerchantRegistry(supabase, cleaned);
  if (globalFuzzyHit) {
    await learnMerchantMemory(supabase, userId, cleaned, globalFuzzyHit.canonical_name, globalFuzzyHit.category, globalFuzzyHit.confidence_score);
    return {
      merchant: globalFuzzyHit.canonical_name,
      category: globalFuzzyHit.category,
      confidence: globalFuzzyHit.confidence_score,
      source: 'fuzzy_match',
      cleanedDescription: cleaned,
    };
  }

  // Step 7: AI Fallback Engine
  const aiResult = await classifyTransactionWithAI(rawDescription, cleaned, amount, type);

  if (aiResult.category && aiResult.category !== 'Other') {
    // Learn AI's findings to build our registries
    await learnMerchantMemory(supabase, userId, cleaned, aiResult.normalized_merchant, aiResult.category, aiResult.confidence_score);
    await learnMerchantRegistry(supabase, cleaned, aiResult.normalized_merchant, aiResult.category, aiResult.confidence_score);

    return {
      merchant: aiResult.normalized_merchant,
      category: aiResult.category,
      confidence: aiResult.confidence_score,
      source: 'ai',
      ruleMatched: aiResult.reasoning,
      cleanedDescription: cleaned,
    };
  }

  // Step 8: Fallback to Other
  return {
    merchant: resolvedBrand || 'Unknown',
    category: 'Other',
    confidence: 0.50,
    source: 'fallback_other',
    cleanedDescription: cleaned,
  };
}
