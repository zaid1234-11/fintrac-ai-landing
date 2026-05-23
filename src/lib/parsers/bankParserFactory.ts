import { BaseBankParser } from './types';
import { HdfcAdapter } from './hdfcAdapter';
import { IciciAdapter } from './iciciAdapter';
import { KotakAdapter } from './kotakAdapter';
import { SbiAdapter } from './sbiAdapter';

const parsers: BaseBankParser[] = [
  new KotakAdapter(),
  new HdfcAdapter(),
  new IciciAdapter(),
  new SbiAdapter(),
];

export function getParserForBank(bankName: string): BaseBankParser {
  const normalizedBankName = bankName.trim().toUpperCase();
  const parser = parsers.find((adapter) => adapter.bankName === normalizedBankName);

  if (!parser) {
    throw new Error(`No PDF parser adapter registered for bank: ${bankName}`);
  }

  return parser;
}
