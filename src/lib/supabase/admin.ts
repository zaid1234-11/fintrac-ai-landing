import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Creates an administrative Supabase client using the Service Role Key.
 * Bypasses Row Level Security (RLS).
 * 
 * NEVER use this in Client Components or public routes.
 * ONLY use this in Webhooks, Cron Jobs, or highly secured backend tasks.
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}
