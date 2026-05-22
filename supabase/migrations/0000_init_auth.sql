-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: If you already have a `users` table from a previous tutorial, you might need to DROP it first, 
-- OR use ALTER TABLE to add `clerk_user_id` and change `id` to UUID.
-- DROP TABLE IF EXISTS public.users CASCADE;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Users can read their own data. We match the JWT 'sub' claim (which Clerk sets to the user ID) against `clerk_user_id`
CREATE POLICY "Users can view their own profile"
  ON public.users
  FOR SELECT
  USING (auth.jwt() ->> 'sub' = clerk_user_id);

CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (auth.jwt() ->> 'sub' = clerk_user_id);

-- Note: Webhooks will bypass RLS by using the Service Role Key, 
-- so we do not need an INSERT policy for normal users to create their own rows.

-- 4. Example: Transactions Table (for future ingestion)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL, -- Storing this makes RLS easier, or join via user_id
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON public.transactions
  FOR SELECT
  USING (auth.jwt() ->> 'sub' = clerk_user_id);
