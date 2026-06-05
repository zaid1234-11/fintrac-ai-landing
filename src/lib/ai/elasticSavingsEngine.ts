/**
 * Elastic Savings Engine
 * 
 * Distributes a target savings reduction across multiple spending categories
 * inversely proportional to their behavioral friction scores. High-friction categories
 * are protected, while low-friction categories absorb the cuts.
 */

export interface CategorySpend {
  name: string;
  monthlySpend: number;
  frictionScore: number; // Value between 0.0 and 1.0
}

export interface OptimizationInput {
  targetSavings: number;
  categories: CategorySpend[];
}

export interface Recommendation {
  category: string;
  currentSpend: number;
  suggestedReduction: number;
  newBudget: number;
}

export interface OptimizationResult {
  recommendations: Recommendation[];
  behavioralCost: number;
  totalSavings: number;
}

/**
 * Optimizes the savings cuts across categories using an iterative allocation algorithm.
 * This guarantees that total cuts equal the target savings without cutting any category
 * beyond its current spend.
 * 
 * @param input Target savings and category attributes
 * @returns Recommendations, behavioral cost, and total savings achieved
 */
export function optimizeSavings(input: OptimizationInput): OptimizationResult {
  const { targetSavings, categories } = input;

  if (targetSavings <= 0 || !categories || categories.length === 0) {
    return {
      recommendations: categories.map(c => ({
        category: c.name,
        currentSpend: c.monthlySpend,
        suggestedReduction: 0,
        newBudget: c.monthlySpend,
      })),
      behavioralCost: 0,
      totalSavings: 0,
    };
  }

  // Filter out categories with zero spending or negative parameters
  const validCategories = categories.map(c => ({
    name: c.name,
    monthlySpend: Math.max(0, c.monthlySpend),
    frictionScore: Math.max(0, Math.min(1, c.frictionScore)),
  }));

  const totalSpendable = validCategories.reduce((sum, c) => sum + c.monthlySpend, 0);

  // Edge case: Target savings exceed total spending. Cap cuts at total spend.
  const actualTargetSavings = Math.min(targetSavings, totalSpendable);

  // Initialize cuts mapping
  const cuts: Record<string, number> = {};
  validCategories.forEach(c => {
    cuts[c.name] = 0;
  });

  let remainingSavingsToCut = actualTargetSavings;
  let iterations = 0;
  const maxIterations = 100; // Safeguard loop limit

  // Iterative water-filling distribution
  while (remainingSavingsToCut > 0.001 && iterations < maxIterations) {
    iterations++;

    // Identify active categories (categories with positive spending and space left to cut)
    const activeCats = validCategories.filter(c => c.monthlySpend - cuts[c.name] > 0.001);

    if (activeCats.length === 0) break;

    // Calculate (1 - FrictionScore) for all active categories
    const cutWeights = activeCats.map(c => ({
      name: c.name,
      weight: 1.0 - c.frictionScore,
    }));

    const totalWeight = cutWeights.reduce((sum, w) => sum + w.weight, 0);

    let distributions: { name: string; amount: number }[] = [];

    if (totalWeight > 0.0001) {
      // Proportional to (1 - FrictionScore)
      distributions = cutWeights.map(cw => ({
        name: cw.name,
        amount: remainingSavingsToCut * (cw.weight / totalWeight),
      }));
    } else {
      // If all active categories have friction score = 1.0 (weight = 0),
      // allocate cuts equally among remaining active categories.
      const equalShare = remainingSavingsToCut / activeCats.length;
      distributions = activeCats.map(c => ({
        name: c.name,
        amount: equalShare,
      }));
    }

    let allocatedInThisStep = 0;

    // Apply distributions, capping at remaining spend per category
    distributions.forEach(dist => {
      const cat = validCategories.find(c => c.name === dist.name)!;
      const currentCut = cuts[dist.name];
      const maxAllowedCut = cat.monthlySpend;
      const spaceLeft = maxAllowedCut - currentCut;

      const additionalCut = Math.min(dist.amount, spaceLeft);
      cuts[dist.name] = Number((currentCut + additionalCut).toFixed(4));
      allocatedInThisStep += additionalCut;
    });

    remainingSavingsToCut -= allocatedInThisStep;

    // Safety: If no progress was made in this step, break to avoid infinite loop
    if (allocatedInThisStep < 0.001) break;
  }

  // Calculate final recommendations and behavioral cost
  let behavioralCost = 0;
  const recommendations: Recommendation[] = categories.map(c => {
    const cleanSpend = Math.max(0, c.monthlySpend);
    const reduction = cuts[c.name] || 0;
    
    // Cap new budget at exactly 0 if it rounds to very small negative due to floating math
    const newBudget = Number(Math.max(0, cleanSpend - reduction).toFixed(2));
    
    // Add to behavioral cost: sum(suggestedReduction * frictionScore)
    behavioralCost += reduction * Math.max(0, Math.min(1, c.frictionScore));

    return {
      category: c.name,
      currentSpend: cleanSpend,
      suggestedReduction: Number(reduction.toFixed(2)),
      newBudget,
    };
  });

  const totalSavings = recommendations.reduce((sum, r) => sum + r.suggestedReduction, 0);

  return {
    recommendations,
    behavioralCost: Number(behavioralCost.toFixed(4)),
    totalSavings: Number(totalSavings.toFixed(2)),
  };
}
