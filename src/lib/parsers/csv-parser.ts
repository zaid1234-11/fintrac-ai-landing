import Papa from 'papaparse';
import { ParserAdapter, ParserResult, NormalizedTransaction } from './types';
import { isUPITransaction, extractUPIReference, cleanUPIMerchant } from './upi-parser';

export class CSVBankStatementParser implements ParserAdapter {
  name = 'csv-bank-statement';
  supportedExtensions = ['.csv'];

  async parse(fileBuffer: Buffer, filename: string): Promise<ParserResult> {
    try {
      const csvText = fileBuffer.toString('utf8');
      
      const parseResult = Papa.parse<string[]>(csvText, {
        skipEmptyLines: 'greedy',
      });

      if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
        throw new Error(`CSV parsing error: ${parseResult.errors[0].message}`);
      }

      const rows = parseResult.data;
      if (rows.length < 2) {
        throw new Error('CSV file is empty or contains insufficient data.');
      }

      // 1. Identify header index and mapping
      let headerRowIndex = -1;
      let dateIdx = -1;
      let descIdx = -1;
      let debitIdx = -1;
      let creditIdx = -1;
      let amountIdx = -1;
      let refIdx = -1;

      // Scan rows to find headers
      for (let i = 0; i < Math.min(rows.length, 15); i++) {
        const row = rows[i].map(cell => String(cell).toLowerCase().trim());
        
        const hasDate = row.some(c => c.includes('date') || c === 'dt');
        const hasDesc = row.some(c => c.includes('desc') || c.includes('narration') || c.includes('particulars') || c.includes('remarks'));
        const hasDebit = row.some(c => c.includes('debit') || c.includes('withdrawal') || c.includes('withdrawal(dr)'));
        const hasCredit = row.some(c => c.includes('credit') || c.includes('deposit') || c.includes('deposit(cr)'));
        const hasAmount = row.some(c => c === 'amount' || c === 'amt');

        if (hasDate && (hasDesc || hasAmount || (hasDebit && hasCredit))) {
          headerRowIndex = i;
          
          row.forEach((cell, index) => {
            if (cell.includes('date') || cell === 'dt') dateIdx = index;
            else if (cell.includes('desc') || cell.includes('narration') || cell.includes('particular') || cell.includes('remark')) descIdx = index;
            else if (cell.includes('debit') || cell.includes('withdrawal')) debitIdx = index;
            else if (cell.includes('credit') || cell.includes('deposit')) creditIdx = index;
            else if (cell === 'amount' || cell === 'amt' || cell.includes('trans')) amountIdx = index;
            else if (cell.includes('ref') || cell.includes('utr') || cell.includes('chq')) refIdx = index;
          });
          
          break;
        }
      }

      // Fallback mapping if headers not found explicitly
      if (headerRowIndex === -1) {
        // Assume first row with date-like values is data, or assume row 0 is headers
        headerRowIndex = 0;
        dateIdx = 0;
        descIdx = 1;
        debitIdx = 2;
        creditIdx = 3;
      }

      const transactions: NormalizedTransaction[] = [];
      let detectedBank = 'Unknown Bank';
      if (filename.toLowerCase().includes('hdfc')) detectedBank = 'HDFC';
      else if (filename.toLowerCase().includes('sbi')) detectedBank = 'SBI';
      else if (filename.toLowerCase().includes('icici')) detectedBank = 'ICICI';
      else if (filename.toLowerCase().includes('axis')) detectedBank = 'AXIS';

      // 2. Parse rows
      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length <= Math.max(dateIdx, descIdx)) continue;

        const rawDate = row[dateIdx]?.trim();
        const rawDesc = row[descIdx]?.trim() || '';
        
        if (!rawDate) continue;

        const timestamp = parseDate(rawDate);
        if (isNaN(timestamp.getTime())) {
          // Skip rows that don't have a valid date in the date column (could be footer/totals)
          continue;
        }

        let amount = 0;
        let type: 'credit' | 'debit' = 'debit';

        // Check Debit / Credit columns
        if (debitIdx !== -1 && creditIdx !== -1) {
          const debitVal = cleanNumeric(row[debitIdx]);
          const creditVal = cleanNumeric(row[creditIdx]);
          
          if (debitVal > 0) {
            amount = debitVal;
            type = 'debit';
          } else if (creditVal > 0) {
            amount = creditVal;
            type = 'credit';
          } else {
            // Check if one of them is empty and the other is not, but both returned 0
            continue; 
          }
        } else if (amountIdx !== -1) {
          const amountVal = cleanNumeric(row[amountIdx]);
          amount = Math.abs(amountVal);
          // If there is an explicit sign or a type helper column, use it. Otherwise, default to debit
          type = amountVal < 0 ? 'debit' : 'credit';
        } else {
          continue;
        }

        const isUPI = isUPITransaction(rawDesc);
        const merchant = isUPI ? cleanUPIMerchant(rawDesc) : cleanGeneralMerchant(rawDesc);
        const refId = refIdx !== -1 ? row[refIdx]?.trim() : (isUPI ? extractUPIReference(rawDesc) : undefined);

        transactions.push({
          merchant,
          amount,
          currency: 'INR', // Indian bank context
          transaction_type: type,
          payment_method: isUPI ? 'UPI' : (rawDesc.toLowerCase().includes('card') ? 'Card' : 'NetBanking'),
          timestamp,
          source: 'statement',
          raw_payload: {
            raw_row: row,
            original_description: rawDesc,
            parsed_via: 'csv-parser',
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
      console.error('CSV Parsing Error:', e);
      return {
        success: false,
        transactions: [],
        error: e.message || 'Unknown CSV parse error',
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
    .replace(/(POS|ATM|WDL|FT|NEFT|RTGS|CHG|COMM)\b/gi, '')
    .replace(/\d{4,}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50) || 'General Merchant';
}

function parseDate(dateStr: string): Date {
  // Supports formats: DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, etc.
  const cleanStr = dateStr.replace(/[.\-_]/g, '/');
  const date = new Date(cleanStr);
  if (!isNaN(date.getTime())) return date;

  // DD/MM/YYYY Manual Parsing
  const parts = cleanStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // 0-indexed
    let year = parseInt(parts[2]);
    if (year < 100) year += 2000; // 2-digit year safety
    const parsedDate = new Date(year, month, day);
    if (!isNaN(parsedDate.getTime())) return parsedDate;
  }

  return new Date(dateStr);
}
