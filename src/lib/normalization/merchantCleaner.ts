/**
 * Normalizes raw transaction text to isolate the underlying merchant name by stripping
 * transaction IDs, UPI handles, location codes, bank prefixes, and payment gateway noise.
 */
export function cleanMerchantString(desc: string): string {
  if (!desc) return '';

  let cleaned = desc.toUpperCase();

  // 1. Remove UPI prefix headers and path prefixes
  cleaned = cleaned.replace(/^(UPI\/P2[MP]\/\d+@[^/]+\/)/i, '');
  cleaned = cleaned.replace(/^(UPI\/[A-Z]{2}\/)/i, ''); // e.g. UPI/DR/, UPI/CR/
  cleaned = cleaned.replace(/^(IMPS[-/]|NEFT[-/]|RTGS[-/]|CDM[-/]|INT\.? PD\.?[-/])/i, '');
  cleaned = cleaned.replace(/^RECD:IMPS\/\d+\//i, '');
  cleaned = cleaned.replace(/^(UPI\/)/i, '');

  // 2. Split by slashes to find standard parts
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/').map(p => p.trim()).filter(Boolean);
    // Find the best candidate block in the split (avoid headers, action words, numbers)
    let bestBlock = '';
    for (const part of parts) {
      const up = part.toUpperCase();
      if (
        up !== 'UPI' &&
        up !== 'DR' &&
        up !== 'CR' &&
        !up.includes('SENT USING') &&
        !up.includes('PAID VIA') &&
        up !== 'NA' &&
        !/^\d+$/.test(part) && // skip pure numbers
        part.length > 2
      ) {
        bestBlock = part;
        break;
      }
    }
    if (bestBlock) {
      cleaned = bestBlock;
    }
  }

  // 3. Remove trailing payment handle VPAs (e.g. @okaxis, @ybl, @upi, @okicici, @paytm)
  cleaned = cleaned.replace(/@\w+$/, '');

  // 4. Remove standard transaction codes and reference numbers (e.g. UPI-609106267054)
  cleaned = cleaned.replace(/\b(UPI|IMPS|NEFT|RTGS|REF|TXN|ID)[-\s]*\d+\b/gi, '');
  cleaned = cleaned.replace(/\b\d{12}\b/g, ''); // 12-digit UPI reference number
  cleaned = cleaned.replace(/\b\d{6,}\b/g, ''); // any other long number sequences (6+ digits)

  // 5. Remove location suffixes like -BLR, -MUM, -DEL, -HYD, -CHE, -PUN, -GGN, -NOI, etc.
  cleaned = cleaned.replace(/[- ](BLR|MUM|DEL|HYD|CHE|PUN|GGN|NOI|BANGALORE|MUMBAI|DELHI|GURGAON|NOIDA|BENGALURU)\b/gi, '');

  // 6. Remove corporate legal entity suffixes
  cleaned = cleaned.replace(/\b(PVT|LTD|PRIVATE|LIMITED|CO|CORP|INC|LLP|IN)\b/gi, '');

  // 7. Remove common action descriptions
  cleaned = cleaned.replace(/\b(SENT USING PAYT|PAID VIA NAVI U|PAID VIA|VALUE DATE:|SENT TO|RECEIVED FROM|RECD:)\b/gi, '');

  // 8. Clean up symbols, brackets, double spaces
  cleaned = cleaned.replace(/[()\-#*_+,.:;]/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned || 'UNKNOWN';
}
