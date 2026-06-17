import { SupabaseClient } from '@supabase/supabase-js';

export interface FailureStreaks {
  [category: string]: number;
}

export interface ComplianceStreaks {
  [category: string]: number;
}

export interface FrictionScores {
  [category: string]: number;
}

/**
 * Executes reinforcement learning update rule for a user's friction scores
 * based on their budget compliance for the evaluated month.
 * 
 * @param supabase Authenticated or Admin Supabase Client
 * @param userId User identifier to run calculations for
 * @param evaluationDate Date representing the 1st of the current month (evaluating the previous calendar month)
 */
export async function runMonthlyFrictionUpdateForUser(
  supabase: SupabaseClient,
  userId: string,
  evaluationDate: Date
): Promise<void> {
  const learningRate = 0.10;
  const decayRate = 0.05; // Friction recovery decay for perfect compliance
  const recoveryThreshold = 3; // Months of consecutive compliance required for decay

  // Calculate boundaries for the completed month
  // If evaluationDate is 2026-06-06 (June), the completed month is May.
  // Month index for June is 5. Month index for May is 4.
  // new Date(2026, 5, 0) gives the last day of May (May 31st).
  // new Date(2026, 4, 1) gives May 1st.
  const targetYear = evaluationDate.getFullYear();
  const targetMonth = evaluationDate.getMonth(); // 0-indexed, so if June (5), targetMonth is 5.
  
  const startOfMonth = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

  const monthKeyDate = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth(), 1);
  const monthKeyStr = monthKeyDate.toISOString().split('T')[0];

  console.log(`[Friction Update] Evaluating user ${userId} for period: ${startOfMonth.toISOString()} to ${endOfMonth.toISOString()} (Key: ${monthKeyStr})`);

  // 1. Fetch user's behavioral profile
  const { data: profile, error: profileErr } = await supabase
    .from('behavioral_profiles')
    .select('id, friction_scores, failure_streaks, compliance_streaks')
    .eq('user_id', userId)
    .single();

  if (profileErr || !profile) {
    console.error(`[Friction Update] Profile not found for user ${userId}:`, profileErr);
    return;
  }

  const frictionScores: FrictionScores = profile.friction_scores || {};
  const failureStreaks: FailureStreaks = profile.failure_streaks || {};
  const complianceStreaks: ComplianceStreaks = profile.compliance_streaks || {};

  // 2. Fetch the historical budget limits set for the completed month
  const { data: recommendedBudgets, error: budgetErr } = await supabase
    .from('historical_budgets')
    .select('category, budget_limit, suggested_cut')
    .eq('user_id', userId)
    .eq('month_date', monthKeyStr);

  if (budgetErr || !recommendedBudgets || recommendedBudgets.length === 0) {
    console.log(`[Friction Update] No budgets recorded for user ${userId} in month ${monthKeyStr}. Skipping friction updates.`);
    return;
  }

  // 3. Fetch actual spending in the completed month
  const { data: txs, error: txErr } = await supabase
    .from('transactions')
    .select('amount, category_id, date, categories(name)')
    .eq('user_id', userId)
    .eq('type', 'debit')
    .gte('date', startOfMonth.toISOString())
    .lte('date', endOfMonth.toISOString());

  if (txErr || !txs) {
    console.error(`[Friction Update] Error fetching transactions for user ${userId}:`, txErr);
    return;
  }

  // Aggregate actual spends by category name
  const actualSpends: Record<string, number> = {};
  txs.forEach((t: any) => {
    const catName = t.categories?.name || 'Other';
    actualSpends[catName] = (actualSpends[catName] || 0) + Number(t.amount);
  });

  const updatedFrictions: FrictionScores = { ...frictionScores };
  const updatedStreaks: FailureStreaks = { ...failureStreaks };
  const updatedComplianceStreaks: ComplianceStreaks = { ...complianceStreaks };

  // 4. Calculate compliance and run reinforcement update rule
  for (const recommended of recommendedBudgets) {
    const cat = recommended.category;
    const targetBudget = Number(recommended.budget_limit);
    const suggestedCut = Number(recommended.suggested_cut);
    const actualSpend = actualSpends[cat] || 0;

    if (suggestedCut <= 0) {
      // No cuts were recommended, compliance is neutral, reset failure streaks
      updatedStreaks[cat] = 0;
      continue;
    }

    // Previous month spending reference: what they spent before applying the cut
    const previousSpend = targetBudget + suggestedCut;

    // Actual reduction achieved
    const actualCut = Math.max(0, previousSpend - actualSpend);
    const compliance = Math.min(1.0, actualCut / suggestedCut);

    const currentFriction = frictionScores[cat] ?? 0.5; // Uninformed prior default

    if (compliance < 0.99) {
      // Overrun / Non-compliance
      const currentStreak = failureStreaks[cat] || 0;
      const nextStreak = currentStreak + 1;
      updatedStreaks[cat] = nextStreak;
      updatedComplianceStreaks[cat] = 0; // Reset compliance streak on failure

      // Streak Penalty: starts at 1.0, scales by 0.5 per consecutive failure
      const streakPenalty = 1.0 + (currentStreak * 0.5);

      // F_{t+1} = min(1.0, F_t + alpha * (1 - C) * StreakPenalty)
      const penaltyAmount = learningRate * (1.0 - compliance) * streakPenalty;
      updatedFrictions[cat] = Number(Math.min(1.0, currentFriction + penaltyAmount).toFixed(4));

      console.log(`[Friction Update] User ${userId} category ${cat} non-compliant. Compliance: ${(compliance * 100).toFixed(1)}%, Failure Streak: ${nextStreak}, Friction: ${currentFriction} -> ${updatedFrictions[cat]}`);
    } else {
      // Complied perfectly!
      updatedStreaks[cat] = 0; // Reset failure streak
      
      const currentCompStreak = complianceStreaks[cat] || 0;
      const nextCompStreak = currentCompStreak + 1;
      updatedComplianceStreaks[cat] = nextCompStreak;

      // Apply friction decay/recovery only after threshold is met (consecutive success >= 3)
      if (nextCompStreak >= recoveryThreshold) {
        updatedFrictions[cat] = Number(Math.max(0.0, currentFriction - decayRate).toFixed(4));
        console.log(`[Friction Update] User ${userId} category ${cat} compliant. Compliance Streak: ${nextCompStreak} months. Friction decayed: ${currentFriction} -> ${updatedFrictions[cat]}`);
      } else {
        updatedFrictions[cat] = currentFriction; // Reinforced without decay
        console.log(`[Friction Update] User ${userId} category ${cat} compliant. Compliance Streak: ${nextCompStreak} months. Friction reinforced at: ${currentFriction}`);
      }
    }
  }

  // 5. Update behavioral profile back to database
  const { error: updateErr } = await supabase
    .from('behavioral_profiles')
    .update({
      friction_scores: updatedFrictions,
      failure_streaks: updatedStreaks,
      compliance_streaks: updatedComplianceStreaks,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id);

  if (updateErr) {
    console.error(`[Friction Update] Error updating profile ${profile.id}:`, updateErr);
  } else {
    console.log(`[Friction Update] Successfully updated behavioral weights for user ${userId}.`);
  }
}
