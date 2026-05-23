-- Migration 00012: Sprint 4 - Trust, Explainability & Wellness

-- Create insight_explanations table
CREATE TABLE IF NOT EXISTS public.insight_explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_id UUID NOT NULL REFERENCES public.ai_insights(id) ON DELETE CASCADE,
    trigger_reason TEXT NOT NULL,
    source_transaction_ids UUID[] NOT NULL,
    recurrence_signals JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on insight_explanations
ALTER TABLE public.insight_explanations ENABLE ROW LEVEL SECURITY;

-- Create SELECT policy for insight_explanations (scoped to user_id via insight)
CREATE POLICY "Users can view explanations for their own insights"
    ON public.insight_explanations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.ai_insights
            WHERE ai_insights.id = insight_explanations.insight_id
            AND ai_insights.user_id = auth.uid()
        )
    );

-- Create INSERT policy for insight_explanations
CREATE POLICY "Users can insert explanations for their own insights"
    ON public.insight_explanations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ai_insights
            WHERE ai_insights.id = insight_explanations.insight_id
            AND ai_insights.user_id = auth.uid()
        )
    );

-- Create UPDATE policy for insight_explanations
CREATE POLICY "Users can update explanations for their own insights"
    ON public.insight_explanations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.ai_insights
            WHERE ai_insights.id = insight_explanations.insight_id
            AND ai_insights.user_id = auth.uid()
        )
    );

-- Create intelligence_telemetry table for daily rollup metrics
CREATE TABLE IF NOT EXISTS public.intelligence_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(5,2) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(metric_date, metric_name)
);

-- Enable RLS on intelligence_telemetry
ALTER TABLE public.intelligence_telemetry ENABLE ROW LEVEL SECURITY;

-- Create SELECT policy for intelligence_telemetry (authenticated users)
CREATE POLICY "Authenticated users can view telemetry"
    ON public.intelligence_telemetry
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Create INSERT policy for intelligence_telemetry (authenticated users)
CREATE POLICY "Authenticated users can insert telemetry"
    ON public.intelligence_telemetry
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Create UPDATE policy for intelligence_telemetry (authenticated users)
CREATE POLICY "Authenticated users can update telemetry"
    ON public.intelligence_telemetry
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Add wellness_metrics column to behavioral_profiles
ALTER TABLE public.behavioral_profiles
ADD COLUMN IF NOT EXISTS wellness_metrics JSONB DEFAULT '{}'::jsonb;

-- Create index on insight_explanations for faster lookups
CREATE INDEX IF NOT EXISTS idx_insight_explanations_insight_id 
    ON public.insight_explanations(insight_id);

-- Create index on intelligence_telemetry for date-based queries
CREATE INDEX IF NOT EXISTS idx_intelligence_telemetry_metric_date 
    ON public.intelligence_telemetry(metric_date DESC);

-- Create index on intelligence_telemetry for metric name queries
CREATE INDEX IF NOT EXISTS idx_intelligence_telemetry_metric_name 
    ON public.intelligence_telemetry(metric_name);

-- Add updated_at trigger for insight_explanations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_insight_explanations_updated_at 
    BEFORE UPDATE ON public.insight_explanations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intelligence_telemetry_updated_at 
    BEFORE UPDATE ON public.intelligence_telemetry
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
