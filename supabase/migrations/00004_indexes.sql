-- Migration 00004: Index Optimization for Fast Querying

-- 1. Transactions Optimization
-- Covering index for querying user transactions by date (common for dashboards)
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date DESC);

-- Index for filtering by transaction type (credit/debit)
CREATE INDEX idx_transactions_type ON public.transactions(user_id, type);

-- Partial index for querying flagged/high-risk transactions quickly
CREATE INDEX idx_transactions_fraud ON public.transactions(user_id) WHERE is_fraud_flagged = TRUE;

-- Unique index for UPI IDs to prevent duplicate inserts from SMS/Bank parsing
CREATE UNIQUE INDEX idx_transactions_upi_unique ON public.transactions(upi_id) WHERE upi_id IS NOT NULL;

-- GIN index on raw JSONB data for flexible querying
CREATE INDEX idx_transactions_raw_json ON public.transactions USING GIN (raw_parsed_data);

-- 2. Bank Statements Optimization
CREATE INDEX idx_bank_statements_user ON public.bank_statements(user_id, created_at DESC);

-- 3. SMS Logs Optimization
CREATE INDEX idx_sms_logs_user_date ON public.sms_logs(user_id, received_at DESC);

-- 4. AI Insights Optimization
CREATE INDEX idx_ai_insights_user_date ON public.ai_insights(user_id, insight_date DESC);
CREATE INDEX idx_ai_insights_unread ON public.ai_insights(user_id) WHERE is_read = FALSE;

-- 5. Blockchain Records Optimization
CREATE INDEX idx_blockchain_records_tx ON public.blockchain_records(transaction_id);
CREATE UNIQUE INDEX idx_blockchain_current_hash ON public.blockchain_records(current_hash);

-- 6. Audit Logs Optimization
CREATE INDEX idx_audit_logs_record ON public.audit_logs(record_id);
CREATE INDEX idx_audit_logs_changed_by ON public.audit_logs(changed_by, created_at DESC);
