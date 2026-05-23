-- Migration 00003: Row Level Security (RLS) Policies

-- Helper function to extract Clerk User ID from JWT
CREATE OR REPLACE FUNCTION public.clerk_user_id()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::text;
$$;

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

-- 1. Users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" 
    ON public.users FOR SELECT 
    USING (public.clerk_user_id() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" 
    ON public.users FOR UPDATE 
    USING (public.clerk_user_id() = id);

-- 2. Subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" 
    ON public.subscriptions FOR SELECT 
    USING (public.clerk_user_id() = user_id);

-- 3. Categories
DROP POLICY IF EXISTS "Users can view global and own categories" ON public.categories;
CREATE POLICY "Users can view global and own categories" 
    ON public.categories FOR SELECT 
    USING (user_id IS NULL OR public.clerk_user_id() = user_id);

DROP POLICY IF EXISTS "Users can manage own categories" ON public.categories;
CREATE POLICY "Users can manage own categories" 
    ON public.categories FOR ALL 
    USING (public.clerk_user_id() = user_id);

-- 4. Transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" 
    ON public.transactions FOR SELECT 
    USING (public.clerk_user_id() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions" 
    ON public.transactions FOR INSERT 
    WITH CHECK (public.clerk_user_id() = user_id);

DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
CREATE POLICY "Users can update own transactions" 
    ON public.transactions FOR UPDATE 
    USING (public.clerk_user_id() = user_id);

DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
CREATE POLICY "Users can delete own transactions" 
    ON public.transactions FOR DELETE 
    USING (public.clerk_user_id() = user_id);

-- 5. Bank Statements
DROP POLICY IF EXISTS "Users can view own bank statements" ON public.bank_statements;
CREATE POLICY "Users can view own bank statements" 
    ON public.bank_statements FOR SELECT 
    USING (public.clerk_user_id() = user_id);

DROP POLICY IF EXISTS "Users can insert own bank statements" ON public.bank_statements;
CREATE POLICY "Users can insert own bank statements" 
    ON public.bank_statements FOR INSERT 
    WITH CHECK (public.clerk_user_id() = user_id);

-- 6. SMS Logs
DROP POLICY IF EXISTS "Users can view own sms logs" ON public.sms_logs;
CREATE POLICY "Users can view own sms logs" 
    ON public.sms_logs FOR SELECT 
    USING (public.clerk_user_id() = user_id);

DROP POLICY IF EXISTS "Users can insert own sms logs" ON public.sms_logs;
CREATE POLICY "Users can insert own sms logs" 
    ON public.sms_logs FOR INSERT 
    WITH CHECK (public.clerk_user_id() = user_id);

-- 7. AI Insights
DROP POLICY IF EXISTS "Users can view own AI insights" ON public.ai_insights;
CREATE POLICY "Users can view own AI insights" 
    ON public.ai_insights FOR SELECT 
    USING (public.clerk_user_id() = user_id);

-- 8. Blockchain Records
DROP POLICY IF EXISTS "Users can view own blockchain records" ON public.blockchain_records;
CREATE POLICY "Users can view own blockchain records" 
    ON public.blockchain_records FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.transactions t 
        WHERE t.id = blockchain_records.transaction_id AND t.user_id = public.clerk_user_id()
    ));

-- 9. Audit Logs
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" 
    ON public.audit_logs FOR SELECT 
    USING (changed_by = public.clerk_user_id());

-- 10. Uploaded Files
DROP POLICY IF EXISTS "Users can view own uploaded files" ON public.uploaded_files;
CREATE POLICY "Users can view own uploaded files" 
    ON public.uploaded_files FOR SELECT 
    USING (public.clerk_user_id() = user_id);

DROP POLICY IF EXISTS "Users can insert own uploaded files" ON public.uploaded_files;
CREATE POLICY "Users can insert own uploaded files" 
    ON public.uploaded_files FOR INSERT 
    WITH CHECK (public.clerk_user_id() = user_id);
