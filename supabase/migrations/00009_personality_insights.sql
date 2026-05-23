-- Migration 00009: Personality Heuristics and Insight Metadata

-- 1. Create behavioral_profiles table
CREATE TABLE IF NOT EXISTS public.behavioral_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    behavioral_traits TEXT[] DEFAULT '{}',
    financial_wellness_score INT DEFAULT 100,
    salary_velocity_score INT DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add columns to ai_insights table for metadata & cooldown tracking
ALTER TABLE public.ai_insights 
    ADD COLUMN IF NOT EXISTS insight_key VARCHAR(150),
    ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'medium',
    ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2) DEFAULT 1.00,
    ADD COLUMN IF NOT EXISTS relevance_score DECIMAL(3,2) DEFAULT 0.50;

-- 3. Set up RLS (Row Level Security) for behavioral_profiles
ALTER TABLE public.behavioral_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own behavioral profile" ON public.behavioral_profiles;
CREATE POLICY "Users can manage own behavioral profile"
    ON public.behavioral_profiles FOR ALL
    USING (public.clerk_user_id() = user_id);

-- 4. Add handle_updated_at trigger for behavioral_profiles
DROP TRIGGER IF EXISTS set_updated_at_behavioral_profiles ON public.behavioral_profiles;
CREATE TRIGGER set_updated_at_behavioral_profiles
    BEFORE UPDATE ON public.behavioral_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
