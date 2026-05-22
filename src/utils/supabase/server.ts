import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

/**
 * Creates a Supabase client for Server Components or Server Actions.
 * It automatically extracts the authentication token from the Next.js server context.
 */
export const createClerkSupabaseServerClient = async () => {
  const { getToken } = await auth();
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          // Request the custom Supabase JWT template from the Next.js server context
          const clerkToken = await getToken({
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
