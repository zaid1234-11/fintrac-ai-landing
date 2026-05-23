-- Migration 00006: Add error_message to bank_statements table
ALTER TABLE public.bank_statements ADD COLUMN error_message TEXT;
