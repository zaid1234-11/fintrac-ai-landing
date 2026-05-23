import { createAdminClient } from '../supabase/admin';

export interface CandidateInsight {
  type: 'monthly_summary' | 'behavior_analysis' | 'anomaly' | 'recommendation' | 'financial_score';
  title: string;
  description: string;
  metrics: Record<string, any>;
  insight_key: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  relevance_score?: number;
  explanation?: {
    trigger_reason: string;
    source_transaction_ids: string[];
    recurrence_signals: Record<string, any>;
  };
}

/**
 * Runs deep behavioral heuristics over a user's transaction history to detect
 * patterns, subscription recurrence, anomalies, and monthly summaries.
 * Employs time-decay relevance weighting, compound cooldown keys, and prioritization.
 */
export async function generateBehavioralInsights(
  supabase: any,
  userId: string
): Promise<void> {
  try {
    console.log(`🧠 Generating behavioral insights for user: ${userId}...`);

    // 1. Fetch transactions for the user from the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: txs, error } = await supabase
      .from('transactions')
      .select('id, amount, type, category_id, date, merchant_name, categories(name)')
      .eq('user_id', userId)
      .gte('date', ninetyDaysAgo.toISOString())
      .order('date', { ascending: false });

    if (error) {
      console.error('[generateBehavioralInsights] Error fetching transactions:', error.message);
      return;
    }

    if (!txs || txs.length === 0) {
      console.log('No transactions found to analyze.');
      return;
    }

    // Helper: Time-Decay Weighting Function: w(t) = e^(-0.05 * t) where t is in days
    const getDecayWeight = (dateStr: string): number => {
      const txDate = new Date(dateStr);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - txDate.getTime());
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return Math.exp(-0.05 * diffDays);
    };

    const candidateInsights: CandidateInsight[] = [];

    // Group transactions by windows
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(now.getDate() - 14);

    const twentyEightDaysAgo = new Date();
    twentyEightDaysAgo.setDate(now.getDate() - 28);

    const fortyFiveDaysAgo = new Date();
    fortyFiveDaysAgo.setDate(now.getDate() - 45);

    // Filter subsets
    const last7DaysTxs = txs.filter((t: any) => new Date(t.date) >= sevenDaysAgo);
    const prior3WeeksTxs = txs.filter((t: any) => {
      const d = new Date(t.date);
      return d >= twentyEightDaysAgo && d < sevenDaysAgo;
    });

    const last14DaysTxs = txs.filter((t: any) => new Date(t.date) >= fourteenDaysAgo);
    const prior15To45DaysTxs = txs.filter((t: any) => {
      const d = new Date(t.date);
      return d >= fortyFiveDaysAgo && d < fourteenDaysAgo;
    });

    // ----------------------------------------------------
    // HEURISTIC A: Spending Spikes
    // ----------------------------------------------------
    // Trigger: Spend in category >= ₹2,000 in last 7 days AND > 50% increase vs average weekly spend of prior 3 weeks
    const categoryWeeklySpendLast7: Record<string, number> = {};
    const categorySpendPrior3Weeks: Record<string, number> = {};

    last7DaysTxs.forEach((t: any) => {
      if (t.type === 'debit') {
        const catName = t.categories?.name || 'Other';
        categoryWeeklySpendLast7[catName] = (categoryWeeklySpendLast7[catName] || 0) + Number(t.amount);
      }
    });

    prior3WeeksTxs.forEach((t: any) => {
      if (t.type === 'debit') {
        const catName = t.categories?.name || 'Other';
        categorySpendPrior3Weeks[catName] = (categorySpendPrior3Weeks[catName] || 0) + Number(t.amount);
      }
    });

    for (const [catName, currentWeekSpend] of Object.entries(categoryWeeklySpendLast7)) {
      if (currentWeekSpend >= 2000) {
        const priorWeeksTotal = categorySpendPrior3Weeks[catName] || 0;
        const avgWeeklyPrior = priorWeeksTotal / 3;

        // Compare
        const hasSpike = avgWeeklyPrior === 0 || ((currentWeekSpend - avgWeeklyPrior) / avgWeeklyPrior) > 0.5;
        if (hasSpike) {
          const increasePct = avgWeeklyPrior > 0 ? ((currentWeekSpend - avgWeeklyPrior) / avgWeeklyPrior) * 100 : 100;
          
          // Calculate decayed relevance: weight recent transactions higher
          const cat7DayTxs = last7DaysTxs.filter((t: any) => (t.categories?.name || 'Other') === catName && t.type === 'debit');
          const weightedSum = cat7DayTxs.reduce((sum: number, t: any) => sum + Number(t.amount) * getDecayWeight(t.date), 0);
          const absoluteSum = cat7DayTxs.reduce((sum: number, t: any) => sum + Number(t.amount), 1);
          const recencyDecayFactor = weightedSum / absoluteSum; // scale between e^-0.35 (~0.7) and 1.0

          const severity: 'low' | 'medium' | 'high' | 'critical' = increasePct > 100 ? 'high' : 'medium';

          // Collect source transaction IDs for explainability
          const sourceTxIds = cat7DayTxs.map((t: any) => t.id);

          candidateInsights.push({
            type: 'anomaly',
            title: `${catName} Spending Spike`,
            description: `Significant spending spike detected in ${catName}. You spent ₹${currentWeekSpend.toFixed(2)} in the last 7 days compared to a weekly average of ₹${avgWeeklyPrior.toFixed(2)} earlier.`,
            metrics: { category: catName, currentWeekSpend, avgWeeklyPrior, increasePct },
            insight_key: `spending_spike:category:${catName}`,
            severity,
            confidence: 0.90 * recencyDecayFactor,
            explanation: {
              trigger_reason: `Weekly spending in ${catName} increased by ${increasePct.toFixed(1)}% compared to 3-week average`,
              source_transaction_ids: sourceTxIds,
              recurrence_signals: {
                category: catName,
                current_week_spend: currentWeekSpend,
                prior_weekly_avg: avgWeeklyPrior,
                increase_percentage: increasePct,
                recency_decay_factor: recencyDecayFactor
              }
            }
          });
        }
      }
    }

    // ----------------------------------------------------
    // HEURISTIC B: Category Drift
    // ----------------------------------------------------
    // Trigger: Wallet share in last 14 days is >= 15% higher than wallet share in days 15-45. Min spend ₹1,000.
    const totalOutflow14 = last14DaysTxs.filter((t: any) => t.type === 'debit').reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    const totalOutflow15To45 = prior15To45DaysTxs.filter((t: any) => t.type === 'debit').reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    if (totalOutflow14 >= 1000 && totalOutflow15To45 > 0) {
      const catSpend14: Record<string, number> = {};
      const catSpend15To45: Record<string, number> = {};

      last14DaysTxs.forEach((t: any) => {
        if (t.type === 'debit') {
          const catName = t.categories?.name || 'Other';
          catSpend14[catName] = (catSpend14[catName] || 0) + Number(t.amount);
        }
      });

      prior15To45DaysTxs.forEach((t: any) => {
        if (t.type === 'debit') {
          const catName = t.categories?.name || 'Other';
          catSpend15To45[catName] = (catSpend15To45[catName] || 0) + Number(t.amount);
        }
      });

      for (const [catName, amt14] of Object.entries(catSpend14)) {
        if (amt14 >= 1000) {
          const share14 = amt14 / totalOutflow14;
          const amt15To45 = catSpend15To45[catName] || 0;
          const share15To45 = amt15To45 / totalOutflow15To45;

          const drift = share14 - share15To45;
          if (drift >= 0.15) {
            // Collect source transaction IDs for explainability
            const cat14DayTxs = last14DaysTxs.filter((t: any) => (t.categories?.name || 'Other') === catName && t.type === 'debit');
            const sourceTxIds = cat14DayTxs.map((t: any) => t.id);

            candidateInsights.push({
              type: 'behavior_analysis',
              title: `Category Drift: ${catName}`,
              description: `Your wallet share for ${catName} has drifted upward by ${(drift * 100).toFixed(0)}% points over the last 14 days, accounting for ${(share14 * 100).toFixed(0)}% of total outflows.`,
              metrics: { category: catName, share14, share15To45, drift },
              insight_key: `category_drift:category:${catName}`,
              severity: 'medium',
              confidence: 0.85,
              explanation: {
                trigger_reason: `Wallet share for ${catName} increased by ${(drift * 100).toFixed(1)}% compared to prior period`,
                source_transaction_ids: sourceTxIds,
                recurrence_signals: {
                  category: catName,
                  current_share: share14,
                  prior_share: share15To45,
                  drift_percentage: drift * 100,
                  current_spend: amt14,
                  prior_spend: amt15To45
                }
              }
            });
          }
        }
      }
    }

    // ----------------------------------------------------
    // HEURISTIC C: Recurring Subscriptions
    // ----------------------------------------------------
    // Trigger: Identifies recurring debits to same merchant (spaced 25-35 days, or multiple hits in 60-90 days with <= 10% amount variance)
    const debitTxs = txs.filter((t: any) => t.type === 'debit' && t.merchant_name && t.merchant_name !== 'Unknown');
    const merchantGroups: Record<string, any[]> = {};
    debitTxs.forEach((t: any) => {
      if (!merchantGroups[t.merchant_name]) {
        merchantGroups[t.merchant_name] = [];
      }
      merchantGroups[t.merchant_name].push(t);
    });

    for (const [merchant, list] of Object.entries(merchantGroups)) {
      if (list.length >= 2) {
        // Sort ascending by date
        const sorted = [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let hasRecurringInterval = false;
        let avgAmount = 0;
        
        // Calculate consecutive date differences
        const intervals: number[] = [];
        const amounts: number[] = [];

        for (let i = 0; i < sorted.length; i++) {
          amounts.push(Number(sorted[i].amount));
          if (i > 0) {
            const diffTime = Math.abs(new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime());
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            intervals.push(diffDays);
          }
        }

        // Check if any interval is in the subscription range (25 - 35 days)
        const subscriptionIntervals = intervals.filter(d => d >= 25 && d <= 35);
        if (subscriptionIntervals.length > 0 || (sorted.length >= 3 && intervals.every(d => d >= 20 && d <= 40))) {
          // Check variance
          avgAmount = amounts.reduce((sum: number, v: number) => sum + v, 0) / amounts.length;
          const allSimilar = amounts.every(a => Math.abs(a - avgAmount) / avgAmount <= 0.10);
          
          if (allSimilar) {
            // Collect source transaction IDs for explainability
            const sourceTxIds = sorted.map((t: any) => t.id);

            candidateInsights.push({
              type: 'recommendation',
              title: `Recurring Subscription: ${merchant}`,
              description: `We identified recurring payments to ${merchant} averaging ₹${avgAmount.toFixed(2)} every month.`,
              metrics: { merchant, count: sorted.length, averageAmount: avgAmount },
              insight_key: `recurring:merchant:${merchant}`,
              severity: 'low',
              confidence: 0.95,
              explanation: {
                trigger_reason: `Detected ${sorted.length} recurring payments to ${merchant} with consistent amounts`,
                source_transaction_ids: sourceTxIds,
                recurrence_signals: {
                  merchant,
                  transaction_count: sorted.length,
                  average_amount: avgAmount,
                  intervals: intervals,
                  amount_variance: amounts.every(a => Math.abs(a - avgAmount) / avgAmount <= 0.10)
                }
              }
            });
          }
        }
      }
    }

    // ----------------------------------------------------
    // HEURISTIC D: Impulsive Late-Night Spending
    // ----------------------------------------------------
    // Trigger: Spent >= ₹1,500 late-night (11 PM to 5 AM) in the last 7 days.
    const lateNight7Days = last7DaysTxs.filter((t: any) => {
      if (t.type !== 'debit') return false;
      const hour = new Date(t.date).getHours();
      return hour >= 23 || hour < 5;
    });

    const absoluteLateNight7DaySum = lateNight7Days.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    if (absoluteLateNight7DaySum >= 1500) {
      // Calculate decayed relevance using last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const lateNight30Days = txs.filter((t: any) => {
        if (t.type !== 'debit') return false;
        const d = new Date(t.date);
        if (d < thirtyDaysAgo) return false;
        const hour = d.getHours();
        return hour >= 23 || hour < 5;
      });

      const weightedLateNightSum = lateNight30Days.reduce((sum: number, t: any) => sum + Number(t.amount) * getDecayWeight(t.date), 0);
      const absoluteLateNightSum = lateNight30Days.reduce((sum: number, t: any) => sum + Number(t.amount), 1);
      const recencyDecayFactor = Math.max(0.5, Math.min(1.0, weightedLateNightSum / absoluteLateNightSum));

      const severity = absoluteLateNight7DaySum >= 5000 ? 'high' : 'medium';

      // Collect source transaction IDs for explainability
      const sourceTxIds = lateNight7Days.map((t: any) => t.id);

      candidateInsights.push({
        type: 'behavior_analysis',
        title: 'Impulsive Late-Night Spending',
        description: `You spent ₹${absoluteLateNight7DaySum.toFixed(2)} during late-night hours (11 PM - 5 AM) in the last 7 days across ${lateNight7Days.length} transactions.`,
        metrics: { count: lateNight7Days.length, absoluteLateNight7DaySum },
        insight_key: 'late_night:all',
        severity,
        confidence: 0.90 * recencyDecayFactor,
        explanation: {
          trigger_reason: `Late-night spending (11 PM - 5 AM) exceeded ₹1,500 threshold in last 7 days`,
          source_transaction_ids: sourceTxIds,
          recurrence_signals: {
            transaction_count: lateNight7Days.length,
            total_amount: absoluteLateNight7DaySum,
            time_window: '11 PM - 5 AM',
            period_days: 7,
            recency_decay_factor: recencyDecayFactor
          }
        }
      });
    }

    // ----------------------------------------------------
    // HEURISTIC E: Salary Burn Velocity
    // ----------------------------------------------------
    // Trigger: Last salary credit date found (credits >= ₹30,000 with salary indicators), AND total debits in the 7 days following salary are > 50% of that salary.
    const salaryCredits = txs.filter((t: any) => {
      if (t.type !== 'credit') return false;
      const isSalaryCat = t.categories?.name === 'Salary';
      const amt = Number(t.amount);
      const matchesKeyword = /(salary|payroll|stipend|wages)/i.test(t.merchant_name || '') || /(salary|payroll|stipend|wages)/i.test(t.description || '');
      return (isSalaryCat || (amt >= 30000 && matchesKeyword));
    });

    if (salaryCredits.length > 0) {
      // Latest salary credit
      const latestSalary = salaryCredits[0];
      const salaryAmt = Number(latestSalary.amount);
      const salaryDate = new Date(latestSalary.date);
      
      // Calculate 7 days window after salary
      const sevenDaysAfterSalary = new Date(salaryDate);
      sevenDaysAfterSalary.setDate(salaryDate.getDate() + 7);

      const debitsAfterSalary = txs.filter((t: any) => {
        if (t.type !== 'debit') return false;
        const d = new Date(t.date);
        return d >= salaryDate && d <= sevenDaysAfterSalary;
      });

      const totalBurned = debitsAfterSalary.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      const burnVelocityPct = (totalBurned / salaryAmt) * 100;

      if (burnVelocityPct > 50) {
        const severity = burnVelocityPct > 70 ? 'high' : 'medium';
        const dateKeyStr = salaryDate.toISOString().split('T')[0];

        // Collect source transaction IDs for explainability
        const sourceTxIds = debitsAfterSalary.map((t: any) => t.id);

        candidateInsights.push({
          type: 'behavior_analysis',
          title: 'High Salary Burn Velocity',
          description: `You have spent ${burnVelocityPct.toFixed(0)}% of your salary (₹${totalBurned.toFixed(2)} out of ₹${salaryAmt.toFixed(2)}) within 7 days of receiving it.`,
          metrics: { salaryAmt, totalBurned, burnVelocityPct, salaryDate: latestSalary.date },
          insight_key: `salary_burn:date:${dateKeyStr}`,
          severity,
          confidence: 0.95,
          explanation: {
            trigger_reason: `Burned ${burnVelocityPct.toFixed(1)}% of salary within 7 days of credit`,
            source_transaction_ids: sourceTxIds,
            recurrence_signals: {
              salary_amount: salaryAmt,
              salary_date: latestSalary.date,
              amount_burned: totalBurned,
              burn_percentage: burnVelocityPct,
              burn_window_days: 7,
              transaction_count: debitsAfterSalary.length
            }
          }
        });
      }
    }

    // ----------------------------------------------------
    // Prioritization & Cooldown Loop
    // ----------------------------------------------------
    console.log(`Candidates generated: ${candidateInsights.length}`);
    const allowedInsights: CandidateInsight[] = [];
    const sevenDaysAgoThreshold = new Date();
    sevenDaysAgoThreshold.setDate(now.getDate() - 7);

    // Fetch existing insights to check cooldowns
    const { data: recentInsights, error: coolErr } = await supabase
      .from('ai_insights')
      .select('insight_key')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgoThreshold.toISOString());

    const recentKeys = new Set((recentInsights || []).map((ri: any) => ri.insight_key).filter(Boolean));

    for (const candidate of candidateInsights) {
      if (recentKeys.has(candidate.insight_key)) {
        console.log(`⏳ Cooldown active for: ${candidate.insight_key}. Skipping.`);
        continue;
      }

      // Calculate relevance score: (severity_weight * 0.6) + (confidence * 0.4)
      const severityWeights = {
        low: 0.25,
        medium: 0.50,
        high: 0.75,
        critical: 1.00,
      };

      const sWeight = severityWeights[candidate.severity];
      candidate.relevance_score = Number(((sWeight * 0.6) + (candidate.confidence * 0.4)).toFixed(2));
      allowedInsights.push(candidate);
    }

    // Sort by relevance score descending
    allowedInsights.sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0));
    const topInsights = allowedInsights.slice(0, 3);

    console.log(`Saving top ${topInsights.length} insights to DB...`);
    const todayStr = new Date().toISOString().split('T')[0];

    for (const insight of topInsights) {
      // Let's delete any duplicate matching key from today to prevent duplicates
      await supabase
        .from('ai_insights')
        .delete()
        .eq('user_id', userId)
        .eq('insight_key', insight.insight_key)
        .eq('insight_date', todayStr);

      // Insert the insight and get the ID
      const { data: insertedInsight, error: insertError } = await supabase
        .from('ai_insights')
        .insert({
          user_id: userId,
          type: insight.type,
          title: insight.title,
          description: insight.description,
          metrics: insight.metrics,
          is_read: false,
          insight_date: todayStr,
          insight_key: insight.insight_key,
          severity: insight.severity,
          confidence: Number(insight.confidence.toFixed(2)),
          relevance_score: insight.relevance_score,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('[generateBehavioralInsights] Error inserting insight:', insertError.message);
        continue;
      }

      // Insert explanation record if explanation exists
      if (insight.explanation && insertedInsight) {
        await supabase.from('insight_explanations').insert({
          insight_id: insertedInsight.id,
          trigger_reason: insight.explanation.trigger_reason,
          source_transaction_ids: insight.explanation.source_transaction_ids,
          recurrence_signals: insight.explanation.recurrence_signals,
        });
      }
    }

    // ----------------------------------------------------
    // Personality Graph (Traits Engine)
    // ----------------------------------------------------
    console.log('Calculating user financial personality traits...');
    const traits = new Set<string>();

    const debits90Days = txs.filter((t: any) => t.type === 'debit');
    const totalOutflow90 = debits90Days.reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    // 1. late_night_food_spender: User has >= 3 late-night food debits.
    const lateNightFoodCount = debits90Days.filter((t: any) => {
      const cat = t.categories?.name || 'Other';
      const hour = new Date(t.date).getHours();
      return cat === 'Food' && (hour >= 23 || hour < 5);
    }).length;
    if (lateNightFoodCount >= 3) traits.add('late_night_food_spender');

    // 2. subscription_dense: User has >= 3 active subscriptions.
    const subCount = topInsights.filter(ins => ins.insight_key.startsWith('recurring:')).length;
    // We can also search in the entire candidates array for recurring insights
    const allSubsCount = candidateInsights.filter(ins => ins.insight_key.startsWith('recurring:')).length;
    if (allSubsCount >= 3) traits.add('subscription_dense');

    // 3. weekend_impulse_spender: Spend on Fri-Sun is >= 60% of total spending.
    if (totalOutflow90 > 0) {
      const weekendOutflow = debits90Days.filter((t: any) => {
        const day = new Date(t.date).getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
        return day === 0 || day === 5 || day === 6;
      }).reduce((sum: number, t: any) => sum + Number(t.amount), 0);

      if ((weekendOutflow / totalOutflow90) >= 0.60) {
        traits.add('weekend_impulse_spender');
      }
    }

    // 4. salary_burner: Spent > 50% of salary within 7 days of credit.
    // Check if any salary burn candidate is present
    const hasSalaryBurn = candidateInsights.some(ins => ins.insight_key.startsWith('salary_burn:'));
    if (hasSalaryBurn) traits.add('salary_burner');

    // 5. frugal_saver: Total savings >= 40% of income.
    // Note: totalIncome90 is calculated later in wellness metrics section

    // 6. high_p2p_transferer: Outgoing P2P transfers >= 40% of total outflows.
    if (totalOutflow90 > 0) {
      const p2pOutflow = debits90Days
        .filter((t: any) => t.categories?.name === 'Transfer')
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

      if ((p2pOutflow / totalOutflow90) >= 0.40) {
        traits.add('high_p2p_transferer');
      }
    }

    // Save behavioral profile
    const traitsArray = Array.from(traits);
    console.log(`User Traits resolved: ${JSON.stringify(traitsArray)}`);

    // ----------------------------------------------------
    // Wellness Metrics Calculation
    // ----------------------------------------------------
    console.log('Calculating financial wellness metrics...');

    // Calculate total income for wellness metrics and traits
    const totalIncome90 = txs.filter((t: any) => t.type === 'credit').reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    // 5. frugal_saver: Total savings >= 40% of income.
    if (totalIncome90 > 0) {
      const savingsRatio = (totalIncome90 - totalOutflow90) / totalIncome90;
      if (savingsRatio >= 0.40) traits.add('frugal_saver');
    }

    // 1. Spending Stability: Starts at 100, penalized by category drifts and transaction anomalies
    let spendingStability = 100;
    const categoryDriftCount = candidateInsights.filter(ins => ins.insight_key.startsWith('category_drift:')).length;
    const anomalyCount = candidateInsights.filter(ins => ins.type === 'anomaly').length;
    spendingStability -= (categoryDriftCount * 10) + (anomalyCount * 5);
    spendingStability = Math.max(0, Math.min(100, spendingStability));

    // 2. Savings Consistency: Savings ratio ((credits - debits) / credits) scaled between 0 and 100
    let savingsConsistency = 0;
    if (totalIncome90 > 0) {
      const savingsRatio = (totalIncome90 - totalOutflow90) / totalIncome90;
      savingsConsistency = Math.max(0, Math.min(100, savingsRatio * 100));
    }

    // 3. Impulse Pacing: Penalized by late-night transactions and weekend impulse tags
    let impulsePacing = 100;
    const lateNightTxCount = debits90Days.filter((t: any) => {
      const hour = new Date(t.date).getHours();
      return hour >= 23 || hour < 5;
    }).length;
    impulsePacing -= lateNightTxCount * 2;

    const weekendImpulseCount = debits90Days.filter((t: any) => {
      const day = new Date(t.date).getDay();
      return (day === 0 || day === 5 || day === 6) && t.categories?.name === 'Food';
    }).length;
    impulsePacing -= weekendImpulseCount * 3;
    impulsePacing = Math.max(0, Math.min(100, impulsePacing));

    // 4. Subscription Buffer: Penalized by the ratio of monthly recurring outflows to total outflows
    let subscriptionBuffer = 100;
    const recurringInsights = candidateInsights.filter(ins => ins.insight_key.startsWith('recurring:'));
    const totalRecurringAmount = recurringInsights.reduce((sum, ins) => sum + (ins.metrics?.averageAmount || 0), 0);
    if (totalOutflow90 > 0) {
      const subscriptionRatio = totalRecurringAmount / totalOutflow90;
      subscriptionBuffer -= subscriptionRatio * 100;
    }
    subscriptionBuffer = Math.max(0, Math.min(100, subscriptionBuffer));

    // Calculate financial_wellness_score as the average of the four metrics
    const financialWellnessScore = (spendingStability + savingsConsistency + impulsePacing + subscriptionBuffer) / 4;

    // Compute salary velocity score (100 is stable, drops if burning salary fast)
    let velocityScore = 100;
    if (traits.has('salary_burner')) velocityScore = 50;

    // Prepare wellness metrics object
    const wellnessMetrics = {
      spending_stability: Number(spendingStability.toFixed(2)),
      savings_consistency: Number(savingsConsistency.toFixed(2)),
      impulse_pacing: Number(impulsePacing.toFixed(2)),
      subscription_buffer: Number(subscriptionBuffer.toFixed(2)),
      calculated_at: new Date().toISOString()
    };

    // Upsert into behavioral_profiles table
    const { data: profile } = await supabase
      .from('behavioral_profiles')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (profile && profile.length > 0) {
      await supabase
        .from('behavioral_profiles')
        .update({
          behavioral_traits: traitsArray,
          financial_wellness_score: Number(financialWellnessScore.toFixed(2)),
          wellness_metrics: wellnessMetrics,
          salary_velocity_score: velocityScore,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile[0].id);
    } else {
      await supabase
        .from('behavioral_profiles')
        .insert({
          user_id: userId,
          behavioral_traits: traitsArray,
          financial_wellness_score: Number(financialWellnessScore.toFixed(2)),
          wellness_metrics: wellnessMetrics,
          salary_velocity_score: velocityScore,
        });
    }

    // ----------------------------------------------------
    // Telemetry Upsert (Daily Rollup)
    // ----------------------------------------------------
    console.log('Upserting telemetry metrics...');
    const todayDate = new Date().toISOString().split('T')[0];

    // Upsert classification accuracy (mock value for now, could be calculated from user feedback)
    await supabase
      .from('intelligence_telemetry')
      .upsert({
        metric_date: todayDate,
        metric_name: 'classification_accuracy',
        metric_value: 85.00, // Placeholder - should be calculated from user feedback
        metadata: { user_id: userId },
      }, {
        onConflict: 'metric_date,metric_name'
      });

    // Upsert AI fallback rate (mock value for now)
    await supabase
      .from('intelligence_telemetry')
      .upsert({
        metric_date: todayDate,
        metric_name: 'ai_fallback_rate',
        metric_value: 15.00, // Placeholder - should track actual fallbacks
        metadata: { user_id: userId },
      }, {
        onConflict: 'metric_date,metric_name'
      });

    // Upsert active corrections count (mock value for now)
    await supabase
      .from('intelligence_telemetry')
      .upsert({
        metric_date: todayDate,
        metric_name: 'active_corrections',
        metric_value: 0, // Placeholder - should track user corrections
        metadata: { user_id: userId },
      }, {
        onConflict: 'metric_date,metric_name'
      });

    // Upsert wellness metrics to telemetry
    await supabase
      .from('intelligence_telemetry')
      .upsert({
        metric_date: todayDate,
        metric_name: 'spending_stability',
        metric_value: spendingStability,
        metadata: { user_id: userId },
      }, {
        onConflict: 'metric_date,metric_name'
      });

    await supabase
      .from('intelligence_telemetry')
      .upsert({
        metric_date: todayDate,
        metric_name: 'savings_consistency',
        metric_value: savingsConsistency,
        metadata: { user_id: userId },
      }, {
        onConflict: 'metric_date,metric_name'
      });

    await supabase
      .from('intelligence_telemetry')
      .upsert({
        metric_date: todayDate,
        metric_name: 'impulse_pacing',
        metric_value: impulsePacing,
        metadata: { user_id: userId },
      }, {
        onConflict: 'metric_date,metric_name'
      });

    await supabase
      .from('intelligence_telemetry')
      .upsert({
        metric_date: todayDate,
        metric_name: 'subscription_buffer',
        metric_value: subscriptionBuffer,
        metadata: { user_id: userId },
      }, {
        onConflict: 'metric_date,metric_name'
      });

    console.log('🎉 Insights and personality profiles successfully updated!');
  } catch (err) {
    console.error('[generateBehavioralInsights] Failure:', err);
  }
}
