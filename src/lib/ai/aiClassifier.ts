/**
 * AI Fallback Classifier using OpenRouter to analyze ambiguous transactions.
 */
export async function classifyTransactionWithAI(
  rawDescription: string,
  cleanedDescription: string,
  amount: number,
  type: 'credit' | 'debit'
): Promise<{ normalized_merchant: string; category: string; confidence_score: number; reasoning: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return {
      normalized_merchant: cleanedDescription || 'Unknown',
      category: 'Other',
      confidence_score: 0.5,
      reasoning: 'AI offline: OPENROUTER_API_KEY missing',
    };
  }

  const systemPrompt = `You are a high-performance banking classification engine.
Your task is to analyze an Indian banking or UPI transaction and classify it into exactly ONE category.

Available categories:
"Food", "Travel", "Shopping", "Groceries", "Bills", "Recharge", "Entertainment", "Health", "Fuel", "Education", "Rent", "Salary", "Investment", "Transfer", "Other"

You must respond in strict JSON format:
{
  "normalized_merchant": "Cleaned brand name in uppercase (e.g. SWIGGY) or person name in Title Case",
  "category": "Exactly one category from the list above",
  "confidence_score": 0.00 to 1.00,
  "reasoning": "Short 1-sentence behavioral explanation"
}`;

  const userPrompt = `Classify this transaction:
Raw Text: "${rawDescription}"
Cleaned Text: "${cleanedDescription}"
Amount: INR ${amount}
Type: ${type.toUpperCase()}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://fintrac-ai-landing.vercel.app',
        'X-OpenRouter-Title': 'FinTrac AI Ingestion Classifier',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenRouter classification request failed');
    }

    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response content from OpenRouter');
    }

    const result = JSON.parse(content);
    return {
      normalized_merchant: result.normalized_merchant || cleanedDescription,
      category: result.category || 'Other',
      confidence_score: result.confidence_score || 0.6,
      reasoning: result.reasoning || 'AI classified',
    };
  } catch (error: any) {
    console.error('[classifyTransactionWithAI] AI Fallback Error:', error);
    return {
      normalized_merchant: cleanedDescription || 'Unknown',
      category: 'Other',
      confidence_score: 0.4,
      reasoning: `AI Error: ${error.message || 'Unknown error'}`,
    };
  }
}
