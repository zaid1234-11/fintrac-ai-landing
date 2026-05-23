import { ParserAdapter, ParserResult, NormalizedTransaction } from './types';
import { isUPITransaction, extractUPIReference, cleanUPIMerchant } from './upi-parser';

export class PDFBankStatementParser implements ParserAdapter {
  name = 'pdf-bank-statement';
  supportedExtensions = ['.pdf'];

  async parse(fileBuffer: Buffer, filename: string, password?: string): Promise<ParserResult> {
    let parser: any = null;
    try {
      // 1. Extract text from PDF buffer
      const { PDFParse } = require('pdf-parse');
      parser = new PDFParse({ data: fileBuffer, password });
      const data = await parser.getText();
      const text = data.text;
      
      await parser.destroy();
      parser = null;

      if (!text) {
        throw new Error('No readable text found in PDF statement.');
      }

      // 2. Process text line-by-line
      const lines = (text as string).split('\n').map((line: string) => line.trim()).filter(Boolean);
      const transactions: NormalizedTransaction[] = [];
      
      let detectedBank = 'Unknown Bank';
      const lowercaseText = text.toLowerCase();
      if (lowercaseText.includes('hdfc')) detectedBank = 'HDFC';
      else if (lowercaseText.includes('icici')) detectedBank = 'ICICI';
      else if (lowercaseText.includes('state bank of india') || lowercaseText.includes('sbi')) detectedBank = 'SBI';
      else if (lowercaseText.includes('axis')) detectedBank = 'AXIS';

      // Pattern matching for transaction rows
      // Matches standard Indian bank dates: DD-MM-YYYY, DD/MM/YYYY, DD MMM YYYY (e.g. 12 Jan 2025)
      const dateRegex = /^(?:\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})/i;

      for (const line of lines) {
        const dateMatch = line.match(dateRegex);
        if (!dateMatch) continue;

        const dateStr = dateMatch[0];
        const timestamp = parseDate(dateStr);
        if (isNaN(timestamp.getTime())) continue;

        // Strip the date from the line to parse the rest
        const remainder = line.substring(dateStr.length).trim();

        // Separate text description from ending numbers (Debit, Credit, Balance)
        // Numbers match formats like: 1,500.00, -250.00, etc.
        const numbersMatch = remainder.match(/(.*?)\s+([\d,]+\.\d{2})(?:\s+([\d,]+\.\d{2}))?(?:\s+([\d,]+\.\d{2}))?\s*$/);
        if (!numbersMatch) continue;

        const rawDescription = numbersMatch[1].trim();
        const firstNum = cleanNumeric(numbersMatch[2]);
        const secondNum = numbersMatch[3] ? cleanNumeric(numbersMatch[3]) : null;
        const thirdNum = numbersMatch[4] ? cleanNumeric(numbersMatch[4]) : null;

        // Skip rows that look like totals or subheadings
        if (
          rawDescription.toLowerCase().includes('total') ||
          rawDescription.toLowerCase().includes('balance') ||
          rawDescription.toLowerCase().includes('opening') ||
          rawDescription.toLowerCase().includes('closing')
        ) {
          continue;
        }

        let amount = 0;
        let type: 'credit' | 'debit' = 'debit';

        // Bank transaction structure mapping:
        // Case A (3 numbers: Debit, Credit, Balance)
        if (secondNum !== null && thirdNum !== null) {
          if (firstNum > 0 && secondNum === 0) {
            amount = firstNum;
            type = 'debit';
          } else if (secondNum > 0 && firstNum === 0) {
            amount = secondNum;
            type = 'credit';
          } else {
            // Usually [Debit] [Credit] [Balance], if both contain values it's rare, 
            // but let's check which field represents what. HDFC statement pattern:
            // "10/10/2025  ZOMATO DR  450.00  0.00  15,200.00"
            amount = firstNum > 0 ? firstNum : secondNum;
            type = firstNum > 0 ? 'debit' : 'credit';
          }
        } 
        // Case B (2 numbers: Amount, Balance)
        else if (secondNum !== null) {
          amount = firstNum;
          // Determine transaction type based on keywords in HDFC/ICICI description
          const isCredit = 
            rawDescription.toLowerCase().includes('cr') || 
            rawDescription.toLowerCase().includes('credit') || 
            rawDescription.toLowerCase().includes('dep') || 
            rawDescription.toLowerCase().includes('interest') ||
            rawDescription.toLowerCase().includes('salary');
            
          type = isCredit ? 'credit' : 'debit';
        } 
        // Case C (1 number: Amount)
        else {
          amount = firstNum;
          const isCredit = 
            rawDescription.toLowerCase().includes('cr') || 
            rawDescription.toLowerCase().includes('credit') || 
            rawDescription.toLowerCase().includes('salary');
          type = isCredit ? 'credit' : 'debit';
        }

        if (amount === 0) continue;

        const isUPI = isUPITransaction(rawDescription);
        const merchant = isUPI ? cleanUPIMerchant(rawDescription) : cleanGeneralMerchant(rawDescription);
        const refId = isUPI ? extractUPIReference(rawDescription) : undefined;

        transactions.push({
          merchant,
          amount,
          currency: 'INR',
          transaction_type: type,
          payment_method: isUPI ? 'UPI' : (rawDescription.toLowerCase().includes('card') ? 'Card' : 'NetBanking'),
          timestamp,
          source: 'statement',
          raw_payload: {
            original_description: rawDescription,
            parsed_via: 'pdf-parser',
            raw_line: line,
          },
          transaction_ref_id: refId,
          bank_name: detectedBank,
        });
      }

      return {
        success: true,
        transactions,
        bankName: detectedBank,
      };
    } catch (e: any) {
      if (parser) {
        try { await parser.destroy(); } catch (_) {}
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

function cleanNumeric(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.\-]/g, '');
  return parseFloat(cleaned) || 0;
}

function cleanGeneralMerchant(desc: string): string {
  return desc
    .replace(/(POS|ATM|WDL|FT|NEFT|RTGS|CHG|COMM|DR|CR)\b/gi, '')
    .replace(/\d{4,}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50) || 'General Merchant';
}

function parseDate(dateStr: string): Date {
  const cleanStr = dateStr.replace(/[.\-_]/g, '/');
  
  // Handled DD MMM YYYY like "12 Jan 2025" or "12 Jan 25"
  const wordMonthMatch = cleanStr.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2,4})$/);
  if (wordMonthMatch) {
    const day = parseInt(wordMonthMatch[1]);
    const monthStr = wordMonthMatch[2].toLowerCase();
    let year = parseInt(wordMonthMatch[3]);
    if (year < 100) year += 2000;

    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const month = months[monthStr] ?? 0;
    return new Date(year, month, day);
  }

  // Fallback to normal parsing
  const date = new Date(cleanStr);
  if (!isNaN(date.getTime())) return date;

  // DD/MM/YYYY Manual Parsing
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
