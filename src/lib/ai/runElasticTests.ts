import { optimizeSavings, OptimizationInput } from './elasticSavingsEngine';

// Helper assertion function
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`✅ Passed: ${message}`);
}

function runTests() {
  console.log('🧪 Running Elastic Savings Optimization Engine Tests...\n');

  // Test Case 1: Standard distribution proportional to (1 - FrictionScore)
  // Total target cut: 1000.
  // Dining Out: Spend = 1000, Friction = 0.8 -> weight = 0.2
  // Shopping: Spend = 1000, Friction = 0.2 -> weight = 0.8
  // Total weight: 1.0.
  // Dining Cut: 1000 * 0.2 = 200. Shopping Cut: 1000 * 0.8 = 800.
  const input1: OptimizationInput = {
    targetSavings: 1000,
    categories: [
      { name: 'Dining Out', monthlySpend: 1000, frictionScore: 0.8 },
      { name: 'Shopping', monthlySpend: 1000, frictionScore: 0.2 }
    ]
  };

  const result1 = optimizeSavings(input1);
  console.log('Test Case 1 Result:', JSON.stringify(result1, null, 2), '\n');

  assert(result1.totalSavings === 1000, 'Total savings should equal target savings of 1000');
  
  const dining1 = result1.recommendations.find(r => r.category === 'Dining Out')!;
  const shopping1 = result1.recommendations.find(r => r.category === 'Shopping')!;
  
  assert(Math.abs(dining1.suggestedReduction - 200) < 0.01, 'Dining Out reduction should be exactly 200');
  assert(Math.abs(shopping1.suggestedReduction - 800) < 0.01, 'Shopping reduction should be exactly 800');
  assert(Math.abs(dining1.newBudget - 800) < 0.01, 'Dining Out new budget should be 800');
  assert(Math.abs(shopping1.newBudget - 200) < 0.01, 'Shopping new budget should be 200');

  // Behavioral Cost = 200 * 0.8 + 800 * 0.2 = 160 + 160 = 320
  assert(Math.abs(result1.behavioralCost - 320) < 0.01, 'Behavioral cost should be exactly 320');

  // Test Case 2: Iterative re-distribution when a category is capped
  // Target: 800
  // Coffee: Spend = 100, Friction = 0.0 (Unprotected) -> weight = 1.0
  // Rent: Spend = 2000, Friction = 0.9 (Protected) -> weight = 0.1
  // Total weight: 1.1.
  // Initial proposed Coffee cut: 800 * (1.0 / 1.1) = 727.27 -> Capped at 100.
  // Remaining 700 is redistributed entirely to Rent since it's the only active category.
  // Total cuts: Coffee = 100, Rent = 700.
  const input2: OptimizationInput = {
    targetSavings: 800,
    categories: [
      { name: 'Coffee', monthlySpend: 100, frictionScore: 0.0 },
      { name: 'Rent', monthlySpend: 2000, frictionScore: 0.9 }
    ]
  };

  const result2 = optimizeSavings(input2);
  console.log('Test Case 2 Result (Capping & Redistribution):', JSON.stringify(result2, null, 2), '\n');

  assert(result2.totalSavings === 800, 'Total savings should equal 800');
  
  const coffee2 = result2.recommendations.find(r => r.category === 'Coffee')!;
  const rent2 = result2.recommendations.find(r => r.category === 'Rent')!;

  assert(coffee2.suggestedReduction === 100, 'Coffee reduction should be capped at monthly spend of 100');
  assert(rent2.suggestedReduction === 700, 'Rent should absorb the remaining 700 cut');
  assert(coffee2.newBudget === 0, 'Coffee new budget should be 0');
  assert(rent2.newBudget === 1300, 'Rent new budget should be 1300');

  // Test Case 3: Target savings exceed total spendable amounts
  const input3: OptimizationInput = {
    targetSavings: 5000,
    categories: [
      { name: 'Dining Out', monthlySpend: 1000, frictionScore: 0.5 },
      { name: 'Shopping', monthlySpend: 1000, frictionScore: 0.3 }
    ]
  };

  const result3 = optimizeSavings(input3);
  console.log('Test Case 3 Result (Oversubscribed savings):', JSON.stringify(result3, null, 2), '\n');

  assert(result3.totalSavings === 2000, 'Total savings should cap at total spending of 2000');
  result3.recommendations.forEach(r => {
    assert(r.suggestedReduction === r.currentSpend, `Category ${r.category} should be fully reduced to current spend`);
    assert(r.newBudget === 0, `Category ${r.category} new budget should be exactly 0`);
  });

  // Test Case 4: Zero savings requested
  const input4: OptimizationInput = {
    targetSavings: 0,
    categories: [
      { name: 'Groceries', monthlySpend: 1200, frictionScore: 0.4 }
    ]
  };
  const result4 = optimizeSavings(input4);
  assert(result4.totalSavings === 0, 'Zero target savings should result in zero total savings');
  assert(result4.recommendations[0].suggestedReduction === 0, 'Suggested reduction should be 0');
  assert(result4.recommendations[0].newBudget === 1200, 'New budget should remain equal to monthly spend');

  console.log('\n🎉 All tests passed successfully!');
}

runTests();
