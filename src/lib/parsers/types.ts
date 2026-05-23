export interface NormalizedTransaction {
  merchant: string;
  amount: number;
  currency: string;
  transaction_type: 'credit' | 'debit';
  payment_method: 'UPI' | 'Card' | 'NetBanking' | 'Cash' | 'Transfer' | 'Other';
  timestamp: Date;
  source: 'sms' | 'statement' | 'manual';
  raw_payload: Record<string, any>;
  transaction_ref_id?: string;
  bank_name?: string;
  category?: string;
}

export interface ParserResult {
  success: boolean;
  transactions: NormalizedTransaction[];
  accountLast4?: string;
  bankName?: string;
  error?: string;
}

export interface ParserAdapter {
  name: string;
  supportedExtensions: string[];
  parse(fileBuffer: Buffer, filename: string, password?: string): Promise<ParserResult>;
}

export type TransactionDirection = 'credit' | 'debit';

export interface BankParserTransaction {
  date: Date;
  amount: number;
  direction: TransactionDirection;
  rawDescription: string;
  runningBalance: number;
  rawLine: string;
  transactionRefId?: string;
  paymentMethod?: NormalizedTransaction['payment_method'];
}

export interface BankParserContext {
  text: string;
  lines: string[];
  bankName: string;
  filename: string;
}

export interface BankParserResult {
  transactions: BankParserTransaction[];
  accountLast4?: string;
}

export interface BaseBankParser {
  bankName: string;
  parse(context: BankParserContext): Promise<BankParserResult> | BankParserResult;
}
