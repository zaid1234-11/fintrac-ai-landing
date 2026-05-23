import { BankParserContext, BankParserResult, BaseBankParser } from './types';
import { parseGenericBalanceAwareRows } from './bankParserUtils';

export class IciciAdapter implements BaseBankParser {
  bankName = 'ICICI';

  parse(context: BankParserContext): BankParserResult {
    return {
      transactions: parseGenericBalanceAwareRows(context.lines, this.bankName, 'icici-adapter'),
    };
  }
}
