-- Migration 00013: Reinforcement Learning Friction Updates & Historical Budgets

-- 1. Historical Budgets Table
CREATE TABLE IF NOT EXISTS public.historical_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    month_date DATE NOT NULL, -- e.g., '2026-05-01' representing the recommended budget for May 2026
    budget_limit DECIMAL(12, 2) NOT NULL,
    suggested_cut DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category, month_date)
);

-- Enable RLS on historical_budgets
ALTER TABLE public.historical_budgets ENABLE ROW LEVEL SECURITY;

-- Select/Insert policies for users
CREATE POLICY "Users can manage own historical budgets"
    ON public.historical_budgets FOR ALL
    USING (user_id = auth.uid() OR user_id = (SELECT id FROM public.users WHERE id = auth.uid()));

-- 2. Behavioral Profile Additions
ALTER TABLE public.behavioral_profiles
    ADD COLUMN IF NOT EXISTS friction_scores JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS failure_streaks JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS compliance_streaks JSONB DEFAULT '{}'::jsonb;
