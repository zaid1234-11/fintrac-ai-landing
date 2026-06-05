/**
 * Behavioral Friction Score Calculator
 * 
 * Friction is a quantitative representation of spending rigidity (resistance to budget cuts).
 * It is calculated as a weighted index of three components:
 * 1. Frequency (40%): How often the user transacts in this category. More frequent transacting implies habituation.
 * 2. Consistency (30%): Relates to standard deviation of amounts. Lower variation implies rigid/fixed outlays.
 * 3. Emotion (30%): Level of positive sentiment associated with transactions. Positive sentiment increases resistance to cuts.
 */

export interface Transaction {
  amount: number;
  date: string; // ISO format or date string
  sentimentScore: number; // Value between -1.0 (extremely negative) and 1.0 (extremely positive)
}

export interface CategoryInput {
  category: string;
  transactions: Transaction[];
}

export interface FrictionScoreResult {
  category: string;
  frictionScore: number;
  breakdown: {
    frequency: number;
    consistency: number;
    emotion: number;
  };
}

/**
 * Calculates standard deviation for a list of numbers.
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Computes the Friction Scores across a list of spending categories,
 * normalizing frequency and coefficient of variation relative to the cohort.
 * 
 * @param categories List of category transactions data
 * @returns List of category friction scores and breakdowns
 */
export function calculateFrictionScores(categories: CategoryInput[]): FrictionScoreResult[] {
  if (!categories || categories.length === 0) return [];

  // 1. Gather raw statistics per category
  const stats = categories.map(cat => {
    const txs = cat.transactions;
    const count = txs.length;
    const amounts = txs.map(t => t.amount);
    
    // Mean amount
    const meanAmount = count > 0 ? amounts.reduce((sum, val) => sum + val, 0) / count : 0;
    
    // Standard deviation
    const stdDev = calculateStandardDeviation(amounts);
    
    // Coefficient of Variation (CV) = StdDev / Mean (CV measures relative dispersion)
    // If mean is 0, relative variation is undefined; default CV to 0
    const cv = meanAmount > 0 ? stdDev / meanAmount : 0;

    // Average sentiment score (scale: -1.0 to 1.0)
    const avgSentiment = count > 0 
      ? txs.reduce((sum, t) => sum + t.sentimentScore, 0) / count 
      : 0;

    return {
      category: cat.category,
      count,
      cv,
      avgSentiment
    };
  });

  // 2. Find max bounds for normalization
  const maxCount = Math.max(...stats.map(s => s.count), 1);
  const maxCv = Math.max(...stats.map(s => s.cv), 0);

  // 3. Perform component normalization and calculate the composite index
  return stats.map(stat => {
    // Frequency component: higher count -> higher frequency score [0, 1]
    const frequency = stat.count / maxCount;

    // Consistency component: lower relative variation (CV) -> higher consistency score [0, 1]
    // A CV of 0 (e.g. rent) yields consistency of 1.0. If maxCv is 0, CV is identical, defaults to 1.0.
    const consistency = maxCv > 0 ? 1 - (stat.cv / maxCv) : 1.0;

    // Emotion component: map average sentiment from [-1.0, 1.0] to [0.0, 1.0]
    const emotion = Math.max(0, Math.min(1, (stat.avgSentiment + 1) / 2));

    // Weighted composite formula
    // FS = 0.4 * Frequency + 0.3 * Consistency + 0.3 * Emotion
    const rawFriction = (0.4 * frequency) + (0.3 * consistency) + (0.3 * emotion);
    const frictionScore = Math.max(0, Math.min(1, rawFriction));

    return {
      category: stat.category,
      frictionScore: Number(frictionScore.toFixed(4)),
      breakdown: {
        frequency: Number(frequency.toFixed(4)),
        consistency: Number(consistency.toFixed(4)),
        emotion: Number(emotion.toFixed(4))
      }
    };
  });
}
