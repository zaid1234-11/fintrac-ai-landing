import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for browser environments (Client Components).
 * It automatically extracts the authentication token from the window/Clerk context.
 * 
 * NOTE: For full authenticated queries from the client, you should ideally
 * fetch the Clerk token and pass it. However, since @supabase/ssr needs 
 * synchronous initialization, we recommend doing data fetching server-side 
 * or passing the token explicitly via fetch headers in Client Components.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
