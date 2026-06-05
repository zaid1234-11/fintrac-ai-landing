/**
 * AI Behavioral Finance Coaching Engine
 * 
 * Generates personalized, non-judgmental, and supportive financial insights
 * based on category spending levels, friction scores, and optimization cuts.
 */

import { Recommendation, OptimizationResult } from './elasticSavingsEngine';

export interface CoachingInput {
  spendingCategories: Record<string, number>;
  frictionScores: Record<string, number>;
  savingsGoal: number;
  optimizationResults: OptimizationResult;
}

export interface CoachingFeedback {
  personalizedExplanation: string;
  selectedAnalysis: string;
  protectedAnalysis: string;
  behavioralInsights: string;
  actionPlan: string[];
}

/**
 * Generates coaching feedback dynamically based on the optimization result and friction scores.
 */
export function generateCoachingFeedback(input: CoachingInput): CoachingFeedback {
  const { frictionScores, savingsGoal, optimizationResults } = input;
  const recs = optimizationResults.recommendations;

  // Sort categories by reduction amount descending (most targeted)
  const cuts = [...recs].sort((a, b) => b.suggestedReduction - a.suggestedReduction);
  const majorCuts = cuts.filter(c => c.suggestedReduction > 0.05 * savingsGoal);

  // Sort categories by friction score descending (most protected)
  const protectedCats = Object.keys(frictionScores)
    .map(name => ({ name, friction: frictionScores[name] }))
    .sort((a, b) => b.friction - a.friction);

  // 1. Personalized Explanation
  const topCut = cuts[0];
  const personalizedExplanation = `Hello! We've analyzed your monthly outlays and designed a custom roadmap to reach your savings target of ₹${savingsGoal.toLocaleString('en-IN')}. Instead of asking you to cut back equally across the board, our model identifies areas of flexible habituation. You'll notice that the heaviest adjustment is placed on ${topCut.category}, where we suggest a reduction of ₹${topCut.suggestedReduction.toLocaleString('en-IN')}. This allows us to keep your most consistent necessities intact, minimizing lifestyle friction.`;

  // 2. Why specific categories were selected
  const selectedList = majorCuts.map(c => {
    const f = frictionScores[c.category] || 0.5;
    let detail = '';
    if (f < 0.4) {
      detail = 'indicates highly elastic, discretionary choices (low behavioral friction)';
    } else {
      detail = 'suggests moderate spending elasticity';
    }
    return `• **${c.category}** (Reduced by ₹${c.suggestedReduction.toLocaleString('en-IN')}): Your spending pattern here ${detail}. Because these purchases are more spontaneous, adjusting them will have a low impact on your day-to-day stability.`;
  });
  const selectedAnalysis = `Based on our calculations, the following categories were selected to absorb the majority of your savings target:\n\n${selectedList.join('\n')}`;

  // 3. Why other categories were protected
  const protectedList = protectedCats.slice(0, 2).map(pc => {
    const rec = recs.find(r => r.category === pc.name);
    const cutAmt = rec ? rec.suggestedReduction : 0;
    const f = pc.friction;
    
    let reason = '';
    if (f >= 0.7) {
      reason = 'represents a rigid utility or highly consistent necessity';
    } else {
      reason = 'shows strong habit integration and structural persistence';
    }
    
    return `• **${pc.name}** (Friction: ${f.toFixed(2)}, Cut: ₹${cutAmt.toLocaleString('en-IN')}): This category ${reason}. We intentionally minimized reductions here to prevent you from experiencing immediate budgeting fatigue.`;
  });
  const protectedAnalysis = `To preserve your peace of mind, we have shielded your highest-friction categories:\n\n${protectedList.join('\n')}`;

  // 4. Behavioral Finance Insights
  const behavioralInsights = `In behavioral economics, "loss aversion" makes cutting back on deep-seated habits feel painful. By analyzing the Coefficient of Variation (CV) of your expenditures, we distinguish between structural habits (low CV, high friction) and volatile impulses (high CV, low friction). Protecting your structural habits ensures your budgeting plan is sustainable over the long term, preventing the common "yo-yo" spending cycle.`;

  // 5. Action Plan
  const actionPlan: string[] = [];
  majorCuts.slice(0, 2).forEach(c => {
    if (c.category === 'Shopping') {
      actionPlan.push('Implement a "48-hour cooling-off rule" before finalizing any non-essential Shopping carts online.');
    } else if (c.category === 'Dining Out' || c.category === 'Food') {
      actionPlan.push('Limit restaurant dining to weekend social events, relying on pre-planned meal prep during high-velocity workdays.');
    } else if (c.category === 'Entertainment') {
      actionPlan.push('Audit active streaming subscriptions and pause platforms you have not engaged with in the last 14 days.');
    } else {
      actionPlan.push(`Create a weekly spending cap of ₹${(c.currentSpend - c.suggestedReduction).toLocaleString('en-IN')} for ${c.category}.`);
    }
  });
  actionPlan.push(`Track your live progress using the Ingest telemetry dashboards to stay updated in realtime.`);

  return {
    personalizedExplanation,
    selectedAnalysis,
    protectedAnalysis,
    behavioralInsights,
    actionPlan
  };
}
