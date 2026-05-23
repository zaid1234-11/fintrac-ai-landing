import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { generateBehavioralInsights } from '@/lib/ai/behavioralIntel';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    await generateBehavioralInsights(supabase, userId);

    return NextResponse.json({
      success: true,
      message: 'Financial wellness insights generated.',
    });
  } catch (error: any) {
    if (error.message?.includes('Dynamic server usage') || error.digest === 'DYNAMIC_SERVER_USAGE') {
      throw error;
    }

    console.error('[Insights Generate API] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Insight generation failed' },
      { status: 500 }
    );
  }
}
