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

---

## SPRINT 6 - MULTI-BANK INGESTION EXPANSION

### Requested Scope

- Refactor PDF parsing into a scalable bank-adapter architecture under `src/lib/parsers/`.
- Move the existing Kotak multiline aggregation and dynamic debit/credit logic into a dedicated Kotak adapter.
- Scaffold HDFC, ICICI, and SBI adapters and route PDF parsing through `getParserForBank(bankName)`.
- Enforce running-balance-based direction resolution across all bank adapters to avoid silent debit/credit ingestion errors.

### Planned Changes

1. `src/lib/parsers/types.ts`
   - Add `BaseBankParser` and a standard `BankParserTransaction` output contract:
     - date
     - amount
     - direction
     - raw description
     - running balance

2. `src/lib/parsers/bankParserUtils.ts`
   - Add shared date/amount/merchant helpers.
   - Add central running-balance direction enforcement for all adapters.
   - Add conversion from bank-adapter rows into existing `NormalizedTransaction` records.

3. `src/lib/parsers/kotakAdapter.ts`
   - Move Kotak multiline block aggregation out of `pdf-parser.ts`.
   - Preserve Kotak dynamic debit/credit logic, now through the shared running-balance resolver.

4. `src/lib/parsers/hdfcAdapter.ts`, `src/lib/parsers/iciciAdapter.ts`, `src/lib/parsers/sbiAdapter.ts`
   - Scaffold adapters implementing `BaseBankParser`.
   - Use the shared balance-aware generic table parser until bank-specific layouts are refined.

5. `src/lib/parsers/bankParserFactory.ts`
   - Add `getParserForBank(bankName)` for routing detected banks to their adapters.

6. `src/lib/parsers/pdf-parser.ts`
   - Reduce PDF parser responsibilities to text extraction, bank detection, adapter routing, and output normalization.

### Completed Changes

- Added `BaseBankParser`, `BankParserContext`, `BankParserResult`, `BankParserTransaction`, and `TransactionDirection` in `src/lib/parsers/types.ts`.
- Added `src/lib/parsers/bankParserUtils.ts` with shared:
  - date parsing
  - numeric cleanup
  - merchant/payment-method inference
  - UPI reference handoff
  - adapter-row to `NormalizedTransaction` conversion
  - running-balance direction enforcement
- Extracted Kotak-specific multiline aggregation into `src/lib/parsers/kotakAdapter.ts`.
- Added adapter stubs for:
  - `src/lib/parsers/hdfcAdapter.ts`
  - `src/lib/parsers/iciciAdapter.ts`
  - `src/lib/parsers/sbiAdapter.ts`
- Added `src/lib/parsers/bankParserFactory.ts` with `getParserForBank(bankName)`.
- Refactored `src/lib/parsers/pdf-parser.ts` so it now:
  - extracts PDF text
  - detects Kotak/HDFC/ICICI/SBI
  - routes to the selected bank adapter
  - normalizes adapter output into the existing ingestion contract
  - rejects unsupported PDF banks explicitly

### Running Balance Enforcement

- All PDF bank adapters now resolve debit/credit through `resolveDirectionFromRunningBalance`.
- If a parsed transaction amount does not match the mathematical delta between adjacent running balances, parsing throws a hard error instead of silently ingesting a likely wrong direction.
- The first row still uses description fallback because there is no prior balance for comparison.

### Verification

- `npx.cmd tsc --noEmit`: passed.
- `npm.cmd run build`: compilation, linting, and type checking passed, then prerender failed because Clerk env is not configured locally:
  - Missing Clerk publishable key / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
  - This is the same existing environment blocker documented in Sprint 5.

---

## SPRINT 7 - MOBILE-FIRST & CINEMATIC UX

### Requested Scope

- Reorganize the Behavioral Console grid for touch-first mobile layouts.
- Enforce GPU acceleration on `backdrop-blur-md` glass surfaces.
- Gracefully degrade heavy blur/motion effects for reduced-motion or reduced-transparency environments.
- Ensure Next Best Action and explainability feedback controls meet 44x44px touch target guidance.

### Completed Changes

- Pushed Sprint 6 parser adapter work to `origin/main` at commit `c1432e4`.
- Updated `src/app/dashboard/page.tsx` to use mobile-first stacking:
  - summary/goals/AI insights stack on mobile
  - AI insights span cleanly across `md`
  - wider `xl` screens restore a composed multi-column console
  - SMS status and AI copilot feed stack on mobile and split at `lg`
- Updated `src/app/dashboard/layout.tsx` with responsive dashboard padding: `p-4 sm:p-6 lg:p-8`.
- Added `transform-gpu` and `gpu-glass` to dashboard glass surfaces using `backdrop-blur-md`.
- Audited all current `backdrop-blur-md` uses and added `transform-gpu`/`gpu-glass` where missing, including cards/security dashboard buttons.
- Added `gpu-glass` CSS degradation rules in `src/app/globals.css`:
  - disables backdrop filters when `prefers-reduced-motion` or `prefers-reduced-transparency` is active
  - falls back to a solid dark translucent surface when backdrop-filter is unsupported
- Updated AI insight/NBA buttons and modal feedback buttons to use minimum 44px touch targets via `min-h-11` / `min-w-11`.
- Updated `InsightExplainabilityModal` feedback layout to stack cleanly on mobile and expand into a grid on larger screens.

### Verification

- `npx.cmd tsc --noEmit`: passed.
- `npm.cmd run build`: compilation, linting, and type checking passed, then prerender failed because Clerk env is not configured locally:
  - Missing Clerk publishable key / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
  - This is the same existing environment blocker documented in Sprint 5 and Sprint 6.
