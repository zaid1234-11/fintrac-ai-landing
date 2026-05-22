# Clerk + Supabase Integration Guide

To complete the setup of your Fintrac AI authentication system, follow these steps in your Clerk and Supabase dashboards.

## 1. Environment Variables
Ensure you have created a `.env.local` file based on `.env.example` with the following variables:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 2. Clerk Webhook Setup (Svix)
1. Go to your Clerk Dashboard -> **Webhooks**.
2. Click **Add Endpoint**.
3. Set the Endpoint URL to your production or ngrok URL: `https://your-domain.com/api/webhooks/clerk`.
4. Subscribe to the `user.created` event.
5. Click **Create**.
6. Copy the **Signing Secret** (starts with `whsec_`) and paste it into your `.env.local` as `CLERK_WEBHOOK_SECRET`.

## 3. Supabase JWT Template Setup in Clerk
To allow Supabase to read Clerk's tokens natively via RLS:
1. Go to your Clerk Dashboard -> **JWT Templates**.
2. Click **New Template** and select **Supabase**.
3. Name it exactly: `supabase`.
4. Leave the default claims as they are. It should look like this:
```json
{
  "aud": "authenticated",
  "role": "authenticated",
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address}}"
}
```
5. Click **Apply Changes**.

## 4. Reset Supabase Database
Because we changed the schema to support Clerk's text-based User IDs (removing UUIDs), you need to reset and re-push your Supabase migrations.

Run this in your terminal:
```bash
npx supabase db reset --linked
```
*(If you haven't linked your project, run `npx supabase link --project-ref <your-id>` first).*
