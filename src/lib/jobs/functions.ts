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
    const { userId, statementId, filePath, filename } = event.data;
    const supabase = createAdminClient();

    // 1. Update status to 'processing' in DB
    await step.run('initialize-db-status', async () => {
      const { error } = await supabase
        .from('bank_statements')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
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
      const result = await parserRegistry.parseFile(buffer, filename);
      
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

    // 4. Enrich transactions via AI (OpenRouter batch call)
    const aiEnrichments = await step.run('run-ai-enrichment', async () => {
      // Re-map string ISO dates back to Date objects for prompt logic if needed
      const normalTransactions = parseResult.transactions.map((t: any) => ({
        ...t,
        timestamp: new Date(t.timestamp),
      }));

      // Call OpenRouter pipeline
      const aiResponse = await runAIPipeline(normalTransactions);
      return aiResponse;
    });

    // 5. Insert Normalized and AI-Categorized transactions into Supabase DB
    const savedCount = await step.run('save-transactions-to-db', async () => {
      let count = 0;

      for (let i = 0; i < parseResult.transactions.length; i++) {
        const rawTx = parseResult.transactions[i];
        
        // Find corresponding AI classification
        const aiInfo = aiEnrichments.transactions.find((ai: any) => ai.index === i);
        
        const categoryName = aiInfo?.category || rawTx.category || 'Other';
        const merchantName = aiInfo?.merchant || rawTx.merchant || 'General Merchant';
        const confidence = aiInfo?.ai_confidence_score ?? 0.7;
        const desc = aiInfo?.description || rawTx.raw_payload?.original_description || 'Statement transaction';
        
        // Resolve category UUID
        const categoryId = await getOrCreateCategory(
          supabase,
          userId,
          categoryName,
          rawTx.transaction_type
        );

        // Prep transaction record
        const { error } = await supabase.from('transactions').insert({
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
          raw_parsed_data: {
            ...rawTx.raw_payload,
            ai_categorization: {
              category: categoryName,
              confidence,
              is_recurring: aiInfo?.is_recurring || false,
            },
          },
          source: 'statement',
          source_id: statementId,
        });

        if (error) {
          console.error('[Ingest Save Error]:', error);
        } else {
          count++;
        }
      }

      return count;
    });

    // 6. Save AI Insights
    await step.run('save-ai-insights', async () => {
      if (aiEnrichments.insights && aiEnrichments.insights.length > 0) {
        for (const insight of aiEnrichments.insights) {
          await supabase.from('ai_insights').insert({
            user_id: userId,
            type: insight.type,
            title: insight.title,
            description: insight.description,
            metrics: insight.metrics || {},
            insight_date: new Date().toISOString().split('T')[0],
          });
        }
      }
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
  }
);
