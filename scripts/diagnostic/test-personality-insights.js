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

async function testPersonalityInsights() {
  console.log('🧪 Starting Personality & Insight Heuristics Test...');

  // 1. Get first user in DB
  const { data: users, error: userError } = await supabase.from('users').select('id').limit(1);
  if (userError || !users || users.length === 0) {
    console.error('❌ No user found to run test against.');
    return;
  }
  const userId = users[0].id;
  console.log(`👤 Using User ID: ${userId}`);

  // Fetch or create Food category ID
  let foodCatId;
  const { data: foodCat } = await supabase.from('categories').select('id').eq('name', 'Food').eq('type', 'debit').limit(1);
  if (foodCat && foodCat.length > 0) {
    foodCatId = foodCat[0].id;
  } else {
    const { data: newCat } = await supabase.from('categories').insert({ name: 'Food', type: 'debit', icon: 'Food', color: '#ef4444' }).select('id').single();
    foodCatId = newCat.id;
  }

  // Fetch or create Salary category ID
  let salaryCatId;
  const { data: salCat } = await supabase.from('categories').select('id').eq('name', 'Salary').eq('type', 'credit').limit(1);
  if (salCat && salCat.length > 0) {
    salaryCatId = salCat[0].id;
  } else {
    const { data: newCat } = await supabase.from('categories').insert({ name: 'Salary', type: 'credit', icon: 'Salary', color: '#10b981' }).select('id').single();
    salaryCatId = newCat.id;
  }

  // Fetch or create Transfer category ID
  let transCatId;
  const { data: trCat } = await supabase.from('categories').select('id').eq('name', 'Transfer').eq('type', 'debit').limit(1);
  if (trCat && trCat.length > 0) {
    transCatId = trCat[0].id;
  } else {
    const { data: newCat } = await supabase.from('categories').insert({ name: 'Transfer', type: 'debit', icon: 'Transfer', color: '#8b5cf6' }).select('id').single();
    transCatId = newCat.id;
  }

  console.log('🧹 Cleaning existing test data...');
  // Delete all mock transactions from this test run
  await supabase.from('transactions').delete().eq('description', 'MOCK_TEST_TRANSACTION');
  await supabase.from('ai_insights').delete().eq('user_id', userId);
  await supabase.from('behavioral_profiles').delete().eq('user_id', userId);

  console.log('✍️ Inserting mock transactions to trigger specific heuristics...');
  const testTxs = [];
  const now = new Date();

  // HEURISTIC A: Food Spending Spike (Spent >= ₹2,000 in last 7 days vs avg ₹200 weekly previously)
  // Last 7 days: Food spend = ₹2,500
  const d1 = new Date(now); d1.setDate(now.getDate() - 2);
  testTxs.push({
    user_id: userId,
    category_id: foodCatId,
    amount: 2500,
    type: 'debit',
    merchant_name: 'Zomato',
    description: 'MOCK_TEST_TRANSACTION',
    date: d1.toISOString(),
  });
  // Prior 3 weeks: Food spend = ₹200 weekly (₹600 total)
  for (let i = 10; i <= 24; i += 7) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    testTxs.push({
      user_id: userId,
      category_id: foodCatId,
      amount: 200,
      type: 'debit',
      merchant_name: 'Zomato',
      description: 'MOCK_TEST_TRANSACTION',
      date: d.toISOString(),
    });
  }

  // HEURISTIC C: Recurring Subscription (Netflix - spaced 30 days apart, same amount)
  const subDate1 = new Date(now); subDate1.setDate(now.getDate() - 5);
  const subDate2 = new Date(now); subDate2.setDate(now.getDate() - 35);
  const subDate3 = new Date(now); subDate3.setDate(now.getDate() - 65);
  testTxs.push({
    user_id: userId,
    category_id: foodCatId,
    amount: 199,
    type: 'debit',
    merchant_name: 'Netflix',
    description: 'MOCK_TEST_TRANSACTION',
    date: subDate1.toISOString(),
  });
  testTxs.push({
    user_id: userId,
    category_id: foodCatId,
    amount: 199,
    type: 'debit',
    merchant_name: 'Netflix',
    description: 'MOCK_TEST_TRANSACTION',
    date: subDate2.toISOString(),
  });
  testTxs.push({
    user_id: userId,
    category_id: foodCatId,
    amount: 199,
    type: 'debit',
    merchant_name: 'Netflix',
    description: 'MOCK_TEST_TRANSACTION',
    date: subDate3.toISOString(),
  });

  // HEURISTIC D: Impulsive Late-Night Spending (Spent >= ₹1,500 between 11 PM and 5 AM in the last 7 days)
  // Let's insert late night Food spend of ₹1,800 at 11:30 PM (23:30)
  const dLate = new Date(now);
  dLate.setDate(now.getDate() - 3);
  dLate.setHours(23);
  dLate.setMinutes(30);
  testTxs.push({
    user_id: userId,
    category_id: foodCatId,
    amount: 1800,
    type: 'debit',
    merchant_name: 'LateNightCafe',
    description: 'MOCK_TEST_TRANSACTION',
    date: dLate.toISOString(),
  });

  // HEURISTIC E: Salary Burn Velocity (Salary ₹60,000 received 6 days ago, spent ₹40,000 (66%) in 7 days)
  const dSalary = new Date(now);
  dSalary.setDate(now.getDate() - 6);
  testTxs.push({
    user_id: userId,
    category_id: salaryCatId,
    amount: 60000,
    type: 'credit',
    merchant_name: 'ACME Corp',
    description: 'MOCK_TEST_TRANSACTION',
    date: dSalary.toISOString(),
  });

  // Debits following salary: ₹40,000
  const dSpendSal = new Date(now);
  dSpendSal.setDate(now.getDate() - 4);
  testTxs.push({
    user_id: userId,
    category_id: transCatId,
    amount: 40000,
    type: 'debit',
    merchant_name: 'Brokerage',
    description: 'MOCK_TEST_TRANSACTION',
    date: dSpendSal.toISOString(),
  });

  const { error: insErr } = await supabase.from('transactions').insert(testTxs);
  if (insErr) {
    console.error('❌ Failed to insert mock transactions:', insErr.message);
    return;
  }
  console.log(`✅ Inserted ${testTxs.length} mock transactions.`);

  // 2. Import and run generateBehavioralInsights
  console.log('⚙️ Importing heuristics engine...');
  const { generateBehavioralInsights } = require('./src/lib/ai/behavioralIntel');
  
  console.log('🚀 Running generateBehavioralInsights...');
  await generateBehavioralInsights(supabase, userId);

  // 3. Verify AI Insights in DB
  console.log('🔍 Querying generated insights...');
  const { data: insights, error: fetchInsError } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('user_id', userId)
    .order('relevance_score', { ascending: false });

  if (fetchInsError) {
    console.error('❌ Error fetching insights:', fetchInsError.message);
  } else {
    console.log(`\n📊 Generated ${insights.length} insight(s) (Limit: 3):`);
    insights.forEach((ins, idx) => {
      console.log(`[Insight #${idx + 1}]`);
      console.log(`  Key: ${ins.insight_key}`);
      console.log(`  Title: ${ins.title}`);
      console.log(`  Severity: ${ins.severity}`);
      console.log(`  Confidence: ${ins.confidence}`);
      console.log(`  Relevance: ${ins.relevance_score}`);
      console.log(`  Description: ${ins.description}`);
    });
  }

  // 4. Verify Cooldown Mechanism
  console.log('\n⏳ Running insight generator a second time to test COOLDOWN limits...');
  await generateBehavioralInsights(supabase, userId);

  const { data: insightsAfter, error: fetchInsAfterError } = await supabase
    .from('ai_insights')
    .select('id, insight_key')
    .eq('user_id', userId);

  if (!fetchInsAfterError) {
    console.log(`📊 Insights count after second run: ${insightsAfter.length} (expected to remain <= 3 with no duplicates)`);
  }

  // 5. Verify Personality Traits in DB
  console.log('\n🎭 Querying behavioral profiles...');
  const { data: profiles, error: profileErr } = await supabase
    .from('behavioral_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (profileErr) {
    console.error('❌ Error fetching profile:', profileErr.message);
  } else if (profiles) {
    console.log('✅ Behavioral Profile Found:');
    console.log(`  Traits Array:`, JSON.stringify(profiles.behavioral_traits));
    console.log(`  Financial Wellness Score: ${profiles.financial_wellness_score}`);
    console.log(`  Salary Velocity Score: ${profiles.salary_velocity_score}`);

    // Verify expected traits
    const expected = ['late_night_food_spender', 'salary_burner', 'high_p2p_transferer'];
    const traits = profiles.behavioral_traits;
    expected.forEach(trait => {
      if (traits.includes(trait)) {
        console.log(`  🌟 Trait matched successfully: ${trait}`);
      } else {
        console.warn(`  ⚠️ Missing expected trait: ${trait}`);
      }
    });
  }

  // 6. Clean up mock data
  console.log('\n🧹 Cleaning up test transactions, insights, and profiles...');
  await supabase.from('transactions').delete().eq('description', 'MOCK_TEST_TRANSACTION');
  await supabase.from('ai_insights').delete().eq('user_id', userId);
  await supabase.from('behavioral_profiles').delete().eq('user_id', userId);
  console.log('🎉 Personality Heuristics Test Complete!');
}

testPersonalityInsights().catch(console.error);
