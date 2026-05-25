// 1. Polyfill DOMMatrix for the Node.js server environment to prevent crashes in the PDF parser
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {}
    // Add dummy properties to satisfy the PDF parser
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
  } as any;
}

import { ParserAdapter, ParserResult } from './types';
import { getParserForBank } from './bankParserFactory';
import { toNormalizedTransactions } from './bankParserUtils';

export class PDFBankStatementParser implements ParserAdapter {
  name = 'pdf-bank-statement';
  supportedExtensions = ['.pdf'];

  async parse(fileBuffer: Buffer, filename: string, password?: string): Promise<ParserResult> {
    let parser: any = null;

    try {
      const { PDFParse } = require('pdf-parse');
      parser = new PDFParse({ data: fileBuffer, password });
      const data = await parser.getText();
      const text = data.text;

      await parser.destroy();
      parser = null;

      if (!text) {
        throw new Error('No readable text found in PDF statement.');
      }

      const lines = (text as string)
        .split('\n')
        .map((line: string) => line.trim())
        .filter(Boolean);

      const detectedBank = detectBankName(text, filename);
      const bankParser = getParserForBank(detectedBank);
      const bankResult = await bankParser.parse({
        text,
        lines,
        bankName: detectedBank,
        filename,
      });

      return {
        success: true,
        transactions: toNormalizedTransactions(
          bankResult.transactions,
          detectedBank,
          `${bankParser.bankName.toLowerCase()}-adapter`
        ),
        bankName: detectedBank,
        accountLast4: bankResult.accountLast4,
      };
    } catch (e: any) {
      if (parser) {
        try {
          await parser.destroy();
        } catch (_) {}
      }

      console.error('PDF Parsing Error:', e);
      let errorMsg = e.message || 'Unknown PDF parsing error';
      if (e.name === 'PasswordException' || e.message?.includes('password')) {
        errorMsg = 'This PDF statement is password-protected. Please provide the correct password.';
      }

      return {
        success: false,
        transactions: [],
        error: errorMsg,
      };
    }
  }
}

function detectBankName(text: string, filename: string): string {
  const lookup = `${text} ${filename}`.toLowerCase();

  if (lookup.includes('kotak') || lookup.includes('kkbk')) return 'KOTAK';
  if (lookup.includes('hdfc')) return 'HDFC';
  if (lookup.includes('icici')) return 'ICICI';
  if (lookup.includes('state bank of india') || lookup.includes('sbi')) return 'SBI';

  throw new Error('Unsupported PDF statement bank. Supported banks: Kotak, HDFC, ICICI, SBI.');
}
