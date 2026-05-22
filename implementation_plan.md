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

## Verification Plan

### Automated Tests
1. **Next.js Build**: Execute `npm run build` to verify all components compiled successfully, no React Router references remain, and Server/Client component directives (`"use client"`) are properly placed.
2. **ESLint/TS Check**: Ensure there are no broken path aliases.

### Manual Verification
- You will test `npm run dev`, verify that the landing page loads successfully in the new Next.js architecture, and log in securely via Clerk's Google OAuth flow. Finally, you will check your Supabase `public.users` table to ensure the webhook successfully synced your newly created Clerk user!
