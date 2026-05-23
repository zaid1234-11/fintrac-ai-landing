import {
  BankParserContext,
  BankParserResult,
  BankParserTransaction,
  BaseBankParser,
} from './types';
import {
  cleanNumeric,
  inferPaymentMethod,
  parseDate,
  resolveDirectionFromRunningBalance,
} from './bankParserUtils';
import { extractUPIReference } from './upi-parser';

export class KotakAdapter implements BaseBankParser {
  bankName = 'KOTAK';

  parse(context: BankParserContext): BankParserResult {
    const accountLast4 = this.extractAccountLast4(context.text);
    const blocks = this.aggregateTransactionBlocks(context.lines);
    const transactions: BankParserTransaction[] = [];
    let lastBalance: number | null = null;

    const txStartRegex = /^\d+\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4}|\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})\b/;

    for (const block of blocks) {
      const numbersMatch = block.content.match(/([\-\+]?[\d,]+\.\d{2})\s+([\-\+]?[\d,]+\.\d{2})\s*$/);
      if (!numbersMatch) continue;

      const amount = cleanNumeric(numbersMatch[1]);
      const balance = cleanNumeric(numbersMatch[2]);
      if (amount === 0) continue;

      let rawDescription = block.content.replace(txStartRegex, '').trim();
      rawDescription = rawDescription.substring(0, rawDescription.lastIndexOf(numbersMatch[1])).trim();

      const direction = resolveDirectionFromRunningBalance({
        previousBalance: lastBalance,
        currentBalance: balance,
        amount,
        rawDescription,
        rawLine: block.content,
        bankName: this.bankName,
      });

      lastBalance = balance;

      transactions.push({
        date: parseDate(block.dateStr),
        amount,
        direction,
        rawDescription,
        runningBalance: balance,
        rawLine: block.content,
        transactionRefId: extractUPIReference(rawDescription),
        paymentMethod: inferPaymentMethod(rawDescription),
      });
    }

    return {
      transactions,
      accountLast4,
    };
  }

  private extractAccountLast4(text: string): string | undefined {
    const accountMatch = text.match(/Account No\.?\s*(\d+)/i);
    if (!accountMatch) return undefined;

    const fullAccount = accountMatch[1];
    return fullAccount.substring(Math.max(0, fullAccount.length - 4));
  }

  private aggregateTransactionBlocks(lines: string[]) {
    const blocks: { dateStr: string; content: string }[] = [];
    let currentBlock: { dateStr: string; content: string; isComplete: boolean } | null = null;

    const txStartRegex = /^\d+\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4}|\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})\b/;
    const numEndRegex = /[\-\+]?[\d,]+\.\d{2}\s+[\-\+]?[\d,]+\.\d{2}\s*$/;

    for (const line of lines) {
      if (this.shouldSkipLine(line)) {
        continue;
      }

      const match = line.match(txStartRegex);
      if (match) {
        if (currentBlock) {
          blocks.push(currentBlock);
        }

        currentBlock = {
          dateStr: match[1],
          content: line,
          isComplete: numEndRegex.test(line),
        };
      } else if (currentBlock && !currentBlock.isComplete) {
        currentBlock.content += ' ' + line;
        if (numEndRegex.test(line)) {
          currentBlock.isComplete = true;
        }
      }
    }

    if (currentBlock) {
      blocks.push(currentBlock);
    }

    return blocks;
  }

  private shouldSkipLine(line: string): boolean {
    return (
      line.includes('Statement Generated on') ||
      line.includes('Savings Account Transactions') ||
      line.includes('# Date Description') ||
      /^--\s+\d+\s+of\s+\d+\s+--$/.test(line) ||
      line.includes('Statement Period')
    );
  }
}
