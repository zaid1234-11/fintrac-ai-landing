const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface GenerateContentOptions {
  model?: string;
  prompt: string;
  temperature?: number;
}

export async function generateOpenRouterContent({
  model = "openai/gpt-4o-mini",
  prompt,
  temperature = 0.7,
}: GenerateContentOptions) {
  const messages = [{ role: "user", content: prompt }];

  if (process.env.NODE_ENV === "production") {
    const response = await fetch("/api/openrouter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, temperature }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "OpenRouter API request failed.");
    }

    return data;
  }

  const apiKey = (process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY)?.trim();

  if (!apiKey) {
    throw new Error("OpenRouter API key missing. Add NEXT_PUBLIC_OPENROUTER_API_KEY to .env.local for local development.");
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-OpenRouter-Title": "FinTrac AI Local Dev",
    },
    body: JSON.stringify({ model, messages, temperature }),
  });

  const data = await response.json();

  if (!response.ok) {
    let errMsg = data.error?.message || "OpenRouter API request failed.";
    if (typeof errMsg === "string") {
      if (apiKey) {
        const escapedKey = apiKey.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        errMsg = errMsg.replace(new RegExp(escapedKey, 'g'), '[REDACTED]');
      }
      errMsg = errMsg.replace(/sk-or-[a-zA-Z0-9]{20,}/g, '[REDACTED]');
    }
    throw new Error(errMsg);
  }

  return data;
}
