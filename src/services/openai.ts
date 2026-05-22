const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

interface GenerateOpenAIContentOptions {
  model?: string;
  prompt: string;
  temperature?: number;
}

export async function generateOpenAIContent({
  model = "gpt-4o-mini",
  prompt,
  temperature = 0.7,
}: GenerateOpenAIContentOptions) {
  const messages = [{ role: "user", content: prompt }];

  if (import.meta.env.PROD) {
    const response = await fetch("/api/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, temperature }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "OpenAI API request failed.");
    }

    return data;
  }

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OpenAI API key missing. Add VITE_OPENAI_API_KEY to .env for local development.");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature }),
  });

  const data = await response.json();

  if (!response.ok) {
    let errMsg = data.error?.message || "OpenAI API request failed.";
    if (typeof errMsg === "string") {
      if (apiKey) {
        const escapedKey = apiKey.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        errMsg = errMsg.replace(new RegExp(escapedKey, 'g'), '[REDACTED]');
      }
      errMsg = errMsg.replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED]');
    }
    throw new Error(errMsg);
  }

  return data;
}
