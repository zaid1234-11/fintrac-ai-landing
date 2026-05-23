# Sprint 4 Implementation Walkthrough - Trust, Explainability & Wellness

## Overview
This document tracks all changes made during Sprint 4 implementation for Fintrac AI Landing, focusing on adding trust, explainability, and observability layers.

## Date: May 24, 2026

---

## Database Changes

### Migration File: `supabase/migrations/00012_sprint4_trust_wellness.sql`

**Created new tables:**
1. `insight_explanations` - Maps insights to trigger reasons, source transactions, and recurrence signals
   - Columns: id, insight_id, trigger_reason, source_transaction_ids (UUID array), recurrence_signals (JSONB)
   - RLS policies for SELECT, INSERT, UPDATE scoped to user's own insights
   - Index on insight_id for faster lookups

2. `intelligence_telemetry` - Daily rollup metrics for observability
   - Columns: id, metric_date, metric_name, metric_value, metadata, created_at, updated_at
   - Unique constraint on (metric_date, metric_name) for upsert operations
   - RLS policies for authenticated users
   - Indexes on metric_date and metric_name

**Modified tables:**
3. `behavioral_profiles` - Added `wellness_metrics` JSONB column
   - Stores detailed wellness metrics breakdown

**Applied migration:** Successfully pushed to remote database using `npx supabase db push`

---

## Backend Logic Changes

### File: `src/lib/ai/behavioralIntel.ts`

**Interface updates:**
- Added `explanation` field to `CandidateInsight` interface
  - trigger_reason: string
  - source_transaction_ids: string[]
  - recurrence_signals: Record<string, any>

**Query updates:**
- Modified transaction select query to include `id` field alongside categories

**Heuristic updates with explanation payloads:**

1. **Spending Spike Heuristic**
   - Captures source transaction IDs from last 7 days
   - Adds explanation with trigger reason, source IDs, and recurrence signals

2. **Category Drift Heuristic**
   - Captures source transaction IDs from last 14 days
   - Adds explanation with wallet share drift calculations

3. **Recurring Subscriptions Heuristic**
   - Captures all subscription transaction IDs
   - Adds explanation with interval data and amount variance

4. **Impulsive Late-Night Spending Heuristic**
   - Captures late-night transaction IDs
   - Adds explanation with time window and recency decay factor

5. **Salary Burn Velocity Heuristic**
   - Captures post-salary transaction IDs
   - Adds explanation with burn percentage and window data

**Insight insertion updates:**
- Modified to use `.select('id').single()` to retrieve insight ID after insertion
- Inserts corresponding explanation record into `insight_explanations` table

**Wellness Metrics Calculation:**

1. **Spending Stability** (starts at 100)
   - Penalized by category drifts (-10 each)
   - Penalized by anomalies (-5 each)
   - Range: 0-100

2. **Savings Consistency** (0-100)
   - Calculation: ((credits - debits) / credits) * 100
   - Fail-safe: defaults to 0 if total credits = 0

3. **Impulse Pacing** (starts at 100)
   - Penalized by late-night transactions (-2 each)
   - Penalized by weekend impulse food spending (-3 each)
   - Range: 0-100

4. **Subscription Buffer** (starts at 100)
   - Penalized by ratio of recurring outflows to total outflows
   - Range: 0-100

**Financial Wellness Score:**
- Recalculated as mathematical average of the four metrics above
- Updated in `behavioral_profiles` table

**Telemetry Upsert:**
- Daily rollup of metrics to `intelligence_telemetry` table
- Tracks: classification_accuracy, ai_fallback_rate, active_corrections
- Also upserts individual wellness metrics
- Uses ON CONFLICT clause for daily updates

---

## API Routes

### New Route: `src/app/api/insights/explain/route.ts`

**Endpoint:** `GET /api/insights/explain?insight_id={id}`

**Functionality:**
- Fetches explanation from `insight_explanations` table
- Queries `transactions` for all source transaction IDs
- Returns merged payload with trigger reason, recurrence signals, and source transactions
- Requires authentication via Clerk

### New Route: `src/app/api/telemetry/route.ts`

**Endpoint:** `GET /api/telemetry`

**Functionality:**
- Fetches latest telemetry logs for the user
- Groups by metric name and returns latest value for each
- Returns both latest metrics and historical data
- Requires authentication via Clerk

---

## Frontend Components

### New Component: `src/components/dashboard/InsightExplainabilityModal.tsx`

**Features:**
- Glassmorphic modal design using Shadcn Dialog
- Fetches data from `/api/insights/explain` endpoint
- Displays:
  - Trigger reason
  - Mathematical parameters (recurrence signals)
  - Source transactions table (date, description, category, amount)
- Embedded feedback controls in footer:
  - "Helpful" button
  - "Unhelpful" button
  - "Correct Category" button
  - "Hide Alert" button
- Loading and error states
- Responsive design

### Modified Component: `src/components/dashboard/AIInsights.tsx`

**Changes:**
- Added import for `InsightExplainabilityModal`
- Added import for `HelpCircle` icon from lucide-react
- Added state for selected insight ID and modal open/close
- Added `handleExplainClick` function to open modal
- Added "Why this claim?" button to each insight card
- Integrated `InsightExplainabilityModal` component at bottom of card

### Modified Component: `src/app/dashboard/page.tsx`

**Changes:**
- Added `"use client"` directive (required for React hooks)
- Added imports for Card, Progress, Badge components
- Added imports for Activity, TrendingUp, Shield, Zap icons
- Added state for wellness metrics, telemetry, and observability toggle
- Added useEffect to fetch metrics from API endpoints
- Added "Behavioral Wellness Audit" card displaying:
  - Spending Stability progress bar
  - Savings Consistency progress bar
  - Impulse Pacing progress bar
  - Subscription Buffer progress bar
- Added "Observability Dashboard" card (collapsible):
  - Classification Accuracy metric
  - AI Fallback Rate metric
  - Active Corrections metric
  - Show/Hide toggle badge

---

## Build & Verification

**Dependencies Installed:**
- Ran `npm install` to install all project dependencies

**TypeScript Verification:**
- All TypeScript compilation passed successfully
- Added `"use client"` directive to dashboard page to fix hook usage error

**Database Migration:**
- Repaired migration history for remote sync issues (00010, 00011)
- Successfully pushed migration to remote database

**Build Status:**
- TypeScript compilation: ✅ Success
- Database migration: ✅ Success
- Production build: ⚠️ Requires environment variables (Clerk keys)

---

## Environment Setup Required

To run the application, create a `.env` file based on `.env.example`:

```env
VITE_OPENROUTER_API_KEY=
OPENROUTER_API_KEY=

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
CLERK_WEBHOOK_SECRET=

# Supabase Auth Integration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Files Modified/Created

### Created:
1. `supabase/migrations/00012_sprint4_trust_wellness.sql`
2. `src/app/api/insights/explain/route.ts`
3. `src/app/api/telemetry/route.ts`
4. `src/components/dashboard/InsightExplainabilityModal.tsx`
5. `walk.md` (this file)

### Modified:
1. `src/lib/ai/behavioralIntel.ts`
2. `src/components/dashboard/AIInsights.tsx`
3. `src/app/dashboard/page.tsx`

---

## Next Steps

1. Configure environment variables in `.env` file
2. Test the explainability modal with real insights
3. Verify wellness metrics calculation with transaction data
4. Test telemetry dashboard functionality
5. Implement feedback submission logic for modal buttons
6. Add actual classification accuracy calculation from user feedback
7. Track AI fallback rates in real-time

---

## Notes

- The implementation follows the existing codebase patterns and architecture
- All components use shadcn/ui for consistent styling
- RLS policies ensure users can only access their own data
- Telemetry uses daily rollup to prevent database bloat
- Wellness metrics are calculated from 90-day transaction history
- The system is designed to be scalable and maintainable

---

## SPRINT 5 - THE "AHA!" ONBOARDING EXPERIENCE

### Requested Scope

- Upgrade the first-user PDF statement upload into a premium dark/glassmorphic onboarding moment.
- Replace generic loading with an intelligent streamed activity log while ingestion runs.
- Transition users to the Behavioral Console dashboard once ingestion and behavioral intelligence are complete.

### Planned Changes

1. `src/components/dashboard/TransactionUpload.tsx`
   - Redesign the upload dropzone with a high-end SaaS dark glass treatment, clearer PDF-first language, drag/drop polish, and premium microcopy.
   - Keep existing PDF/CSV validation, optional PDF password support, and backend upload endpoint integration.
   - Replace spinner-style upload feedback with a sequenced activity state machine:
     - Parsing statement structure...
     - Normalizing merchants...
     - Detecting recurring subscriptions...
     - Analyzing behavioral spending patterns...
     - Generating financial wellness insights...
   - Pace log entries with readable delays while the real upload and ingestion status polling continue.
   - Mark prior stages complete and keep the active stage visibly "live" without using a generic loader.
   - On successful completion, refresh transactions and route the user to `/dashboard`.

2. Verification
   - Run TypeScript/build verification where environment constraints allow.
   - Record any build or environment blockers here.

### Completed Changes

- Rebuilt `src/components/dashboard/TransactionUpload.tsx` as a premium dark/glassmorphic statement upload experience.
- Added PDF-first drag/drop styling, privacy/file-size trust chips, selected-file treatment, and optional PDF password UI.
- Replaced the previous spinner/status text with a sequenced activity log that streams:
  - "Parsing statement structure..."
  - "Normalizing merchants..."
  - "Detecting recurring subscriptions..."
  - "Analyzing behavioral spending patterns..."
  - "Generating financial wellness insights..."
- Kept the existing backend flow: POST to `/api/ingestion/upload`, then poll `/api/ingestion/status`.
- On successful ingestion, the component now refreshes transactions and routes to `/dashboard` for the Behavioral Console.
- Tightened polling control flow so success, processing failure, and timeout each resolve only once.

### Verification

- `npx.cmd tsc --noEmit`: passed after implementation and after the polling control-flow cleanup.
- `npm.cmd run build`: Next.js compilation and type checking passed, but prerendering failed because Clerk env is not configured locally:
  - Missing `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / Clerk publishable key.
  - This matches the existing environment setup note above and is not caused by the Sprint 5 component changes.
