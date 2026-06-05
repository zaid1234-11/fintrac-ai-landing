import { estimateBehavioralPain, estimateBatchBehavioralPain, PainInput } from './behavioralPain';

// Helper assertion function
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`✅ Passed: ${message}`);
}

function runTests() {
  console.log('🧪 Running Behavioral Pain Estimator Tests...\n');

  // Test Case 1: Easy Tier (Pain <= 1000)
  // 500 * 0.8 = 400 (Easy)
  const input1: PainInput = { category: 'Coffee', reductionAmount: 500, frictionScore: 0.8 };
  const res1 = estimateBehavioralPain(input1);
  assert(res1.painScore === 400, 'Pain score should be 400');
  assert(res1.painLevel === 'Easy', 'Pain level for 400 should be Easy');

  // Test Case 2: Boundary Easy/Moderate (Exactly 1000)
  // 1000 * 1.0 = 1000 (Easy)
  const input2: PainInput = { category: 'Subscriptions', reductionAmount: 1000, frictionScore: 1.0 };
  const res2 = estimateBehavioralPain(input2);
  assert(res2.painScore === 1000, 'Pain score should be 1000');
  assert(res2.painLevel === 'Easy', 'Pain level for exactly 1000 should be Easy');

  // Test Case 3: Moderate Tier (1000 < Pain <= 3000)
  // 2500 * 0.8 = 2000 (Moderate)
  const input3: PainInput = { category: 'Dining Out', reductionAmount: 2500, frictionScore: 0.8 };
  const res3 = estimateBehavioralPain(input3);
  assert(res3.painScore === 2000, 'Pain score should be 2000');
  assert(res3.painLevel === 'Moderate', 'Pain level for 2000 should be Moderate');

  // Test Case 4: Difficult Tier (3000 < Pain <= 6000)
  // 5000 * 0.9 = 4500 (Difficult)
  const input4: PainInput = { category: 'Travel', reductionAmount: 5000, frictionScore: 0.9 };
  const res4 = estimateBehavioralPain(input4);
  assert(res4.painScore === 4500, 'Pain score should be 4500');
  assert(res4.painLevel === 'Difficult', 'Pain level for 4500 should be Difficult');

  // Test Case 5: Extreme Tier (Pain > 6000)
  // 10000 * 0.85 = 8500 (Extreme)
  const input5: PainInput = { category: 'Rent', reductionAmount: 10000, frictionScore: 0.85 };
  const res5 = estimateBehavioralPain(input5);
  assert(res5.painScore === 8500, 'Pain score should be 8500');
  assert(res5.painLevel === 'Extreme', 'Pain level for 8500 should be Extreme');

  // Test Case 6: Negative and overflow values bounds check
  const input6: PainInput = { category: 'Error Check', reductionAmount: -500, frictionScore: 1.5 };
  const res6 = estimateBehavioralPain(input6);
  assert(res6.painScore === 0, 'Pain score with negative reduction amount should resolve to 0');
  assert(res6.painLevel === 'Easy', 'Pain level for 0 should be Easy');

  // Test Case 7: Batch Processing
  const batchInputs: PainInput[] = [input1, input3, input5];
  const batchResults = estimateBatchBehavioralPain(batchInputs);
  assert(batchResults.length === 3, 'Batch output should contain 3 entries');
  assert(batchResults[0].painLevel === 'Easy', 'First batch result should be Easy');
  assert(batchResults[1].painLevel === 'Moderate', 'Second batch result should be Moderate');
  assert(batchResults[2].painLevel === 'Extreme', 'Third batch result should be Extreme');

  console.log('\n🎉 All tests passed successfully!');
}

runTests();
