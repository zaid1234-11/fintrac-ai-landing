import { BankParserContext, BankParserResult, BaseBankParser } from './types';
import { parseGenericBalanceAwareRows } from './bankParserUtils';

export class HdfcAdapter implements BaseBankParser {
  bankName = 'HDFC';

  parse(context: BankParserContext): BankParserResult {
    return {
      transactions: parseGenericBalanceAwareRows(context.lines, this.bankName, 'hdfc-adapter'),
    };
  }
}
