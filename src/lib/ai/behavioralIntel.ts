import { createAdminClient } from '../supabase/admin';

/**
 * Runs deep behavioral heuristics over a user's transaction history to detect
 * patterns, subscription recurrence, anomalies, and monthly summaries.
 * Automatically persists up to 3 insights in the database.
 */
export async function generateBehavioralInsights(
  supabase: any,
  userId: string
): Promise<void> {
  try {
    // 1. Fetch transactions for the user from the last 60 days
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { data: txs, error } = await supabase
      .from('transactions')
      .select('amount, type, category_id, date, merchant_name, categories(name)')
      .eq('user_id', userId)
      .gte('date', sixtyDaysAgo.toISOString())
      .order('date', { ascending: false });

    if (error || !txs || txs.length === 0) return;

    const insights: Array<{
      type: 'monthly_summary' | 'behavior_analysis' | 'anomaly' | 'recommendation' | 'financial_score';
      title: string;
      description: string;
      metrics: Record<string, any>;
    }> = [];

    // Separate into this month (last 30 days) and last month (31-60 days ago)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const thisMonthTxs = txs.filter((t: any) => new Date(t.date) >= thirtyDaysAgo);
    const lastMonthTxs = txs.filter((t: any) => new Date(t.date) < thirtyDaysAgo);

    // Heuristic 1: Late-night spending (debits between 11 PM and 5 AM)
    const lateNightTxs = thisMonthTxs.filter((t: any) => {
      if (t.type !== 'debit') return false;
      const hour = new Date(t.date).getHours();
      return hour >= 23 || hour < 5;
    });

    if (lateNightTxs.length >= 3) {
      const totalAmount = lateNightTxs.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      insights.push({
        type: 'behavior_analysis',
        title: 'Late-Night Spending Spikes',
        description: `Late-night spending spikes observed. You made ${lateNightTxs.length} transactions between 11 PM and 5 AM this month, totaling ₹${totalAmount.toFixed(2)}.`,
        metrics: { count: lateNightTxs.length, total: totalAmount },
      });
    }

    // Heuristic 2: Food Spending Comparison
    const getFoodTotal = (list: any[]) =>
      list
        .filter((t: any) => t.categories?.name === 'Food' && t.type === 'debit')
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    const foodThisMonth = getFoodTotal(thisMonthTxs);
    const foodLastMonth = getFoodTotal(lastMonthTxs);

    if (foodThisMonth > 0 && foodLastMonth > 0) {
      const percentageIncrease = ((foodThisMonth - foodLastMonth) / foodLastMonth) * 100;
      if (percentageIncrease >= 15) {
        insights.push({
          type: 'anomaly',
          title: 'Food Spending Increase',
          description: `Food spending increased ${percentageIncrease.toFixed(0)}% this month. You spent ₹${foodThisMonth.toFixed(2)} compared to ₹${foodLastMonth.toFixed(2)} last month.`,
          metrics: { percentage: percentageIncrease, currentTotal: foodThisMonth, lastTotal: foodLastMonth },
        });
      }
    }

    // Heuristic 3: Subscription & Recurring Payments (same merchant, similar amount, >= 2 hits in 60 days)
    const debitTxs = txs.filter((t: any) => t.type === 'debit' && t.merchant_name && t.merchant_name !== 'Unknown');
    const merchantGroups: Record<string, any[]> = {};
    for (const t of debitTxs) {
      if (!merchantGroups[t.merchant_name]) {
        merchantGroups[t.merchant_name] = [];
      }
      merchantGroups[t.merchant_name].push(t);
    }

    for (const [merchant, list] of Object.entries(merchantGroups)) {
      if (list.length >= 2) {
        const amounts = list.map(t => Number(t.amount));
        const avgAmount = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
        const allSimilar = amounts.every(a => Math.abs(a - avgAmount) / avgAmount <= 0.1);

        if (allSimilar) {
          insights.push({
            type: 'recommendation',
            title: 'Recurring Payment Detected',
            description: `Recurring ${merchant} usage detected. We identified ${list.length} payments averaging ₹${avgAmount.toFixed(2)} over the last 60 days.`,
            metrics: { merchant, count: list.length, averageAmount: avgAmount },
          });
        }
      }
    }

    // Heuristic 4: High P2P Transfer Outflows
    const transferTotal = thisMonthTxs
      .filter((t: any) => t.categories?.name === 'Transfer' && t.type === 'debit')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    const totalOutflow = thisMonthTxs
      .filter((t: any) => t.type === 'debit')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    if (totalOutflow > 0 && (transferTotal / totalOutflow) >= 0.35) {
      insights.push({
        type: 'recommendation',
        title: 'High Transfer Outflows',
        description: `High peer-to-peer transfer activity this month. Outgoing transfers make up ${((transferTotal / totalOutflow) * 100).toFixed(0)}% (₹${transferTotal.toFixed(2)}) of your total spending.`,
        metrics: { ratio: transferTotal / totalOutflow, totalTransfers: transferTotal },
      });
    }

    // Heuristic 5: Salary Detection Summary
    const salaryCredits = thisMonthTxs.filter((t: any) => t.categories?.name === 'Salary' && t.type === 'credit');
    if (salaryCredits.length > 0) {
      const salarySum = salaryCredits.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      insights.push({
        type: 'monthly_summary',
        title: 'Salary Credit Recorded',
        description: `Salary or stipend credit of ₹${salarySum.toFixed(2)} was successfully recorded in your deposits this month.`,
        metrics: { salarySum },
      });
    }

    // Insert new insights in DB
    const todayStr = new Date().toISOString().split('T')[0];

    // Clear today's old generated insights to avoid duplicates
    await supabase
      .from('ai_insights')
      .delete()
      .eq('user_id', userId)
      .eq('insight_date', todayStr);

    for (const insight of insights.slice(0, 3)) { // Limit to max 3 insights
      await supabase.from('ai_insights').insert({
        user_id: userId,
        type: insight.type,
        title: insight.title,
        description: insight.description,
        metrics: insight.metrics,
        is_read: false,
        insight_date: todayStr,
      });
    }
  } catch (err) {
    console.error('[generateBehavioralInsights] Failure:', err);
  }
}
