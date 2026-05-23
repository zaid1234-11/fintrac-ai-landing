import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Fetch the latest telemetry logs for the user
    const { data: telemetry, error } = await supabase
      .from('intelligence_telemetry')
      .select('*')
      .eq('metadata->>user_id', userId)
      .order('metric_date', { ascending: false })
      .limit(30);

    if (error) {
      console.error('[Telemetry API] Error fetching telemetry:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by metric name and get the latest value for each
    const latestMetrics: Record<string, any> = {};
    telemetry?.forEach((metric: any) => {
      if (!latestMetrics[metric.metric_name] || new Date(metric.metric_date) > new Date(latestMetrics[metric.metric_name].metric_date)) {
        latestMetrics[metric.metric_name] = metric;
      }
    });

    return NextResponse.json({
      metrics: latestMetrics,
      history: telemetry || [],
    });
  } catch (error: any) {
    if (error.message?.includes('Dynamic server usage') || error.digest === 'DYNAMIC_SERVER_USAGE') {
      throw error;
    }
    console.error('[Telemetry API] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
