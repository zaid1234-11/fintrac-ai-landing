import { inngest } from './inngest-client';
import { createAdminClient } from '@/lib/supabase/admin';
import { downloadStatementAdmin } from '@/lib/storage/actions';
import { parserRegistry } from '@/lib/parsers/registry';
import { chunkTransactions, persistTransactionChunk } from '@/lib/ingestion/chunkPersistence';

/**
 * Unified Multi-step Ingest Flow
 * Triggers when `statement.uploaded` is dispatched.
 */
export const processStatementUpload = inngest.createFunction(
  { 
    id: 'process-statement-upload', 
    name: 'Process Statement Upload',
    triggers: [{ event: 'statement.uploaded' }]
  },
  async ({ event, step }) => {
    const { userId, statementId, filePath, filename, password } = event.data;
    const supabase = createAdminClient();

    try {
      // 1. Update status to 'processing' in DB
      await step.run('initialize-db-status', async () => {
        const { error } = await supabase
          .from('bank_statements')
          .update({ 
            status: 'processing', 
            error_message: null, // Clear any previous error message
            updated_at: new Date().toISOString() 
          })
          .eq('id', statementId);

        if (error) {
          throw new Error(`Failed to initialize statement status: ${error.message}`);
        }
      });

      // 2. Download file buffer from private storage bucket
      const fileBuffer = await step.run('download-file', async () => {
        const buffer = await downloadStatementAdmin(filePath);
        // Return as base64 string because Inngest step results must be JSON-serializable
        return buffer.toString('base64');
      });

      // 3. Parse transactions text/CSV rows
      const parseResult = await step.run('parse-file-data', async () => {
        const buffer = Buffer.from(fileBuffer, 'base64');
        const result = await parserRegistry.parseFile(buffer, filename, password);
        
        if (!result.success) {
          throw new Error(result.error || 'Parsing failed without detail');
        }
        return result;
      });

      if (!parseResult.transactions || parseResult.transactions.length === 0) {
        // Complete with 0 entries
        await step.run('complete-empty-statement', async () => {
          await supabase
            .from('bank_statements')
            .update({
              status: 'completed',
              extracted_transactions_count: 0,
              updated_at: new Date().toISOString(),
            })
            .eq('id', statementId);
        });
        return { success: true, count: 0 };
      }

      // 4. Insert normalized transactions in deterministic 25-row chunks.
      // AI behavioral generation runs only after all chunks are persisted.
      const savedCount = await step.run('save-transactions-in-chunks', async () => {
        let count = 0;
        const chunks = chunkTransactions(parseResult.transactions);

        for (let i = 0; i < chunks.length; i++) {
          const result = await persistTransactionChunk({
            supabase,
            userId,
            statementId,
            transactions: chunks[i],
          });

          count += result.savedCount;
          console.log(`[Ingest] Persisted chunk ${i + 1}/${chunks.length}: ${result.savedCount}/${chunks[i].length}`);
        }

        return count;
      });

      // 5. Generate Behavioral Insights after all chunks are persisted.
      await step.run('generate-behavioral-insights', async () => {
        const { generateBehavioralInsights } = require('@/lib/ai/behavioralIntel');
        await generateBehavioralInsights(supabase, userId);
      });

      // 6. Update bank statement record to 'completed'
      await step.run('finalize-statement-record', async () => {
        const accountInfo = parseResult.accountLast4 || '****';
        const bankName = parseResult.bankName || 'Detected Bank';
        
        await supabase
          .from('bank_statements')
          .update({
            status: 'completed',
            bank_name: bankName,
            account_number_last_4: accountInfo.substring(accountInfo.length - 4),
            extracted_transactions_count: savedCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', statementId);
      });

      return {
        success: true,
        parsedCount: parseResult.transactions.length,
        savedCount,
      };
    } catch (error: any) {
      console.error(`[Inngest Background Job Error] Failed to process statement ${statementId}:`, error);
      
      // Attempt to update database record to failed with error message
      try {
        await supabase
          .from('bank_statements')
          .update({
            status: 'failed',
            error_message: error.message || 'Unknown processing error',
            updated_at: new Date().toISOString(),
          })
          .eq('id', statementId);
      } catch (dbErr) {
        console.error('[Inngest Background Job Error] Failed to log failure in bank_statements:', dbErr);
      }
      
      throw error; // Rethrow for Inngest retry / visibility
    }
  }
);
