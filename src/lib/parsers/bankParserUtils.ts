import {
  BankParserTransaction,
  NormalizedTransaction,
  TransactionDirection,
} from './types';
import {
  cleanUPIMerchant,
  extractUPIReference,
  isUPITransaction,
} from './upi-parser';

const BALANCE_TOLERANCE = 0.01;

export function cleanNumeric(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.\-]/g, '');
  return parseFloat(cleaned) || 0;
}

export function cleanGeneralMerchant(desc: string): string {
  return desc
    .replace(/(POS|ATM|WDL|FT|NEFT|RTGS|CHG|COMM|DR|CR)\b/gi, '')
    .replace(/\d{4,}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50) || 'General Merchant';
}

export function parseDate(dateStr: string): Date {
  const cleanStr = dateStr.replace(/[.\-_]/g, '/');

  const wordMonthMatch = cleanStr.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2,4})$/);
  if (wordMonthMatch) {
    const day = parseInt(wordMonthMatch[1]);
    const monthStr = wordMonthMatch[2].toLowerCase();
    let year = parseInt(wordMonthMatch[3]);
    if (year < 100) year += 2000;

    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };

    return new Date(year, months[monthStr] ?? 0, day);
  }

  const date = new Date(cleanStr);
  if (!isNaN(date.getTime())) return date;

  const parts = cleanStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    let year = parseInt(parts[2]);
    if (year < 100) year += 2000;

    const parsedDate = new Date(year, month, day);
    if (!isNaN(parsedDate.getTime())) return parsedDate;
  }

  return new Date(dateStr);
}

export function isCreditDescription(desc: string): boolean {
  const d = desc.toLowerCase();
  return (
    d.includes('recd:') ||
    d.includes('refund') ||
    d.includes('credit') ||
    d.includes('deposit') ||
    d.includes('interest') ||
    d.includes('salary') ||
    d.includes('received') ||
    d.endsWith('/upi') ||
    d.includes('cr')
  );
}

export function resolveDirectionFromRunningBalance(params: {
  previousBalance: number | null;
  currentBalance: number;
  amount: number;
  rawDescription: string;
  rawLine: string;
  bankName: string;
}): TransactionDirection {
  const { previousBalance, currentBalance, amount, rawDescription, rawLine, bankName } = params;

  if (previousBalance === null) {
    return isCreditDescription(rawDescription) ? 'credit' : 'debit';
  }

  const delta = Number((currentBalance - previousBalance).toFixed(2));
  if (Math.abs(delta) <= BALANCE_TOLERANCE) {
    return isCreditDescription(rawDescription) ? 'credit' : 'debit';
  }

  const direction: TransactionDirection = delta > 0 ? 'credit' : 'debit';
  const expectedAmount = Math.abs(delta);

  if (Math.abs(expectedAmount - amount) > BALANCE_TOLERANCE) {
    throw new Error(
      `${bankName} running balance mismatch for "${rawLine}". Expected amount ${expectedAmount.toFixed(2)} from balance delta, parsed ${amount.toFixed(2)}.`
    );
  }

  return direction;
}

export function inferPaymentMethod(description: string): NormalizedTransaction['payment_method'] {
  const lower = description.toLowerCase();
  if (isUPITransaction(description)) return 'UPI';
  if (lower.includes('card') || lower.includes('pos')) return 'Card';
  if (lower.includes('atm') || lower.includes('cash')) return 'Cash';
  if (lower.includes('neft') || lower.includes('rtgs') || lower.includes('imps')) return 'Transfer';
  return 'NetBanking';
}

export function toNormalizedTransactions(
  rows: BankParserTransaction[],
  bankName: string,
  parsedVia: string
): NormalizedTransaction[] {
  return rows
    .filter((row) => row.amount > 0 && !isNaN(row.date.getTime()))
    .map((row) => {
      const isUPI = isUPITransaction(row.rawDescription);
      const merchant = isUPI
        ? cleanUPIMerchant(row.rawDescription)
        : cleanGeneralMerchant(row.rawDescription);

      return {
        merchant,
        amount: row.amount,
        currency: 'INR',
        transaction_type: row.direction,
        payment_method: row.paymentMethod || inferPaymentMethod(row.rawDescription),
        timestamp: row.date,
        source: 'statement',
        raw_payload: {
          original_description: row.rawDescription,
          running_balance: row.runningBalance,
          parsed_via: parsedVia,
          raw_line: row.rawLine,
        },
        transaction_ref_id: row.transactionRefId || (isUPI ? extractUPIReference(row.rawDescription) : undefined),
        bank_name: bankName,
      };
    });
}

export function parseGenericBalanceAwareRows(
  lines: string[],
  bankName: string,
  parsedVia: string
): BankParserTransaction[] {
  const dateRegex = /^(?:\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})/i;
  const rows: BankParserTransaction[] = [];
  let lastBalance: number | null = null;

  for (const line of lines) {
    const dateMatch = line.match(dateRegex);
    if (!dateMatch) continue;

    const dateStr = dateMatch[0];
    const date = parseDate(dateStr);
    if (isNaN(date.getTime())) continue;

    const remainder = line.substring(dateStr.length).trim();
    const numbersMatch = remainder.match(/(.*?)\s+([\-\+]?[\d,]+\.\d{2})(?:\s+([\-\+]?[\d,]+\.\d{2}))?(?:\s+([\-\+]?[\d,]+\.\d{2}))?\s*$/);
    if (!numbersMatch) continue;

    const rawDescription = numbersMatch[1].trim();
    if (shouldSkipStatementRow(rawDescription)) continue;

    const firstNum = cleanNumeric(numbersMatch[2]);
    const secondNum = numbersMatch[3] ? cleanNumeric(numbersMatch[3]) : null;
    const thirdNum = numbersMatch[4] ? cleanNumeric(numbersMatch[4]) : null;

    let amount = 0;
    let balance: number | null = null;

    if (secondNum !== null && thirdNum !== null) {
      amount = firstNum > 0 ? firstNum : secondNum;
      balance = thirdNum;
    } else if (secondNum !== null) {
      amount = firstNum;
      balance = secondNum;
    }

    if (balance === null || amount === 0) continue;

    const direction = resolveDirectionFromRunningBalance({
      previousBalance: lastBalance,
      currentBalance: balance,
      amount,
      rawDescription,
      rawLine: line,
      bankName,
    });

    lastBalance = balance;

    rows.push({
      date,
      amount,
      direction,
      rawDescription,
      runningBalance: balance,
      rawLine: line,
      transactionRefId: extractUPIReference(rawDescription),
      paymentMethod: inferPaymentMethod(rawDescription),
    });
  }

  if (rows.length === 0) {
    console.warn(`[${parsedVia}] No balance-aware rows parsed for ${bankName}.`);
  }

  return rows;
}

function shouldSkipStatementRow(rawDescription: string): boolean {
  const lower = rawDescription.toLowerCase();
  return (
    lower.includes('total') ||
    lower.includes('balance') ||
    lower.includes('opening') ||
    lower.includes('closing')
  );
}
