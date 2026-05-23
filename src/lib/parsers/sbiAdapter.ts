import { BankParserContext, BankParserResult, BaseBankParser } from './types';
import { parseGenericBalanceAwareRows } from './bankParserUtils';

export class SbiAdapter implements BaseBankParser {
  bankName = 'SBI';

  parse(context: BankParserContext): BankParserResult {
    return {
      transactions: parseGenericBalanceAwareRows(context.lines, this.bankName, 'sbi-adapter'),
    };
  }
}
