import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('behavioral_profiles')
      .select('financial_wellness_score, behavioral_traits, wellness_metrics')
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      console.error('[behavioral-profile GET] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const profile = Array.isArray(data) && data.length > 0 ? data[0] : null;

    if (!profile) {
      // Return defaults instead of a 500 so the dashboard can render safely
      return NextResponse.json({
        financial_wellness_score: 0,
        behavioral_traits: null,
        wellness_metrics: null,
      });
    }

    const result = {
      financial_wellness_score: profile.financial_wellness_score ?? 0,
      behavioral_traits: profile.behavioral_traits ?? null,
      wellness_metrics: profile.wellness_metrics ?? null,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[behavioral-profile GET] Unexpected error:', error);
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
