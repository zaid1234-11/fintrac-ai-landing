-- Migration 00001: Initial Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom Enums
CREATE TYPE transaction_type AS ENUM ('credit', 'debit');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'reversed');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE insight_type AS ENUM ('monthly_summary', 'behavior_analysis', 'anomaly', 'recommendation', 'financial_score');
CREATE TYPE statement_status AS ENUM ('processing', 'completed', 'failed');

-- 1. Users Table
CREATE TABLE public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone_number TEXT,
    currency VARCHAR(3) DEFAULT 'INR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Subscriptions Table
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tier subscription_tier DEFAULT 'free',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT DEFAULT 'active',
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Categories Table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE, -- Null means global/system category
    name TEXT NOT NULL,
    type transaction_type NOT NULL,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Transactions Table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    type transaction_type NOT NULL,
    status transaction_status DEFAULT 'completed',
    merchant_name TEXT,
    upi_id TEXT, -- Flexible for UPI, email, or account reference
    description TEXT,
    date TIMESTAMPTZ NOT NULL,
    
    -- AI & Fraud data
    ai_confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
    is_fraud_flagged BOOLEAN DEFAULT FALSE,
    risk_level risk_level DEFAULT 'low',
    
    -- Original sources
    raw_parsed_data JSONB,
    source VARCHAR(50) DEFAULT 'manual', -- 'sms', 'statement', 'api', 'manual'
    source_id UUID, -- References either sms_logs.id or bank_statements.id
    
    -- Blockchain Integration
    blockchain_hash TEXT UNIQUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Bank Statements Table
CREATE TABLE public.bank_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    account_number_last_4 VARCHAR(4),
    statement_period_start DATE,
    statement_period_end DATE,
    file_url TEXT NOT NULL, -- Points to Supabase Storage
    status statement_status DEFAULT 'processing',
    extracted_transactions_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SMS Logs Table
CREATE TABLE public.sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    raw_message TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL,
    parsed_successfully BOOLEAN DEFAULT FALSE,
    associated_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AI Insights Table
CREATE TABLE public.ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type insight_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    metrics JSONB, -- For charts/graphs (e.g., {"score": 85, "top_category": "food"})
    is_read BOOLEAN DEFAULT FALSE,
    insight_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Blockchain Records Table
CREATE TABLE public.blockchain_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    previous_hash TEXT NOT NULL,
    current_hash TEXT NOT NULL UNIQUE,
    timestamp_proof TIMESTAMPTZ NOT NULL,
    network VARCHAR(50) DEFAULT 'internal', -- 'internal', 'ethereum', 'polygon'
    on_chain_tx_id TEXT, -- Future L1/L2 integration
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Audit Logs Table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_data JSONB,
    new_data JSONB,
    changed_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Uploaded Files Table
CREATE TABLE public.uploaded_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    bucket_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size_bytes BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
