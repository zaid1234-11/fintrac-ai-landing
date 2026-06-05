/**
 * Behavioral Pain Estimator
 * 
 * Computes a "Pain Score" representing the user's psychological resistance
 * to a proposed budget reduction in a specific category.
 * 
 * Formula:
 * Pain = ReductionAmount * FrictionScore
 * 
 * Classification Tiers:
 * - Pain <= 1000: "Easy"
 * - 1000 < Pain <= 3000: "Moderate"
 * - 3000 < Pain <= 6000: "Difficult"
 * - Pain > 6000: "Extreme"
 */

export interface PainInput {
  category: string;
  reductionAmount: number;
  frictionScore: number; // Value between 0.0 and 1.0
}

export type PainLevel = 'Easy' | 'Moderate' | 'Difficult' | 'Extreme';

export interface PainResult {
  category: string;
  painScore: number;
  painLevel: PainLevel;
}

/**
 * Resolves the qualitative pain level based on the computed numeric pain score.
 */
export function resolvePainLevel(painScore: number): PainLevel {
  if (painScore <= 1000) {
    return 'Easy';
  } else if (painScore <= 3000) {
    return 'Moderate';
  } else if (painScore <= 6000) {
    return 'Difficult';
  } else {
    return 'Extreme';
  }
}

/**
 * Calculates behavioral pain scores for a single category or a batch of categories.
 * 
 * @param input Categorical reduction details
 * @returns Pain score metrics and classified levels
 */
export function estimateBehavioralPain(input: PainInput): PainResult {
  const amount = Math.max(0, input.reductionAmount);
  const friction = Math.max(0, Math.min(1, input.frictionScore));
  
  const painScore = Number((amount * friction).toFixed(4));
  const painLevel = resolvePainLevel(painScore);

  return {
    category: input.category,
    painScore,
    painLevel,
  };
}

/**
 * Estimates pain scores for a batch of category inputs.
 */
export function estimateBatchBehavioralPain(inputs: PainInput[]): PainResult[] {
  if (!inputs) return [];
  return inputs.map(estimateBehavioralPain);
}
