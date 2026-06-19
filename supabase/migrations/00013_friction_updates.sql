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

-- Granular RLS policies using public.clerk_user_id()
-- Note: auth.uid() cannot be used here because user_id is TEXT and auth.uid() returns UUID.
-- public.clerk_user_id() reads the 'sub' claim from the Clerk JWT and returns TEXT.
CREATE POLICY "Users can view own historical budgets"
    ON public.historical_budgets FOR SELECT
    USING (public.clerk_user_id() = user_id);

CREATE POLICY "Users can insert own historical budgets"
    ON public.historical_budgets FOR INSERT
    WITH CHECK (public.clerk_user_id() = user_id);

CREATE POLICY "Users can update own historical budgets"
    ON public.historical_budgets FOR UPDATE
    USING (public.clerk_user_id() = user_id);

CREATE POLICY "Users can delete own historical budgets"
    ON public.historical_budgets FOR DELETE
    USING (public.clerk_user_id() = user_id);

-- 2. Behavioral Profile Additions
ALTER TABLE public.behavioral_profiles
    ADD COLUMN IF NOT EXISTS friction_scores JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS failure_streaks JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS compliance_streaks JSONB DEFAULT '{}'::jsonb;
