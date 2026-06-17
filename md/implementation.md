# Implementation Plan - Reinforcement Learning Friction Updates & Self-Healing Budgets

This plan outlines the implementation of an **adaptive reinforcement learning system** in FinTrac AI. By monitoring monthly budget compliance, the system dynamically updates category friction scores (behavioral weight vectors). This turns recommendations from static goals into self-healing, personalized targets.

---

## Decisions Aligned with User

> [!NOTE]
> - **Initial Friction Mapping (Cold Start)**: Default to `0.5` (Neutral Prior/Maximum Entropy). This uninformed prior allows the reinforcement learning agent to map the state-space entirely through user interactions.
> - **Friction Decay/Recovery (Habit Formation)**: If the user complies perfectly for 3+ consecutive months (meaning `compliance_streak >= 3`), apply a friction recovery bonus decay of `-0.05` to reflect true psychological habit changes. Do not decay on a single month of success to prevent flukes from distorting the behavioral profile.

---

## Proposed Changes

### Database Layer

A new migration is required to store historical budget limits and recommended cuts. We will also extend the existing `behavioral_profiles` table to persist failure streaks, compliance streaks, and dynamically updated friction scores.

#### [NEW] [00013_friction_updates.sql](file:///C:/Users/zaids/.gemini/antigravity/scratch/fintrac-ai-landing/supabase/migrations/00013_friction_updates.sql)

- Create a `historical_budgets` table to store monthly budget recommendations.
- Add `friction_scores`, `failure_streaks`, and `compliance_streaks` JSONB columns to `behavioral_profiles`.

```sql
-- Migration 00013: Reinforcement Learning Friction Updates & Historical Budgets

-- 1. Historical Budgets Table
CREATE TABLE IF NOT EXISTS public.historical_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    month_date DATE NOT NULL, -- e.g., '2026-05-01' representing the recommended budget for May 2026
    budget_limit DECIMAL(12, 2) NOT NULL,
    suggested_cut DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category, month_date)
);

-- Enable RLS on historical_budgets
ALTER TABLE public.historical_budgets ENABLE ROW LEVEL SECURITY;

-- Select/Insert policies for users
CREATE POLICY "Users can manage own historical budgets"
    ON public.historical_budgets FOR ALL
    USING (user_id = auth.uid() OR user_id = (SELECT id FROM public.users WHERE id = auth.uid()));

-- 2. Behavioral Profile Additions
ALTER TABLE public.behavioral_profiles
    ADD COLUMN IF NOT EXISTS friction_scores JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS failure_streaks JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS compliance_streaks JSONB DEFAULT '{}'::jsonb;
```

---

### Core Behavioral / AI Layer

We will build the update engine that fetches transactions, matches them against recommended budgets, applies the dynamic Q-learning style formula, and saves results.

#### [NEW] [updateFrictionWeights.ts](file:///C:/Users/zaids/.gemini/antigravity/scratch/fintrac-ai-landing/src/lib/ai/updateFrictionWeights.ts)

- Computes compliance $C = A / P$ for each category.
- Increments failure streaks and applies the `StreakPenalty` multiplier ($1.0 + \text{streak} \times 0.5$) for overruns.
- Updates friction scores: $F_{t+1} = \min(1.0, F_t + \alpha \cdot (1 - C) \cdot \text{StreakPenalty})$.
- Tracks `compliance_streaks`. If the user achieves a compliance streak $\ge 3$ consecutive months, reduces friction score by `decayRate` (`0.05`).
- Resets failure streaks to `0` upon compliance.

```typescript
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
  const endOfMonth = new Date(evaluationDate.getFullYear(), evaluationDate.getMonth(), 0, 23, 59, 59);
  const startOfMonth = new Date(evaluationDate.getFullYear(), evaluationDate.getMonth() - 1, 1, 0, 0, 0);

  const monthKeyDate = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth(), 1);
  const monthKeyStr = monthKeyDate.toISOString().split('T')[0];

  // 1. Fetch user's behavioral profile
  const { data: profile, error: profileErr } = await supabase
    .from('behavioral_profiles')
    .select('id, friction_scores, failure_streaks, compliance_streaks')
    .eq('user_id', userId)
    .single();

  if (profileErr || !profile) {
    console.error(`[Friction Update] Profile not found for user ${userId}.`);
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
    console.log(`[Friction Update] No budgets recorded for user ${userId} in month ${monthKeyStr}. Skipping.`);
    return;
  }

  // 3. Fetch actual spending in the completed month
  const { data: txs, error: txErr } = await supabase
    .from('transactions')
    .select('amount, category:categories(name)')
    .eq('user_id', userId)
    .eq('type', 'debit')
    .gte('date', startOfMonth.toISOString())
    .lte('date', endOfMonth.toISOString());

  if (txErr || !txs) {
    console.error(`[Friction Update] Error fetching transactions for user ${userId}:`, txErr);
    return;
  }

  // Aggregate actual spends
  const actualSpends: Record<string, number> = {};
  txs.forEach((t: any) => {
    const catName = t.category?.name || 'Other';
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
      // No cuts were recommended, compliance is neutral
      updatedStreaks[cat] = 0;
      continue;
    }

    // Previous month spending reference: what they had before the cut
    const previousSpend = targetBudget + suggestedCut;

    // Actual reduction achieved
    const actualCut = Math.max(0, previousSpend - actualSpend);
    const compliance = Math.min(1.0, actualCut / suggestedCut);

    const currentFriction = frictionScores[cat] ?? 0.5; // Uninformed prior default

    if (compliance < 0.99) {
      // Overrun / Ignored advice
      const currentStreak = failureStreaks[cat] || 0;
      const nextStreak = currentStreak + 1;
      updatedStreaks[cat] = nextStreak;
      updatedComplianceStreaks[cat] = 0; // Reset compliance streak on failure

      // Streak Penalty: starts at 1.0, scales by 0.5 per consecutive failure
      const streakPenalty = 1.0 + (currentStreak * 0.5);

      // F_{t+1} = min(1.0, F_t + alpha * (1 - C) * StreakPenalty)
      const penaltyAmount = learningRate * (1.0 - compliance) * streakPenalty;
      updatedFrictions[cat] = Number(Math.min(1.0, currentFriction + penaltyAmount).toFixed(4));
    } else {
      // Complied perfectly!
      updatedStreaks[cat] = 0; // Reset failure streak
      
      const currentCompStreak = complianceStreaks[cat] || 0;
      const nextCompStreak = currentCompStreak + 1;
      updatedComplianceStreaks[cat] = nextCompStreak;

      // Apply friction decay/recovery only after threshold is met (consecutive success >= 3)
      if (nextCompStreak >= recoveryThreshold) {
        updatedFrictions[cat] = Number(Math.max(0.0, currentFriction - decayRate).toFixed(4));
      } else {
        updatedFrictions[cat] = currentFriction; // Reinforced without decay
      }
    }
  }

  // 5. Update behavioral profile back to database
  await supabase
    .from('behavioral_profiles')
    .update({
      friction_scores: updatedFrictions,
      failure_streaks: updatedStreaks,
      compliance_streaks: updatedComplianceStreaks,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id);

  console.log(`[Friction Update] Successfully updated behavioral weights for user ${userId}.`);
}
```

---

### Jobs & Inngest Integration

We will wire the friction updating function into Inngest to run on a monthly schedule.

#### [MODIFY] [functions.ts](file:///C:/Users/zaids/.gemini/antigravity/scratch/fintrac-ai-landing/src/lib/jobs/functions.ts)

- Add a new Inngest background function `monthlyFrictionUpdate` that runs on a cron trigger (`0 0 1 * *` - midnight of the 1st of every month).
- This function queries all active users and fires parallel updates.

```typescript
import { runMonthlyFrictionUpdateForUser } from '@/lib/ai/updateFrictionWeights';

export const monthlyFrictionUpdate = inngest.createFunction(
  {
    id: 'monthly-friction-update',
    name: 'Monthly Friction Update Cron',
  },
  { cron: '0 0 1 * *' }, // Runs at 00:00 on the 1st of every month
  async ({ step }) => {
    const supabase = createAdminClient();

    // 1. Fetch all active users
    const users = await step.run('fetch-active-users', async () => {
      const { data, error } = await supabase.from('users').select('id');
      if (error) throw error;
      return data || [];
    });

    // 2. Perform updates for each user
    const evaluationDate = new Date(); // Runs on the 1st, evaluates the previous month

    for (const user of users) {
      await step.run(`update-friction-user-${user.id}`, async () => {
        await runMonthlyFrictionUpdateForUser(supabase, user.id, evaluationDate);
      });
    }

    return { updatedUsers: users.length };
  }
);
```

#### [MODIFY] [route.ts](file:///C:/Users/zaids/.gemini/antigravity/scratch/fintrac-ai-landing/src/app/api/inngest/route.ts)

- Include the `monthlyFrictionUpdate` function in the exported serve router.

```diff
  import { serve } from 'inngest/next';
  import { inngest } from '@/lib/jobs/inngest-client';
- import { processStatementUpload, recalculateUserInsights } from '@/lib/jobs/functions';
+ import { processStatementUpload, recalculateUserInsights, monthlyFrictionUpdate } from '@/lib/jobs/functions';
  
  export const dynamic = "force-dynamic";
  
  // Expose the Inngest API endpoint
  export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
      processStatementUpload,
      recalculateUserInsights,
+     monthlyFrictionUpdate,
    ],
  });
```

---

## Self-Healing Simulation Walkthrough

Below is a walkthrough demonstrating the adaptive system under consecutive overruns in `Shopping` followed by sustained perfect compliance:

```
Initial Budget State (Month 1):
- Total Savings Target: ₹3,000
- Shopping: Spend = ₹10,000, Friction = 0.20 (Highly elastic)
- Dining: Spend = ₹8,000, Friction = 0.40 (Moderately elastic)

Month 1: User Ignores Shopping Target
------------------------------------------------------------
1. AI Suggested Cuts: Shopping = ₹2,000, Dining = ₹1,000.
2. User Behavior: Ignores Shopping, spends ₹10,000.
3. Outcome: Shopping compliance = 0.0, streak = 1 failure.
4. Update: F_shopping = 0.20 + 0.10 * (1 - 0) * 1.0 = 0.30.

Month 2: Shopping Friction Adjusts upward
------------------------------------------------------------
1. AI Suggested Cuts: Shopping = ₹1,400, Dining = ₹1,600.
2. User Behavior: Ignores Shopping again, spends ₹10,000.
3. Outcome: Shopping compliance = 0.0, streak = 2 failures.
4. Update: F_shopping = 0.30 + 0.10 * (1 - 0) * 1.5 = 0.45.

Month 3: Shopping Is Highly Rigid
------------------------------------------------------------
1. AI Suggested Cuts: Shopping = ₹500, Dining = ₹2,500.
2. User Behavior: Spends ₹10,000 on Shopping.
3. Outcome: Shopping compliance = 0.0, streak = 3 failures.
4. Update: F_shopping = 0.45 + 0.10 * (1 - 0) * 2.0 = 0.65.

Month 4: Immutability Lock Met
------------------------------------------------------------
1. AI Suggested Cuts: Shopping = ₹0, Dining = ₹3,000.
2. User Behavior: Shopping is protected. User achieves perfect compliance (C = 1.0).
3. Outcome: Shopping compliance = 1.0, failure streak resets to 0. compliance_streak = 1.
4. Update: F_shopping remains 0.65.

Months 5 & 6: Continued Compliance (Habit Formation)
------------------------------------------------------------
- Month 5: Perfect compliance. compliance_streak = 2. F_shopping = 0.65.
- Month 6: Perfect compliance. compliance_streak = 3. 
  Cooldown threshold (3 months) met! Apply recovery decay:
  F_shopping = 0.65 - 0.05 = 0.60.
```

---

## Verification Plan

### Automated Tests
- Build and run typecheck to ensure zero syntax or compilation issues:
  ```bash
  npx tsc --noEmit
  npm run build
  ```
- Run a local unit-test runner file simulating compliance updates over dummy profile data:
  ```bash
  npx ts-node src/lib/ai/runFrictionUpdatesTests.ts
  ```

### Manual Verification
- Deploy schema to local Supabase database.
- Trigger the Inngest function manually using the Inngest Dev Server dashboard at `http://localhost:8288` and verify updates to the `behavioral_profiles` table.
