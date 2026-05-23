const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Supabase env vars missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// We will load the ESM modules dynamically or write the pure JS equivalent of functions.ts
// to trigger the pipeline manually
async function triggerManualParse() {
  const statementId = process.argv[2];
  const password = process.argv[3] || '';

  if (!statementId) {
    console.log('Usage: node trigger-parse.js <statement_id> [password]');
    console.log('\nFetching latest "processing" statement to parse...');
    
    const { data: stmts, error } = await supabase
      .from('bank_statements')
      .select('*')
      .eq('status', 'processing')
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (error) {
      console.error('Error fetching statements:', error.message);
      return;
    }
    
    if (!stmts || stmts.length === 0) {
      console.log('No statements currently in "processing" status.');
      return;
    }
    
    console.log(`Found statement: ID: ${stmts[0].id} | File: ${stmts[0].file_url}`);
    console.log(`Run: node trigger-parse.js ${stmts[0].id} <password>`);
    return;
  }

  console.log(`🤖 Starting manual processing for statement ID: ${statementId}...`);

  // 1. Fetch statement details
  const { data: stmt, error: fetchErr } = await supabase
    .from('bank_statements')
    .select('*')
    .eq('id', statementId)
    .single();

  if (fetchErr || !stmt) {
    console.error('❌ Error fetching statement:', fetchErr?.message || 'Not found');
    return;
  }

  console.log(`📄 Statement file path: ${stmt.file_url}`);

  // 2. Download from storage
  console.log('Downloading file from Supabase Storage...');
  const { data: fileData, error: downloadErr } = await supabase.storage
    .from('bank-statements')
    .download(stmt.file_url);

  if (downloadErr) {
    console.error('❌ Download failed:', downloadErr.message);
    return;
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  console.log(`Downloaded ${buffer.length} bytes.`);

  // 3. Import and run parser
  console.log('Importing parser adapters...');
  // We run parser dynamically using tsx to avoid compilation steps
  const { parserRegistry } = require('./src/lib/parsers/registry');
  
  console.log(`Parsing file: ${stmt.file_url.split('/').pop()}`);
  const parseResult = await parserRegistry.parseFile(buffer, stmt.file_url.split('/').pop(), password);

  if (!parseResult.success) {
    console.error('❌ Parsing failed:', parseResult.error);
    await supabase
      .from('bank_statements')
      .update({
        status: 'failed',
        error_message: parseResult.error,
        updated_at: new Date().toISOString()
      })
      .eq('id', statementId);
    console.log('Database status updated to "failed".');
    return;
  }

  console.log(`✅ Parsing successful! Extracted ${parseResult.transactions.length} transactions.`);
  console.log(`Bank: ${parseResult.bankName} | Last 4 digits: ${parseResult.accountLast4 || 'Unknown'}`);

  if (parseResult.transactions.length === 0) {
    console.log('No transactions found. Completing statement.');
    await supabase
      .from('bank_statements')
      .update({
        status: 'completed',
        bank_name: parseResult.bankName || 'Unknown Bank',
        extracted_transactions_count: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', statementId);
    return;
  }

  // Preview first 3 transactions
  console.log('Preview:');
  parseResult.transactions.slice(0, 3).forEach((tx, idx) => {
    console.log(`  [${idx + 1}] Date: ${tx.timestamp.toISOString().split('T')[0]} | Merchant: ${tx.merchant} | Amount: ₹${tx.amount} | Type: ${tx.transaction_type}`);
  });

  // 4. Run Multi-Stage Classification Pipeline
  console.log('Running Multi-Stage Classification Pipeline...');
  const { classifyTransaction } = require('./src/lib/ai/classifierPipeline');
  
  // Helper for categories
  const getOrCreateCategory = async (userId, categoryName, type) => {
    const { data } = await supabase
      .from('categories')
      .select('id')
      .eq('name', categoryName)
      .eq('type', type)
      .or(`user_id.is.null,user_id.eq.${userId}`);
      
    if (data && data.length > 0) return data[0].id;
    
    const { data: newCat } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name: categoryName,
        type,
        icon: categoryName,
        color: type === 'credit' ? '#10b981' : '#6366f1'
      })
      .select('id')
      .single();
      
    return newCat?.id || null;
  };

  // 5. Insert transactions & audit logs
  console.log('Inserting transactions into Supabase...');
  let savedCount = 0;
  for (let i = 0; i < parseResult.transactions.length; i++) {
    const rawTx = parseResult.transactions[i];
    
    // Classify using our pipeline
    const classResult = await classifyTransaction(
      supabase,
      stmt.user_id,
      rawTx.raw_payload?.original_description || rawTx.merchant,
      rawTx.amount,
      rawTx.transaction_type
    );
    
    const categoryName = classResult.category || 'Other';
    const merchantName = classResult.merchant || 'General Merchant';
    const confidence = classResult.confidence ?? 0.5;
    const desc = rawTx.raw_payload?.original_description || 'Statement transaction';
    const source = classResult.source || 'fallback_other';

    const categoryId = await getOrCreateCategory(stmt.user_id, categoryName, rawTx.transaction_type);

    const { data: newTx, error: insertErr } = await supabase
      .from('transactions')
      .insert({
        user_id: stmt.user_id,
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
          }
        },
        source: 'statement',
        source_id: statementId
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error(`  ❌ Failed to insert transaction ${i}:`, insertErr.message);
    } else if (newTx) {
      savedCount++;
      
      // Insert into transaction_classifications audit
      await supabase.from('transaction_classifications').insert({
        transaction_id: newTx.id,
        raw_description: rawTx.raw_payload?.original_description || rawTx.merchant,
        cleaned_description: classResult.cleanedDescription,
        resolved_merchant: merchantName,
        category: categoryName,
        confidence_score: confidence,
        classification_source: source,
        rule_matched: classResult.ruleMatched || null,
      });
    }
  }

  // 6. Generate Behavioral Insights
  console.log('Generating Behavioral Insights...');
  const { generateBehavioralInsights } = require('./src/lib/ai/behavioralIntel');
  await generateBehavioralInsights(supabase, stmt.user_id);

  // 7. Finalize statement record
  console.log('Finalizing bank statement status...');
  const accountInfo = parseResult.accountLast4 || '****';
  await supabase
    .from('bank_statements')
    .update({
      status: 'completed',
      bank_name: parseResult.bankName || 'Unknown Bank',
      account_number_last_4: accountInfo.substring(Math.max(0, accountInfo.length - 4)),
      extracted_transactions_count: savedCount,
      updated_at: new Date().toISOString()
    })
    .eq('id', statementId);

  console.log(`🎉 Ingestion completed successfully! Saved ${savedCount} transactions.`);
}

triggerManualParse().catch(console.error);
