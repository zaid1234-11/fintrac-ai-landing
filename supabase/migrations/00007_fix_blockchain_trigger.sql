-- Migration 00007: Fix blockchain records foreign key constraint issue

-- 1. Drop existing trigger
DROP TRIGGER IF EXISTS create_transaction_hash ON public.transactions;

-- 2. Update hash generation function to only compute and store hash on the new row BEFORE insert
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

    -- Update transaction with hash reference
    NEW.blockchain_hash := new_hash;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-create the BEFORE INSERT trigger to compute the hash
CREATE TRIGGER create_transaction_hash
    BEFORE INSERT ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.generate_transaction_hash();

-- 4. Create function to insert into blockchain_records AFTER the transaction is inserted
CREATE OR REPLACE FUNCTION public.insert_blockchain_record()
RETURNS TRIGGER AS $$
DECLARE
    prev_hash TEXT;
BEGIN
    -- Fetch the previous hash for the record chain
    SELECT current_hash INTO prev_hash 
    FROM public.blockchain_records 
    JOIN public.transactions t ON t.id = public.blockchain_records.transaction_id
    WHERE t.user_id = NEW.user_id AND t.id != NEW.id
    ORDER BY public.blockchain_records.created_at DESC 
    LIMIT 1;

    IF prev_hash IS NULL THEN
        prev_hash := 'genesis_block_' || NEW.user_id;
    END IF;

    -- Insert into blockchain records
    INSERT INTO public.blockchain_records (transaction_id, previous_hash, current_hash, timestamp_proof)
    VALUES (NEW.id, prev_hash, NEW.blockchain_hash, NOW());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create AFTER INSERT trigger to insert blockchain record
DROP TRIGGER IF EXISTS create_blockchain_record ON public.transactions;
CREATE TRIGGER create_blockchain_record
    AFTER INSERT ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.insert_blockchain_record();
