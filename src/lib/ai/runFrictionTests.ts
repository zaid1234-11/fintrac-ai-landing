import { calculateFrictionScores, CategoryInput, calculateStandardDeviation } from './frictionScore';

// Helper assertion function
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`✅ Passed: ${message}`);
}

function runTests() {
  console.log('🧪 Running Behavioral Friction Score Engine Tests...\n');

  // Test Case 1: Standard deviation calculator correctness
  const dev = calculateStandardDeviation([10, 20, 30]); // Mean = 20. Variances = 100, 0, 100. Sum = 200. N-1 = 2. Var = 100. Std = 10.
  assert(Math.abs(dev - 10) < 0.0001, 'Standard deviation of [10, 20, 30] should be exactly 10');

  // Test Case 2: Comprehensive Multi-Category Input
  const mockData: CategoryInput[] = [
    {
      category: 'Rent',
      // High consistency (zero variance), low frequency (1 transaction), neutral sentiment (0)
      transactions: [
        { amount: 15000, date: '2026-05-01', sentimentScore: 0 }
      ]
    },
    {
      category: 'Dining Out',
      // High frequency (4 transactions), high variance (various food orders), high emotional sentiment (0.8)
      transactions: [
        { amount: 450, date: '2026-05-02', sentimentScore: 0.8 },
        { amount: 1200, date: '2026-05-05', sentimentScore: 0.9 },
        { amount: 200, date: '2026-05-10', sentimentScore: 0.7 },
        { amount: 850, date: '2026-05-15', sentimentScore: 0.8 }
      ]
    },
    {
      category: 'Streaming Services',
      // Low frequency (2 transactions), exact same amount (zero variance), highly positive emotion (1.0)
      transactions: [
        { amount: 199, date: '2026-05-01', sentimentScore: 1.0 },
        { amount: 199, date: '2026-05-28', sentimentScore: 1.0 }
      ]
    },
    {
      category: 'Tax Payments',
      // Low frequency (1 transaction), neutral/negative emotion (-0.5)
      transactions: [
        { amount: 8000, date: '2026-05-15', sentimentScore: -0.5 }
      ]
    }
  ];

  const results = calculateFrictionScores(mockData);
  console.log('Results output:\n', JSON.stringify(results, null, 2), '\n');

  // Assertions for results
  assert(results.length === 4, 'Should return results for all 4 categories');

  // 1. Max frequency is 4 (Dining Out)
  const diningResult = results.find(r => r.category === 'Dining Out');
  assert(diningResult !== undefined, 'Dining Out must have a score resolved');
  assert(diningResult!.breakdown.frequency === 1.0, 'Dining Out should have max frequency (1.0)');

  // 2. Rent and Tax Payments have 1 transaction each -> CV = 0.
  // Streaming Services has 2 identical transactions -> CV = 0.
  // Standard deviation of [450, 1200, 200, 850] is positive.
  // So Max CV will be Dining Out's CV.
  // Thus Rent, Tax, and Streaming must have Consistency Score = 1.0 (since their CV is 0).
  const rentResult = results.find(r => r.category === 'Rent');
  const streamingResult = results.find(r => r.category === 'Streaming Services');
  const taxResult = results.find(r => r.category === 'Tax Payments');

  assert(rentResult!.breakdown.consistency === 1.0, 'Rent consistency should be 1.0 (no variance)');
  assert(streamingResult!.breakdown.consistency === 1.0, 'Streaming consistency should be 1.0 (no variance)');
  assert(taxResult!.breakdown.consistency === 1.0, 'Tax consistency should be 1.0 (no variance)');

  // 3. Emotion validation:
  // - Streaming Services has average sentiment 1.0 -> Emotion Score = (1.0 + 1.0)/2 = 1.0
  // - Tax Payments has average sentiment -0.5 -> Emotion Score = (-0.5 + 1.0)/2 = 0.25
  // - Rent has average sentiment 0 -> Emotion Score = (0 + 1.0)/2 = 0.5
  assert(streamingResult!.breakdown.emotion === 1.0, 'Streaming emotion score should be 1.0');
  assert(taxResult!.breakdown.emotion === 0.25, 'Tax emotion score should be 0.25');
  assert(rentResult!.breakdown.emotion === 0.5, 'Rent emotion score should be 0.5');

  // 4. Validate composite score bounded between 0 and 1
  for (const res of results) {
    assert(res.frictionScore >= 0 && res.frictionScore <= 1, `Friction score for ${res.category} must be within [0, 1]`);
    
    // Validate weighted calculation correctness:
    // FS = 0.4 * freq + 0.3 * consistency + 0.3 * emotion
    const expected = (0.4 * res.breakdown.frequency) + (0.3 * res.breakdown.consistency) + (0.3 * res.breakdown.emotion);
    assert(Math.abs(res.frictionScore - expected) < 0.001, `${res.category} score should match weighted formula`);
  }

  console.log('\n🎉 All tests passed successfully!');
}

runTests();
