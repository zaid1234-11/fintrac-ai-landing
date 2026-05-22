/**
 * Utility for parsing and identifying UPI transaction formats in Indian banks
 */

/**
 * Checks if a transaction description matches standard UPI formatting
 */
export function isUPITransaction(description: string): boolean {
  const desc = description.toUpperCase();
  return (
    desc.includes('UPI') ||
    desc.includes('VPA') ||
    /@upi\b/i.test(description) ||
    /upi\//i.test(description)
  );
}

/**
 * Extracts the 12-digit UPI transaction reference ID (UTR) if available
 */
export function extractUPIReference(description: string): string | undefined {
  // UPI Reference numbers (UTRs) in India are typically 12-digit numeric sequences
  const match = description.match(/\b\d{12}\b/);
  if (match) {
    return match[0];
  }
  
  // Alternative matches for formats like UPI/123456789012/Name
  const slashMatch = description.match(/upi\/(\d{12})/i);
  if (slashMatch) {
    return slashMatch[1];
  }

  return undefined;
}

/**
 * Cleans a raw UPI transaction description to isolate the true merchant/counterparty
 */
export function cleanUPIMerchant(description: string): string {
  if (!description) return 'Unknown';

  // Example: "UPI/314159265358/Payee Name/Bank Name/UPI-ID"
  // Example: "UPI-ZOMATO-HDFC-9283928@upi"
  // Example: "UPI/DR/ZOMATO MEDIA PVT/9128391283"
  
  let cleaned = description;

  // Split by slashes if it follows standard UPI path format
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/').map(p => p.trim()).filter(Boolean);
    // Standard format: UPI / [Direction/DR/CR] / [Ref] / [Merchant/Name] ...
    // Try to find the first block that is not "UPI", "DR", "CR", or a pure number
    for (const part of parts) {
      if (
        part.toUpperCase() !== 'UPI' &&
        part.toUpperCase() !== 'DR' &&
        part.toUpperCase() !== 'CR' &&
        !/^\d+$/.test(part) &&
        part.length > 2
      ) {
        cleaned = part;
        break;
      }
    }
  }

  // Remove common payment handles/VPA details like @upi, @okaxis, @ybl, etc.
  cleaned = cleaned.replace(/@\w+$/, '');
  
  // Remove transaction codes, suffixes, bank abbreviations
  cleaned = cleaned
    .replace(/\b(UPI|DR|CR|TRANSFER|PAYMENT|IMPS|NEFT|RTGS)\b/gi, '')
    .replace(/\d{4,}/g, '') // remove large numbers/IDs
    .replace(/\s+/g, ' ')
    .trim();

  // If nothing remains or is too short, return the original minus digits
  if (cleaned.length < 2) {
    cleaned = description
      .replace(/\d+/g, '')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return cleaned || 'Unknown Merchant';
}
