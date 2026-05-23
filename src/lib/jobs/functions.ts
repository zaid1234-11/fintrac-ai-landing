import { inngest } from './inngest-client';
import { createAdminClient } from '@/lib/supabase/admin';
import { downloadStatementAdmin } from '@/lib/storage/actions';
import { parserRegistry } from '@/lib/parsers/registry';
import { runAIPipeline } from '@/lib/ai/pipeline';

/**
 * Helper to check or create a transaction category dynamically to avoid foreign key errors
 */
async function getOrCreateCategory(
  supabase: any,
  userId: string,
  categoryName: string,
  type: 'credit' | 'debit'
): Promise<string | null> {
  try {
    // Look for existing category (either system/global with user_id null OR matching this user)
    const { data, error } = await supabase
      .from('categories')
      .select('id')
      .eq('name', categoryName)
      .eq('type', type)
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      return data[0].id;
    }

    // Insert user-scoped category if not exists
    const { data: newCat, error: insertError } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name: categoryName,
        type,
        icon: categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase(), // Default icon name
        color: type === 'credit' ? '#10b981' : '#6366f1', // Green for credit, violet for debit
      })
      .select('id')
      .single();

    if (insertError) throw insertError;
    return newCat?.id || null;
  } catch (err) {
    console.error(`[getOrCreateCategory] Failed for "${categoryName}":`, err);
    return null;
  }
}

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

      // 4. Clean, Canonicalize, and Classify transactions through our multi-stage pipeline
      const classifiedTransactions = await step.run('classify-transactions', async () => {
        const { classifyTransaction } = require('@/lib/ai/classifierPipeline');
        const results = [];
        
        for (const rawTx of parseResult.transactions) {
          const originalDesc = rawTx.raw_payload?.original_description || rawTx.merchant;
          const result = await classifyTransaction(
            supabase,
            userId,
            originalDesc,
            rawTx.amount,
            rawTx.transaction_type
          );
          results.push(result);
        }
        return results;
      });

      // 5. Insert Normalized and Categorized transactions into Supabase DB
      const savedCount = await step.run('save-transactions-to-db', async () => {
        let count = 0;

        for (let i = 0; i < parseResult.transactions.length; i++) {
          const rawTx = parseResult.transactions[i];
          const classResult = classifiedTransactions[i];
          
          const categoryName = classResult.category || 'Other';
          const merchantName = classResult.merchant || 'General Merchant';
          const confidence = classResult.confidence ?? 0.5;
          const desc = rawTx.raw_payload?.original_description || 'Statement transaction';
          const source = classResult.source || 'fallback_other';

          // Resolve category UUID
          const categoryId = await getOrCreateCategory(
            supabase,
            userId,
            categoryName,
            rawTx.transaction_type
          );

          // Prep transaction record
          const { data: newTx, error: insertErr } = await supabase
            .from('transactions')
            .insert({
              user_id: userId,
              category_id: categoryId,
              amount: rawTx.amount,
              currency: rawTx.currency || 'INR',
              type: rawTx.transaction_type,
              status: 'completed',
              merchant_name: merchantName,
              upi_id: rawTx.transaction_ref_id || null,
              description: desc,
              date: rawTx.timestamp,
              ai_confidence_score: confidence,
              classification_source: source,
              normalized_merchant: merchantName,
              raw_parsed_data: {
                ...rawTx.raw_payload,
                ai_categorization: {
                  category: categoryName,
                  confidence,
                  classification_source: source,
                  is_recurring: source === 'merchant_memory' || source === 'global_registry',
                },
              },
              source: 'statement',
              source_id: statementId,
            })
            .select('id')
            .single();

          if (insertErr) {
            console.error('[Ingest Save Error]:', insertErr);
          } else if (newTx) {
            count++;
            
            // Record detailed classification history/audit
            const { error: classErr } = await supabase
              .from('transaction_classifications')
              .insert({
                transaction_id: newTx.id,
                raw_description: rawTx.raw_payload?.original_description || rawTx.merchant,
                cleaned_description: classResult.cleanedDescription,
                resolved_merchant: merchantName,
                category: categoryName,
                confidence_score: confidence,
                classification_source: source,
                rule_matched: classResult.ruleMatched || null,
              });
              
            if (classErr) {
              console.error('[Classification Log Error]:', classErr);
            }
          }
        }

        return count;
      });

      // 6. Generate Behavioral Insights
      await step.run('generate-behavioral-insights', async () => {
        const { generateBehavioralInsights } = require('@/lib/ai/behavioralIntel');
        await generateBehavioralInsights(supabase, userId);
      });

      // 7. Update bank statement record to 'completed'
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
