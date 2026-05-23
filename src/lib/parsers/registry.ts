import path from 'path';
import { ParserAdapter, ParserResult } from './types';
import { CSVBankStatementParser } from './csv-parser';
import { PDFBankStatementParser } from './pdf-parser';

export class ParserRegistry {
  private adapters: ParserAdapter[] = [];

  constructor() {
    // Register default parser adapters
    this.register(new CSVBankStatementParser());
    this.register(new PDFBankStatementParser());
  }

  register(adapter: ParserAdapter) {
    this.adapters.push(adapter);
  }

  async parseFile(fileBuffer: Buffer, filename: string, password?: string): Promise<ParserResult> {
    const ext = path.extname(filename).toLowerCase();
    
    // Find matching adapter
    const adapter = this.adapters.find(a => a.supportedExtensions.includes(ext));
    
    if (!adapter) {
      return {
        success: false,
        transactions: [],
        error: `Unsupported file format: ${ext}. Only PDF and CSV bank statements are supported.`,
      };
    }

    try {
      console.log(`[ParserRegistry] Parsing ${filename} using ${adapter.name}...`);
      return await adapter.parse(fileBuffer, filename, password);
    } catch (e: any) {
      console.error(`[ParserRegistry] Failed to parse ${filename} with ${adapter.name}:`, e);
      return {
        success: false,
        transactions: [],
        error: e.message || 'Parsing execution failed',
      };
    }
  }
}

// Export singleton instance
export const parserRegistry = new ParserRegistry();
