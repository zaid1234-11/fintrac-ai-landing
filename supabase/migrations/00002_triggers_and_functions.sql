-- Migration 00002: Triggers and Functions

-- 1. Update `updated_at` timestamp function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_transactions
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_subscriptions
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Sync Auth Users to Public Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Auto-create free subscription
    INSERT INTO public.subscriptions (user_id, tier)
    VALUES (NEW.id, 'free');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Audit Logging for Transactions
CREATE OR REPLACE FUNCTION public.audit_transaction_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, new_data, changed_by)
        VALUES ('transactions', NEW.id, 'INSERT', row_to_json(NEW)::jsonb, NEW.user_id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
        VALUES ('transactions', NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, NEW.user_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, changed_by)
        VALUES ('transactions', OLD.id, 'DELETE', row_to_json(OLD)::jsonb, OLD.user_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_transactions
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.audit_transaction_changes();

-- 4. Simple Blockchain Hash Generation (Internal Ledger)
-- Creates a hash chain when a transaction is inserted
CREATE OR REPLACE FUNCTION public.generate_transaction_hash()
RETURNS TRIGGER AS $$
DECLARE
    prev_hash TEXT;
    new_hash TEXT;
BEGIN
    -- Get the last hash for the user's transactions
    SELECT current_hash INTO prev_hash 
    FROM public.blockchain_records 
    JOIN public.transactions t ON t.id = public.blockchain_records.transaction_id
    WHERE t.user_id = NEW.user_id 
    ORDER BY public.blockchain_records.created_at DESC 
    LIMIT 1;

    -- If no previous hash, use genesis block string
    IF prev_hash IS NULL THEN
        prev_hash := 'genesis_block_' || NEW.user_id;
    END IF;

    -- Generate new hash: SHA256 of prev_hash + transaction data
    new_hash := encode(digest(prev_hash || NEW.id::TEXT || NEW.amount::TEXT || NEW.date::TEXT, 'sha256'), 'hex');

    -- Insert into blockchain records
    INSERT INTO public.blockchain_records (transaction_id, previous_hash, current_hash, timestamp_proof)
    VALUES (NEW.id, prev_hash, new_hash, NOW());

    -- Update transaction with hash reference
    NEW.blockchain_hash := new_hash;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_transaction_hash
    BEFORE INSERT ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.generate_transaction_hash();
