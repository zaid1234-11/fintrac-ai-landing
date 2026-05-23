import Fuse from 'fuse.js';

export interface MerchantLookupResult {
  canonical_name: string;
  category: string;
  confidence_score: number;
}

/**
 * Looks up an exact raw pattern match in the user's custom merchant memory database.
 */
export async function lookupMerchantMemory(
  supabase: any,
  userId: string,
  rawPattern: string
): Promise<MerchantLookupResult | null> {
  try {
    const { data, error } = await supabase
      .from('merchant_memory')
      .select('canonical_name, category, confidence_score')
      .eq('user_id', userId)
      .eq('raw_pattern', rawPattern.toUpperCase())
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return {
      canonical_name: data[0].canonical_name,
      category: data[0].category,
      confidence_score: Number(data[0].confidence_score),
    };
  } catch (e) {
    console.error('[lookupMerchantMemory] Error:', e);
    return null;
  }
}

/**
 * Looks up an exact raw pattern match in the global shared merchant registry database.
 */
export async function lookupMerchantRegistry(
  supabase: any,
  rawPattern: string
): Promise<MerchantLookupResult | null> {
  try {
    const { data, error } = await supabase
      .from('merchant_registry')
      .select('canonical_name, category, confidence_score')
      .eq('raw_pattern', rawPattern.toUpperCase())
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return {
      canonical_name: data[0].canonical_name,
      category: data[0].category,
      confidence_score: Number(data[0].confidence_score),
    };
  } catch (e) {
    console.error('[lookupMerchantRegistry] Error:', e);
    return null;
  }
}

/**
 * Inserts or updates a user-specific merchant mapping in the database (custom override learning).
 */
export async function learnMerchantMemory(
  supabase: any,
  userId: string,
  rawPattern: string,
  canonicalName: string,
  category: string,
  confidence: number = 1.00
): Promise<void> {
  try {
    const pattern = rawPattern.toUpperCase();
    
    // Check if record already exists to increment count
    const { data: existing } = await supabase
      .from('merchant_memory')
      .select('id, usage_count')
      .eq('user_id', userId)
      .eq('raw_pattern', pattern)
      .limit(1);

    if (existing && existing.length > 0) {
      await supabase
        .from('merchant_memory')
        .update({
          canonical_name: canonicalName,
          category,
          confidence_score: confidence,
          usage_count: (existing[0].usage_count || 1) + 1,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing[0].id);
    } else {
      await supabase
        .from('merchant_memory')
        .insert({
          user_id: userId,
          raw_pattern: pattern,
          canonical_name: canonicalName,
          category,
          confidence_score: confidence,
          usage_count: 1,
          last_seen: new Date().toISOString(),
        });
    }
  } catch (e) {
    console.error('[learnMerchantMemory] Failed:', e);
  }
}

/**
 * Inserts or updates a global shared merchant mapping in the database.
 */
export async function learnMerchantRegistry(
  supabase: any,
  rawPattern: string,
  canonicalName: string,
  category: string,
  confidence: number = 0.95
): Promise<void> {
  try {
    const pattern = rawPattern.toUpperCase();
    
    // Check if record exists
    const { data: existing } = await supabase
      .from('merchant_registry')
      .select('id, usage_count')
      .eq('raw_pattern', pattern)
      .limit(1);

    if (existing && existing.length > 0) {
      await supabase
        .from('merchant_registry')
        .update({
          canonical_name: canonicalName,
          category,
          confidence_score: confidence,
          usage_count: (existing[0].usage_count || 1) + 1,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing[0].id);
    } else {
      await supabase
        .from('merchant_registry')
        .insert({
          raw_pattern: pattern,
          canonical_name: canonicalName,
          category,
          confidence_score: confidence,
          usage_count: 1,
          last_seen: new Date().toISOString(),
        });
    }
  } catch (e) {
    console.error('[learnMerchantRegistry] Failed:', e);
  }
}

interface MemoryItem {
  raw_pattern: string;
  canonical_name: string;
  category: string;
  confidence_score: number;
}

/**
 * Performs fuzzy matching against the user's historical merchant memories using Fuse.js.
 */
export async function fuzzyMatchMerchantMemory(
  supabase: any,
  userId: string,
  cleanedMerchant: string
): Promise<MerchantLookupResult | null> {
  try {
    const { data: memories, error } = await supabase
      .from('merchant_memory')
      .select('raw_pattern, canonical_name, category, confidence_score')
      .eq('user_id', userId);

    if (error || !memories || memories.length === 0) return null;

    const typedMemories = memories as unknown as MemoryItem[];
    const fuse = new Fuse<MemoryItem>(typedMemories, {
      keys: ['raw_pattern'],
      threshold: 0.25, // Strict matching threshold (closer to 0.0 is perfect)
      includeScore: true,
    });

    const results = fuse.search(cleanedMerchant.toUpperCase());
    if (results.length > 0) {
      const best = results[0];
      const score = best.score ?? 1;
      const similarity = 1 - score;

      if (similarity >= 0.75) {
        return {
          canonical_name: best.item.canonical_name,
          category: best.item.category,
          confidence_score: Number((Number(best.item.confidence_score) * similarity).toFixed(2)),
        };
      }
    }
    return null;
  } catch (e) {
    console.error('[fuzzyMatchMerchantMemory] Error:', e);
    return null;
  }
}

/**
 * Performs fuzzy matching against the global shared registry database.
 */
export async function fuzzyMatchMerchantRegistry(
  supabase: any,
  cleanedMerchant: string
): Promise<MerchantLookupResult | null> {
  try {
    const { data: registry, error } = await supabase
      .from('merchant_registry')
      .select('raw_pattern, canonical_name, category, confidence_score');

    if (error || !registry || registry.length === 0) return null;

    const typedRegistry = registry as unknown as MemoryItem[];
    const fuse = new Fuse<MemoryItem>(typedRegistry, {
      keys: ['raw_pattern'],
      threshold: 0.25,
      includeScore: true,
    });

    const results = fuse.search(cleanedMerchant.toUpperCase());
    if (results.length > 0) {
      const best = results[0];
      const score = best.score ?? 1;
      const similarity = 1 - score;

      if (similarity >= 0.75) {
        return {
          canonical_name: best.item.canonical_name,
          category: best.item.category,
          confidence_score: Number((Number(best.item.confidence_score) * similarity).toFixed(2)),
        };
      }
    }
    return null;
  } catch (e) {
    console.error('[fuzzyMatchMerchantRegistry] Error:', e);
    return null;
  }
}
