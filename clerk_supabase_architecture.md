# Clerk + Supabase Authentication Architecture

Fintrac AI uses a modern, secure, and highly scalable authentication architecture leveraging **Clerk** for identity management and **Supabase** for PostgreSQL data storage and Row Level Security (RLS).

## Why Clerk?
Clerk provides fintech-grade security, handling multi-factor authentication (MFA), OAuth (Google), magic links, and session management out-of-the-box. It allows us to offload the security risks of storing passwords and managing sessions, while providing an incredibly fast onboarding experience for users.

## Why Supabase?
Supabase provides a powerful PostgreSQL database with built-in Row Level Security. By combining it with Clerk, we avoid building a custom backend API layer just to proxy database requests.

## The Architecture Flow

1. **Client-Side Auth**: Users sign in via Clerk's `<SignIn />` component.
2. **Next.js Middleware**: `middleware.ts` intercepts requests to `/dashboard`, `/invest`, and `/api/secure`. If the user is unauthenticated, they are redirected to `/sign-in`.
3. **Webhook Sync**: Upon successful registration, Clerk sends a webhook (`user.created`) to our Next.js API route (`/api/webhooks/clerk`).
   - The webhook is verified using `svix` to ensure it genuinely came from Clerk.
   - The Next.js server securely inserts the user's profile into the Supabase `public.users` table using a Service Role Key (bypassing RLS).
4. **Custom JWT Template**: Clerk is configured to generate a custom JWT specifically for Supabase. This token contains a `sub` claim which matches the user's Clerk ID (e.g., `user_2J4n...`).
5. **Secure Database Access**:
   - The Next.js Client fetches this JWT from Clerk.
   - It attaches the JWT to the `Authorization: Bearer <TOKEN>` header when communicating with Supabase.
   - Supabase parses the token. Instead of using the native `auth.uid()`, our RLS policies use a custom Postgres function `public.clerk_user_id()` which securely extracts the `sub` claim from the incoming Clerk JWT.

## Security Decisions

- **No Proxy Backend**: By using Clerk JWTs to authenticate directly with Supabase, we eliminate the latency and overhead of a proxy API server.
- **MFA Optional MVP**: MFA is architecturally supported by Clerk but disabled by default to reduce onboarding friction for early adopters. It can be enforced later for high-risk accounts or admin roles.
- **Service Role Isolation**: Only the Webhook route has access to the Supabase Service Role Key. The frontend client only has access to the Anon Key and its own scoped Clerk JWT.
- **Database Schema**: The `users` table uses a `TEXT` primary key instead of a UUID to natively support Clerk's string-based user IDs (`user_xxxxx`).
