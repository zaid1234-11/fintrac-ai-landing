import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';

/**
 * Creates a secure Supabase client for Server Components, Server Actions, and Route Handlers.
 * It dynamically fetches the Clerk JWT template and injects it into every Supabase request.
 */
export async function createClient() {
  const cookieStore = cookies();
  const { getToken } = await auth();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
      global: {
        // Override the default fetch to inject the Clerk JWT
        fetch: async (url: RequestInfo | URL, options: RequestInit = {}) => {
          // Request the custom Supabase JWT template from Clerk
          const clerkToken = await getToken({
            template: 'supabase',
          });

          const headers = new Headers(options?.headers);
          if (clerkToken) {
            headers.set('Authorization', `Bearer ${clerkToken}`);
          }

          return fetch(url, {
            ...options,
            headers,
          });
        },
      },
    }
  );
}
