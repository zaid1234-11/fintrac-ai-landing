import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function POST(req: Request) {
  try {
    // 1. Verify user is authenticated via Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate API Key
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('[OpenRouter Proxy] Missing OPENROUTER_API_KEY environment variable');
      return NextResponse.json(
        { error: 'OpenRouter API key is not configured on the server.' },
        { status: 500 }
      );
    }

    // 3. Forward request body to OpenRouter
    const body = await req.json();
    const { model, messages, temperature, response_format } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: "messages" must be an array.' },
        { status: 400 }
      );
    }

    console.log(`[OpenRouter Proxy] Forwarding request to model: ${model || 'default'}`);

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://fintrac-ai.vercel.app', // App URL reference for OpenRouter
        'X-OpenRouter-Title': 'FinTrac AI Ingestion',
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-4o-mini',
        messages,
        temperature: temperature ?? 0.3,
        response_format,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[OpenRouter Proxy] API error:', data);
      return NextResponse.json(
        { error: data.error?.message || 'OpenRouter API error' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message?.includes('Dynamic server usage') || error.digest === 'DYNAMIC_SERVER_USAGE') {
      throw error;
    }
    console.error('[OpenRouter Proxy] Unexpected exception:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
