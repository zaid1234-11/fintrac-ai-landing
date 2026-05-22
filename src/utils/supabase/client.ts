import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client that authenticates via Clerk's custom JWT.
 * Pass the `session` object obtained from Clerk's `useSession()` hook.
 */
export const createClerkSupabaseClient = (clerkSession: any) => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          // Request the custom Supabase JWT template from Clerk
          const clerkToken = await clerkSession?.getToken({
            template: 'supabase',
          })
          
          const headers = new Headers(options?.headers)
          if (clerkToken) {
              headers.set('Authorization', `Bearer ${clerkToken}`)
          }

          return fetch(url, {
            ...options,
            headers,
          })
        },
      },
    }
  )
}
