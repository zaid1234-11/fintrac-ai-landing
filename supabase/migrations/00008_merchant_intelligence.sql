-- Migration 00008: Merchant Intelligence & Categorization History

-- 1. Create merchant_memory table (user-scoped custom merchant learning)
CREATE TABLE IF NOT EXISTS public.merchant_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    raw_pattern TEXT NOT NULL, -- raw merchant string (after cleaning but before canonical resolution)
    canonical_name TEXT NOT NULL, -- canonical merchant string
    category TEXT NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 1.00,
    usage_count INT DEFAULT 1,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, raw_pattern)
);

-- 2. Create merchant_registry table (global shared merchant registry)
CREATE TABLE IF NOT EXISTS public.merchant_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_pattern TEXT UNIQUE NOT NULL, -- raw merchant string
    canonical_name TEXT NOT NULL, -- canonical merchant string
    category TEXT NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 1.00,
    usage_count INT DEFAULT 1,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create transaction_classifications table (detailed logging and audit trails)
CREATE TABLE IF NOT EXISTS public.transaction_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE UNIQUE,
    raw_description TEXT NOT NULL,
    cleaned_description TEXT NOT NULL,
    resolved_merchant TEXT NOT NULL,
    category TEXT NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    classification_source VARCHAR(50) NOT NULL,
    rule_matched TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add classification columns to transactions table
ALTER TABLE public.transactions 
    ADD COLUMN IF NOT EXISTS classification_source VARCHAR(50) DEFAULT 'rules',
    ADD COLUMN IF NOT EXISTS normalized_merchant VARCHAR(255);

-- 5. Set up RLS (Row Level Security)
ALTER TABLE public.merchant_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_classifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for merchant_memory
DROP POLICY IF EXISTS "Users can manage own merchant memory" ON public.merchant_memory;
CREATE POLICY "Users can manage own merchant memory"
    ON public.merchant_memory FOR ALL
    USING (public.clerk_user_id() = user_id);

-- RLS Policies for merchant_registry
DROP POLICY IF EXISTS "Authenticated users can view global registry" ON public.merchant_registry;
CREATE POLICY "Authenticated users can view global registry"
    ON public.merchant_registry FOR SELECT
    USING (public.clerk_user_id() IS NOT NULL);

-- RLS Policies for transaction_classifications
DROP POLICY IF EXISTS "Users can view own transaction classifications" ON public.transaction_classifications;
CREATE POLICY "Users can view own transaction classifications"
    ON public.transaction_classifications FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.transactions t 
        WHERE t.id = transaction_classifications.transaction_id AND t.user_id = public.clerk_user_id()
    ));

-- 6. Add triggers to handle updated_at
DROP TRIGGER IF EXISTS set_updated_at_merchant_memory ON public.merchant_memory;
CREATE TRIGGER set_updated_at_merchant_memory
    BEFORE UPDATE ON public.merchant_memory
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_merchant_registry ON public.merchant_registry;
CREATE TRIGGER set_updated_at_merchant_registry
    BEFORE UPDATE ON public.merchant_registry
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
