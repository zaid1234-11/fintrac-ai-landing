// Unit tests for Reinforcement Learning Friction Updates & Self-Healing budgets

// Simple assertion helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`✅ Passed: ${message}`);
}

// Simulates the math logic of runMonthlyFrictionUpdateForUser in-memory
interface BehavioralProfile {
  frictionScores: Record<string, number>;
  failureStreaks: Record<string, number>;
  complianceStreaks: Record<string, number>;
}

interface BudgetLimit {
  category: string;
  budgetLimit: number;
  suggestedCut: number;
}

function computeUpdatedFrictionProfile(
  profile: BehavioralProfile,
  budgets: BudgetLimit[],
  actualSpends: Record<string, number>,
  learningRate = 0.15,
  decayRate = 0.05,
  recoveryThreshold = 3
): BehavioralProfile {
  const updatedFrictions = { ...profile.frictionScores };
  const updatedFailStreaks = { ...profile.failureStreaks };
  const updatedCompStreaks = { ...profile.complianceStreaks };

  for (const recommended of budgets) {
    const cat = recommended.category;
    const targetBudget = recommended.budgetLimit;
    const suggestedCut = recommended.suggestedCut;
    const actualSpend = actualSpends[cat] || 0;

    if (suggestedCut <= 0) {
      updatedFailStreaks[cat] = 0;
      continue;
    }

    const previousSpend = targetBudget + suggestedCut;
    const actualCut = Math.max(0, previousSpend - actualSpend);
    const compliance = Math.min(1.0, actualCut / suggestedCut);

    const currentFriction = profile.frictionScores[cat] ?? 0.5; // default/prior

    if (compliance < 0.99) {
      // Non-compliant
      const currentStreak = profile.failureStreaks[cat] || 0;
      const nextStreak = currentStreak + 1;
      updatedFailStreaks[cat] = nextStreak;
      updatedCompStreaks[cat] = 0;

      const streakPenalty = 1.0 + (currentStreak * 0.5);
      const penaltyAmount = learningRate * (1.0 - compliance) * streakPenalty;
      updatedFrictions[cat] = Number(Math.min(1.0, currentFriction + penaltyAmount).toFixed(4));
    } else {
      // Complied!
      updatedFailStreaks[cat] = 0;
      const currentCompStreak = profile.complianceStreaks[cat] || 0;
      const nextCompStreak = currentCompStreak + 1;
      updatedCompStreaks[cat] = nextCompStreak;

      if (nextCompStreak >= recoveryThreshold) {
        updatedFrictions[cat] = Number(Math.max(0.0, currentFriction - decayRate).toFixed(4));
      } else {
        updatedFrictions[cat] = currentFriction;
      }
    }
  }

  return {
    frictionScores: updatedFrictions,
    failureStreaks: updatedFailStreaks,
    complianceStreaks: updatedCompStreaks,
  };
}

function runTests() {
  console.log('🧪 Running Reinforcement Learning Friction Update Tests...\n');

  // Test Case 1: Cold Start behavior (Defaults to 0.5 if not found)
  let profile: BehavioralProfile = {
    frictionScores: {},
    failureStreaks: {},
    complianceStreaks: {},
  };

  const budgets: BudgetLimit[] = [
    { category: 'Shopping', budgetLimit: 8000, suggestedCut: 2000 },
  ];

  // User completely ignores the cut (spends 10000)
  let actualSpends = { Shopping: 10000 };

  profile = computeUpdatedFrictionProfile(profile, budgets, actualSpends);

  assert(profile.failureStreaks['Shopping'] === 1, 'First failure should set streak to 1');
  assert(profile.complianceStreaks['Shopping'] === 0, 'Compliance streak should reset to 0');
  
  // Math: 0.5 (default prior) + 0.15 * (1 - 0) * 1.0 = 0.65
  assert(profile.frictionScores['Shopping'] === 0.65, 'Friction should increase to 0.65 on first failure');

  // Test Case 2: Consecutive Failure with Streak Penalty
  // User ignores the cut again
  // Budgets for Month 2 (Shopping cut size is smaller due to higher friction):
  const budgetsMonth2: BudgetLimit[] = [
    { category: 'Shopping', budgetLimit: 8600, suggestedCut: 1400 },
  ];
  actualSpends = { Shopping: 10000 }; // ignores again

  profile = computeUpdatedFrictionProfile(profile, budgetsMonth2, actualSpends);

  assert(profile.failureStreaks['Shopping'] === 2, 'Second consecutive failure should set streak to 2');
  // Math: 0.65 + 0.15 * (1 - 0) * 1.5 = 0.65 + 0.225 = 0.875
  assert(profile.frictionScores['Shopping'] === 0.875, 'Friction should increase to 0.875 due to 1.5x streak penalty');

  // Test Case 3: Compliance Resets Failure Streak and Increments Compliance Streak
  // User complies with a small cut of 0 suggested cut (meaning target budget met perfectly)
  const budgetsMonth3: BudgetLimit[] = [
    { category: 'Shopping', budgetLimit: 10000, suggestedCut: 0 },
  ];
  actualSpends = { Shopping: 10000 };

  profile = computeUpdatedFrictionProfile(profile, budgetsMonth3, actualSpends);
  assert(profile.failureStreaks['Shopping'] === 0, 'Zero recommended cuts should clear failure streaks');

  // Now recommend a cut of 500
  const budgetsMonth4: BudgetLimit[] = [
    { category: 'Shopping', budgetLimit: 9500, suggestedCut: 500 },
  ];
  actualSpends = { Shopping: 9500 }; // Perfect compliance!

  profile = computeUpdatedFrictionProfile(profile, budgetsMonth4, actualSpends);
  assert(profile.failureStreaks['Shopping'] === 0, 'Failure streak should be 0 on compliance');
  assert(profile.complianceStreaks['Shopping'] === 1, 'Compliance streak should increment to 1');
  assert(profile.frictionScores['Shopping'] === 0.875, 'Friction score should NOT decay on Month 1 of success');

  // Test Case 4: Cooldown Threshold and Decay
  // Month 5: Perfect compliance again
  profile = computeUpdatedFrictionProfile(profile, budgetsMonth4, actualSpends);
  assert(profile.complianceStreaks['Shopping'] === 2, 'Compliance streak should increment to 2');
  assert(profile.frictionScores['Shopping'] === 0.875, 'Friction score should NOT decay on Month 2 of success');

  // Month 6: Perfect compliance again (Month 3 of success)
  profile = computeUpdatedFrictionProfile(profile, budgetsMonth4, actualSpends);
  assert(profile.complianceStreaks['Shopping'] === 3, 'Compliance streak should increment to 3');
  // Math: 0.875 - 0.05 = 0.825
  assert(profile.frictionScores['Shopping'] === 0.825, 'Friction score should decay by 0.05 after 3 months of consecutive compliance');

  console.log('\n🎉 All Reinforcement Learning Friction Update tests passed successfully!');
}

runTests();
