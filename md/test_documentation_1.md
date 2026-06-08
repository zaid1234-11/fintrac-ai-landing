# FinTrac AI - Verification & Testing Documentation (v1)

This document details the testing framework, assertion logic, database triggers, and execution summaries for **FinTrac AI**. It records how we mathematically verify the reinforcement learning weight updates, database Row-Level Security (RLS) constraints, and cryptographic audit ledgers.

---

## 1. Reinforcement Learning Friction Updates Unit Tests

The core validation suite for the RL friction updates is located at [runFrictionUpdatesTests.ts](file:///C:/Users/zaids/.gemini/antigravity/scratch/fintrac-ai-landing/src/lib/ai/runFrictionUpdatesTests.ts) and is run using `npx ts-node`.

### 1.1 Mathematical Formulation of Test Assertions

Let $F_t$ represent the estimated friction for a category in month $t$, $S^{\text{fail}}_t$ represent the failure streak, and $S^{\text{comp}}_t$ represent the compliance streak. The unit tests verify four distinct behavioral scenarios:

#### Scenario A: Cold Start Behavior (Initial Prior)
When a category is unprofiled, the system defaults to a neutral prior:
$$F_0 = 0.50, \quad S^{\text{fail}}_0 = 0, \quad S^{\text{comp}}_0 = 0$$
For a suggested savings cut $X_1 = 2000$ and actual savings $A_1 = 0$ (compliance $C_1 = 0$):
- **Failure Streak**: $S^{\text{fail}}_1 = S^{\text{fail}}_0 + 1 = 1$
- **Compliance Streak**: $S^{\text{comp}}_1 = 0$
- **Friction Penalty**:
  $$F_1 = F_0 + \alpha \cdot (1.0 - C_1) \cdot \left(1.0 + 0.5 \cdot S^{\text{fail}}_0\right) = 0.50 + 0.15 \cdot (1.0 - 0.0) \cdot 1.0 = 0.65$$

#### Scenario B: Consecutive Failure with Streak Penalty
If the user ignores a cut $X_2 = 1400$ again in month 2 ($C_2 = 0$):
- **Failure Streak**: $S^{\text{fail}}_2 = S^{\text{fail}}_1 + 1 = 2$
- **Friction Penalty**:
  $$F_2 = F_1 + \alpha \cdot (1.0 - C_2) \cdot \left(1.0 + 0.5 \cdot S^{\text{fail}}_1\right) = 0.65 + 0.15 \cdot (1.0 - 0.0) \cdot 1.5 = 0.875$$

#### Scenario C: Zero Recommendations Reset
If the system recommends a suggested cut $X_3 = 0$ in month 3, the user's failure streak is reset to zero to prevent historical fatigue propagation:
- **Failure Streak**: $S^{\text{fail}}_3 = 0$

#### Scenario D: Cooldown Threshold and Decay
When the user complies perfectly ($C_t = 1.0$) for consecutive months:
- **Month 4 ($C_4 = 1.0$)**: $S^{\text{comp}}_4 = 1, \quad F_4 = F_3 = 0.875$ (no decay before threshold)
- **Month 5 ($C_5 = 1.0$)**: $S^{\text{comp}}_5 = 2, \quad F_5 = F_4 = 0.875$ (no decay before threshold)
- **Month 6 ($C_6 = 1.0$)**: $S^{\text{comp}}_6 = 3 \ge \text{recovery\_threshold}$ (decay triggered):
  $$F_6 = \max\left(0.0, F_5 - \text{decay\_rate}\right) = 0.875 - 0.05 = 0.825$$

### 1.2 Test Case Matrix & Assertions

| Test Case | Month | Suggested Cut ($X$) | Actual achieved ($A$) | Compliance ($C$) | Failure Streak | Compliance Streak | Friction Score | Assertion Verified |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1. Cold Start** | 1 | $2,000$ | $0$ | $0.00$ | $1$ | $0$ | $0.6500$ | `Shopping failure sets streak = 1, friction = 0.65` |
| **2. Consecutive Fail** | 2 | $1,400$ | $0$ | $0.00$ | $2$ | $0$ | $0.8750$ | `Streak penalty accelerates friction to 0.875` |
| **3. Zero Reset** | 3 | $0$ | $0$ | $1.00$ | $0$ | $0$ | $0.8750$ | `Zero suggested cut clears failure streak` |
| **4. Compliance M1** | 4 | $500$ | $500$ | $1.00$ | $0$ | $1$ | $0.8750$ | `Compliance streak increments to 1; no decay` |
| **5. Compliance M2** | 5 | $500$ | $500$ | $1.00$ | $0$ | $2$ | $0.8750$ | `Compliance streak increments to 2; no decay` |
| **6. Cooldown Decay** | 6 | $500$ | $500$ | $1.00$ | $0$ | $3$ | $0.8250$ | `Compliance streak = 3 triggers decay (-0.05)` |

---

## 2. Database Triggers & Security Verification

Database operations are validated directly through migration assertions and local testing against the Supabase schema.

### 2.1 Cryptographic Audit Ledger Trigger
To guarantee transaction history immutability, database triggers recalculate a running SHA-256 hash for every transaction block:
$$\text{Hash}_n = \text{SHA256}(\text{Hash}_{n-1} \parallel \text{ID}_n \parallel \text{Amount}_n \parallel \text{Date}_n)$$

#### Trigger Verification:
- **Test Case**: Inserting a new transaction.
- **Assertion**: The database trigger calculates the SHA-256 hash and automatically matches it against the parent block. Any manual updates to transaction rows will break the chaining sequence, failing audit integrity verification.
- **Genesis Block**: For the first row of any user, the trigger falls back to a deterministic user-specific seed hash:
  $$\text{Hash}_0 = \text{SHA256}(\text{"genesis\_block\_"} \parallel \text{user\_id})$$

### 2.2 Row-Level Security (RLS) Verification
Supabase RLS policies are applied to isolate user scopes.
- **Helper Function**: `public.clerk_user_id()` parses the JWT sub claim:
  `current_setting('request.jwt.claims', true)::json->>'sub'`
- **RLS Assertions**:
  1. Reading transactions of other users must fail (return empty result or error).
  2. Inserting data with a mismatched `user_id` must be blocked.
  3. Deletion of user profile histories is permitted only when matched against the authenticated sub token.

---

## 3. Serverless Background Pipeline Validation

The Inngest event processor validates statements and updates profile telemetry.

### 3.1 Statement Processing Pipeline
- **Input**: A bank statement PDF file uploaded by the user.
- **Verification step**:
  - Confirms text extraction is executed.
  - Verifies UPI/UTR references match standard patterns: `\b\d{12}\b`
  - Validates direction check:
    $$\Delta B = B_{\text{current}} - B_{\text{previous}}$$
    - If $\Delta B > 0$, transactions must register as credits.
    - If $\Delta B < 0$, transactions must register as debits.

### 3.2 Monthly Friction Update Job
- **Trigger**: Cron scheduler trigger `cron: "0 0 1 * *"` executes monthly job.
- **Verification step**:
  - Pulls users' active budget limits and actual spending records for the previous month.
  - Executes the reinforcement learning weight update loop.
  - Logs historical recommendations into the `historical_budgets` log database.
