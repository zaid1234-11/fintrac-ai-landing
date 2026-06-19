-- Migration 00014: Ensure historical_budgets RLS is correct
-- This migration is a safety net. The policies were corrected directly in 00013.
-- On a fresh database, 00013 now creates the correct policies and this file
-- is a no-op. On an existing database that ran the old broken 00013, this
-- drops the broken policy and re-creates the correct ones.

-- Drop the broken combined policy if it somehow exists (old environments)
DROP POLICY IF EXISTS "Users can manage own historical budgets"
    ON public.historical_budgets;

-- Drop and re-create correct policies (idempotent)
DROP POLICY IF EXISTS "Users can view own historical budgets"
    ON public.historical_budgets;

DROP POLICY IF EXISTS "Users can insert own historical budgets"
    ON public.historical_budgets;

DROP POLICY IF EXISTS "Users can update own historical budgets"
    ON public.historical_budgets;

DROP POLICY IF EXISTS "Users can delete own historical budgets"
    ON public.historical_budgets;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.historical_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own historical budgets"
    ON public.historical_budgets
    FOR SELECT
    USING (public.clerk_user_id() = user_id);

CREATE POLICY "Users can insert own historical budgets"
    ON public.historical_budgets
    FOR INSERT
    WITH CHECK (public.clerk_user_id() = user_id);

CREATE POLICY "Users can update own historical budgets"
    ON public.historical_budgets
    FOR UPDATE
    USING (public.clerk_user_id() = user_id);

CREATE POLICY "Users can delete own historical budgets"
    ON public.historical_budgets
    FOR DELETE
    USING (public.clerk_user_id() = user_id);

-- ============================================================
-- Verification queries (run manually after applying migration)
-- ============================================================

-- 1. Confirm RLS is enabled:
--    SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'historical_budgets';
--    Expected: relrowsecurity = true

-- 2. Confirm Clerk helper resolves (in an authenticated request context):
--    SELECT public.clerk_user_id();
--    Expected: 'user_2J4nXyz...'

-- 3. Confirm no orphaned rows:
--    SELECT COUNT(*) FROM public.historical_budgets hb
--    LEFT JOIN public.users u ON hb.user_id = u.id
--    WHERE u.id IS NULL;
--    Expected: 0
