# Fintrac AI: Next.js App Router Migration & Clerk Auth Plan

This document outlines the two-phase plan to completely restructure Fintrac AI into a production-grade Next.js SaaS architecture and implement Clerk authentication seamlessly with Supabase.

---

## User Review Required

> [!WARNING]
> This is a destructive migration that will overwrite your Vite configuration and React Router structure. The `index.html` and `vite.config.ts` will be removed, and your `package.json` will be heavily modified. Your components, Tailwind styling, and logic will remain, but their file structure will change to match Next.js App Router conventions.
>
> **Please approve this plan so we can begin the migration phase.**

---

## Phase 1: Vite -> Next.js App Router Migration

### 1. Dependency Overhaul
- **[MODIFY]** `package.json`: Remove `vite`, `@vitejs/plugin-react-swc`, and `react-router-dom`. Install `next` (`^14` or `latest`), `@clerk/nextjs`, `@supabase/supabase-js`, and `svix`.

### 2. Configuration Migration
- **[DELETE]** `vite.config.ts` and `index.html`
- **[MODIFY]** `tsconfig.json`: Update compiler options to support Next.js strict mode and path aliases (`@/*`).
- **[MODIFY]** `tailwind.config.ts` / `postcss.config.js`: Ensure paths align with Next.js standards.

### 3. File System Routing Setup
- **[NEW]** `src/app/layout.tsx`: Create the root server-rendered layout containing global CSS, `<ClerkProvider>`, and essential metadata.
- **[NEW]** `src/app/globals.css`: Move and consolidate `index.css` or Tailwind imports.
- **[MODIFY]** `src/pages/*` -> `src/app/*/page.tsx`: Move all React Router components into the Next.js App directory structure (e.g., `src/pages/Chatbot.tsx` becomes `src/app/chatbot/page.tsx`).
- **[MODIFY]** `react-router-dom` -> `next/navigation`: Update all `<Link to="...">` to `<Link href="...">` and `useNavigate` to `useRouter`.

---

## Phase 2: Clerk + Supabase Authentication Architecture

### 1. Middleware & Core Auth Setup
- **[NEW]** `middleware.ts`: Implement `clerkMiddleware()` to protect all `/dashboard`, `/invest`, and `/api/secure` routes, ensuring users cannot access financial data while signed out.
- **[NEW]** `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` & `sign-up`: Provide Clerk drop-in UI with branding configurations.

### 2. Supabase Integration Layer (No Proxy Backend required)
- **[NEW]** `src/utils/supabase/client.ts` & `server.ts`: We will configure the Supabase client to dynamically request the `supabase` JWT from Clerk. This token will be passed in the `Authorization: Bearer` header, allowing Supabase's PostgreSQL Row Level Security (RLS) to parse the `sub` claim securely.

### 3. Fintech-grade User Syncing (Webhooks)
- **[NEW]** `src/app/api/webhooks/clerk/route.ts`: A secure Next.js API Route utilizing the `svix` package to verify the incoming Clerk webhook signature. When `user.created` triggers, we will execute a secure Server-side Supabase query to replicate the user profile in your `public.users` table, linking future transactions properly.

### 4. Database Security Adjustments
- **[MODIFY]** Update `supabase/migrations/00003_security_and_rls.sql` so that Supabase reads from the incoming Clerk JWT payload `request.jwt.claims` rather than relying on its native `auth.uid()` function.

---

## Phase 3: Clerk ↔ Supabase Synchronization & Security Architecture

This phase focuses on the secure, authenticated database architecture, connecting Clerk user events to Supabase via Svix webhooks, and implementing fintech-grade Row Level Security.

### 1. Database Schema modifications
- **[SQL]** We will execute a schema migration on your Supabase `users` table to adhere to best practices:
  - Keep `id` as an internal `UUID` primary key.
  - Add `clerk_user_id` as a `TEXT UNIQUE NOT NULL` field.
  - Update any dependent foreign keys.

### 2. JWT Integration (Clerk to Supabase)
- **[DASHBOARD]** Provide you with the exact JSON template to configure the "Supabase" JWT template in your Clerk Dashboard.
- **[NEW]** Define the claims structure so Supabase RLS can securely identify the user via `request.jwt.claims()`.

### 3. Secure Supabase Clients (`src/lib/supabase/`)
- **[NEW]** `client.ts`: Authenticated browser client using `@supabase/supabase-js` that fetches the active Clerk session token dynamically.
- **[MODIFY]** `server.ts`: Server Component/Server Action client that reads the Clerk token securely from the Next.js auth context.
- **[NEW]** `admin.ts`: Secure service-role client used EXCLUSIVELY by webhooks and secure backend processes.

### 4. Clerk Webhook Integration
- **[NEW]** `src/app/api/webhooks/clerk/route.ts`: A secure Next.js API Route handler using `svix` to verify incoming signatures.
- **[LOGIC]** Handle `user.created`, `user.updated`, and `user.deleted` events. Use `admin.ts` to sync these events directly into the Supabase `users` table.

### 5. Fintech-grade Row Level Security (RLS)
- **[SQL]** Generate and apply strict RLS policies to `users`, `transactions`, and `ai_insights`.
- **[LOGIC]** Ensure policies read the `clerk_user_id` from the decoded JWT claims (`(auth.jwt()->>'sub')`), isolating financial data perfectly.

### 6. Documentation
- **[NEW ARTIFACT]** Generate `clerk_supabase_sync.md` documenting the auth architecture, webhook setup, and token flow.

---

## Verification Plan

### Automated / Code Checks
- Ensure webhook signature verification throws 400 on bad secrets.
- Ensure Supabase queries from `client.ts` automatically attach the `Authorization: Bearer <token>` header.

### Manual Verification
1. Register a new user via Clerk UI.
2. Confirm the webhook triggers and a new row appears in Supabase `users`.
3. Confirm RLS blocks unauthenticated access to transactions.
4. Verify deployment compatibility on Vercel.
