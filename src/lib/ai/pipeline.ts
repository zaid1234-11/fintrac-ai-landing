import { NormalizedTransaction } from '../parsers/types';

interface TransactionInput {
  index: number;
  merchant: string;
  amount: number;
  type: string;
  date: string;
  description?: string;
}

interface AnalyzedTransactionResult {
  index: number;
  merchant: string;
  category: 'Food' | 'Travel' | 'Bills' | 'Shopping' | 'Entertainment' | 'Salary' | 'Other';
  is_recurring: boolean;
  ai_confidence_score: number;
  description: string;
}

interface AIInsightResult {
  type: 'monthly_summary' | 'behavior_analysis' | 'anomaly' | 'recommendation' | 'financial_score';
  title: string;
  description: string;
  metrics: Record<string, any>;
}

export interface AIPipelineResponse {
  transactions: AnalyzedTransactionResult[];
  insights: AIInsightResult[];
}

/**
 * Batches transactions and sends them to OpenRouter for deep intelligence extraction
 */
export async function runAIPipeline(
  transactions: NormalizedTransaction[]
): Promise<AIPipelineResponse> {
  if (transactions.length === 0) {
    return { transactions: [], insights: [] };
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn('[AI Pipeline Warning] OPENROUTER_API_KEY is not defined. Falling back to local rule-based categorization.');
    return {
      transactions: transactions.map((t, idx) => ({
        index: idx,
        merchant: t.merchant,
        category: fallbackCategory(t.merchant),
        is_recurring: false,
        ai_confidence_score: 0.5,
        description: `Parsed transaction for ${t.merchant}`,
      })),
      insights: [
        {
          type: 'recommendation',
          title: 'AI Insights Offline',
          description: 'We are currently listing your transactions using rule-based categories. Standard insights will resume shortly.',
          metrics: { error: true },
        },
      ],
    };
  }

  // 1. Format input records for the LLM context to minimize tokens
  const formattedInputs: TransactionInput[] = transactions.map((t, idx) => ({
    index: idx,
    merchant: t.merchant,
    amount: t.amount,
    type: t.transaction_type,
    date: t.timestamp.toISOString().split('T')[0],
    description: t.raw_payload?.original_description || '',
  }));

  // 2. Formulate system guidelines and schema instructions
  const systemPrompt = `You are FinTrac AI, a fintech-grade financial advisor and database engine.
Your task is to analyze a batch of bank transactions and return structured metadata.

For each transaction, you must provide:
1. "merchant": The cleaned, real-world merchant name (e.g. convert "ZOMATO* 12948" to "Zomato").
2. "category": Choose exactly one: "Food", "Travel", "Bills", "Shopping", "Entertainment", "Salary", or "Other".
3. "is_recurring": Boolean representing if this transaction looks like a subscription, bill, or repeated weekly/monthly cost.
4. "ai_confidence_score": Decimal between 0.00 and 1.00 indicating categorization certainty.
5. "description": A short friendly summary of this transaction (e.g., "Food delivery from Zomato").

Additionally, look at the overall batch and generate 1-3 useful "insights". Insights can capture:
- "anomaly": Unusually large transaction, sudden spike in a category.
- "recommendation": Concrete advice on saving (e.g., "Cancel unused subscription", "Dining spending is high").
- "behavior_analysis": General trend observed in the transactions list.

Return your response in strict JSON format matching this schema:
{
  "transactions": [
    {
      "index": number,
      "merchant": string,
      "category": string,
      "is_recurring": boolean,
      "ai_confidence_score": number,
      "description": string
    }
  ],
  "insights": [
    {
      "type": "anomaly" | "recommendation" | "behavior_analysis" | "monthly_summary" | "financial_score",
      "title": string,
      "description": string,
      "metrics": object // arbitrary key-value pairs representing context values
    }
  ]
}`;

  const userPrompt = `Here is the batch of transactions to analyze:
${JSON.stringify(formattedInputs, null, 2)}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://fintrac-ai.vercel.app',
        'X-OpenRouter-Title': 'FinTrac AI Pipeline',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed calling OpenRouter API');
    }

    const rawContent = data.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error('Empty response content from OpenRouter');
    }

    const parsedResult = JSON.parse(rawContent) as AIPipelineResponse;
    return parsedResult;
  } catch (error) {
    console.error('[AI Pipeline Error]:', error);
    // Return structured default fallback to prevent pipeline crashes
    return {
      transactions: transactions.map((t, idx) => ({
        index: idx,
        merchant: t.merchant,
        category: fallbackCategory(t.merchant),
        is_recurring: false,
        ai_confidence_score: 0.5,
        description: `Parsed transaction for ${t.merchant}`,
      })),
      insights: [
        {
          type: 'recommendation',
          title: 'AI Insights Temporarily Offline',
          description: 'We are currently listing your transactions using rule-based categories. Standard insights will resume shortly.',
          metrics: { error: true },
        },
      ],
    };
  }
}

function fallbackCategory(merchant: string): 'Food' | 'Travel' | 'Bills' | 'Shopping' | 'Entertainment' | 'Salary' | 'Other' {
  const lower = merchant.toLowerCase();
  if (/(zomato|swiggy|food|eat|restaurant|cafe)/.test(lower)) return 'Food';
  if (/(uber|ola|cab|flight|airline|indigo|irctc|train)/.test(lower)) return 'Travel';
  if (/(bill|electric|water|recharge|jio|airtel|gas)/.test(lower)) return 'Bills';
  if (/(amazon|flipkart|myntra|ajio|shopping)/.test(lower)) return 'Shopping';
  if (/(netflix|prime|hotstar|spotify|pvr|cinema)/.test(lower)) return 'Entertainment';
  if (/(salary|payroll|deposit)/.test(lower)) return 'Salary';
  return 'Other';
}
