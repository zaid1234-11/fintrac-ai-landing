-- Migration 00014: Fix historical_budgets RLS policies
-- Replaces the broken auth.uid()-based policy in 00013 with the correct
-- public.clerk_user_id() pattern used consistently across all other tables.
--
-- Root cause: auth.uid() returns NULL for Clerk-authenticated users because
-- Clerk uses a custom JWT and never populates Supabase's native auth.users table.
-- The correct approach is public.clerk_user_id() which reads the 'sub' claim
-- directly from the incoming Clerk bearer token.

-- ============================================================
-- Step 1: Drop the broken combined policy from 00013
-- ============================================================

DROP POLICY IF EXISTS "Users can manage own historical budgets"
    ON public.historical_budgets;

-- ============================================================
-- Step 2: Ensure RLS is enabled (idempotent)
-- ============================================================

ALTER TABLE public.historical_budgets ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Step 3: Create granular, correct policies
-- ============================================================

CREATE POLICY "Users can view own historical budgets"
    ON public.historical_budgets
    FOR SELECT
    USING (
        public.clerk_user_id() = user_id
    );

CREATE POLICY "Users can insert own historical budgets"
    ON public.historical_budgets
    FOR INSERT
    WITH CHECK (
        public.clerk_user_id() = user_id
    );

CREATE POLICY "Users can update own historical budgets"
    ON public.historical_budgets
    FOR UPDATE
    USING (
        public.clerk_user_id() = user_id
    );

CREATE POLICY "Users can delete own historical budgets"
    ON public.historical_budgets
    FOR DELETE
    USING (
        public.clerk_user_id() = user_id
    );

-- ============================================================
-- Verification queries (run manually after applying migration)
-- ============================================================

-- 1. Confirm RLS is enabled on the table:
--    SELECT relname, relrowsecurity
--    FROM pg_class
--    WHERE relname = 'historical_budgets';
--    Expected: relrowsecurity = true

-- 2. Confirm the Clerk helper function resolves correctly
--    (must be run within an authenticated request context):
--    SELECT public.clerk_user_id();
--    Expected: 'user_2J4nXyz...' (your Clerk user ID)
--    If this returns NULL, the Clerk JWT is not being forwarded correctly.

-- 3. Confirm no orphaned rows (FK consistency check):
--    SELECT COUNT(*)
--    FROM public.historical_budgets hb
--    LEFT JOIN public.users u ON hb.user_id = u.id
--    WHERE u.id IS NULL;
--    Expected: 0
--    Any non-zero result means historical_budgets rows reference a user_id
--    that does not exist in public.users.
