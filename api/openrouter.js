const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

function parseJson(value) {
  if (!value) return {};
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey?.trim()) {
    return res.status(500).json({ error: "OpenRouter API key is not configured." });
  }

  const payload = parseJson(req.body);
  const { model = "openai/gpt-4o-mini", messages, temperature = 0.7 } = payload;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Missing OpenRouter messages payload." });
  }

  try {
    const openrouterResponse = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey.trim()}`,
        "HTTP-Referer": "https://fintrac-ai-landing.vercel.app",
        "X-OpenRouter-Title": "FinTrac AI",
      },
      body: JSON.stringify({ model, messages, temperature }),
    });

    const responseText = await openrouterResponse.text();
    const data = parseJson(responseText);

    if (!openrouterResponse.ok) {
      let errMsg = data.error?.message || "OpenRouter API request failed.";
      if (typeof errMsg === "string") {
        if (apiKey) {
          const escapedKey = apiKey.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          errMsg = errMsg.replace(new RegExp(escapedKey, 'g'), '[REDACTED]');
        }
        errMsg = errMsg.replace(/sk-or-[a-zA-Z0-9]{20,}/g, '[REDACTED]');
      }
      return res.status(openrouterResponse.status).json({ error: errMsg });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected OpenRouter API error.",
    });
  }
}
