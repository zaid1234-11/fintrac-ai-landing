import { generateCoachingFeedback, CoachingInput } from './coachingEngine';
import { optimizeSavings } from './elasticSavingsEngine';

// Helper assertion function
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`✅ Passed: ${message}`);
}

function runTests() {
  console.log('🧪 Running AI Coaching Engine Tests...\n');

  const spendingCategories = {
    Shopping: 12000,
    Dining: 8000,
    Uber: 4000,
    Entertainment: 6000
  };

  const frictionScores = {
    Shopping: 0.3,
    Dining: 0.5,
    Uber: 0.7,
    Entertainment: 0.4
  };

  const savingsGoal = 5000;

  // Run optimizer to get optimizationResults
  const optimizationResults = optimizeSavings({
    targetSavings: savingsGoal,
    categories: Object.keys(spendingCategories).map(name => ({
      name,
      monthlySpend: spendingCategories[name as keyof typeof spendingCategories],
      frictionScore: frictionScores[name as keyof typeof frictionScores]
    }))
  });

  const coachingInput: CoachingInput = {
    spendingCategories,
    frictionScores,
    savingsGoal,
    optimizationResults
  };

  const feedback = generateCoachingFeedback(coachingInput);
  console.log('Feedback Output:\n', JSON.stringify(feedback, null, 2), '\n');

  assert(feedback.personalizedExplanation.includes('₹5,000'), 'Explanation should mention savings goal of 5000');
  assert(feedback.selectedAnalysis.includes('Shopping'), 'Selected analysis should mention Shopping');
  assert(feedback.protectedAnalysis.includes('Uber'), 'Protected analysis should protect high-friction Uber');
  assert(feedback.behavioralInsights.length > 50, 'Insights should be detailed');
  assert(feedback.actionPlan.length >= 2, 'Should recommend actionable plans');

  console.log('\n🎉 All tests passed successfully!');
}

runTests();
