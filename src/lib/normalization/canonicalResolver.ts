import { CANONICAL_BRANDS } from './normalizationRules';

/**
 * Resolves a cleaned merchant string to its canonical brand or formats P2P individual names in Title Case.
 */
export function resolveCanonicalMerchant(cleanedDesc: string): { brand: string; category?: string } {
  if (!cleanedDesc || cleanedDesc === 'UNKNOWN') {
    return { brand: 'Unknown' };
  }

  const lower = cleanedDesc.toLowerCase();

  // 1. Match against known canonical brands (exact or substring check)
  for (const [key, mapping] of Object.entries(CANONICAL_BRANDS)) {
    if (lower.includes(key)) {
      return { brand: mapping.brand, category: mapping.category };
    }
  }

  // 2. Individual Person Name Formatting
  let name = cleanedDesc;

  // Strip prefixes
  const prefixes = ['MR ', 'MRS ', 'MS ', 'DR ', 'PROF ', 'MR. ', 'MRS. ', 'MS. ', 'DR. ', 'PROF. '];
  for (const prefix of prefixes) {
    if (name.startsWith(prefix)) {
      name = name.substring(prefix.length).trim();
      break;
    }
  }

  // Convert to Title Case (e.g. "SAYRA BANO" -> "Sayra Bano")
  const formattedName = toTitleCase(name);

  return { brand: formattedName };
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
