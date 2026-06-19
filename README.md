<div align="center">

# FinTrac AI

### AI-Powered Financial Behavioral Coaching Platform

**Elastic Reinforcement Learning · POMDP Savings Optimization · Personalized Behavioral Finance**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-fintrac--ai--landing.vercel.app-brightgreen?style=for-the-badge&logo=vercel)](https://fintrac-ai-landing.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

</div>

---

## Overview

**FinTrac AI** is a full-stack, production-grade financial behavioral coaching platform that combines **Reinforcement Learning (RL)**, **behavioral economics**, and **real-time transaction intelligence** to help users achieve sustainable savings goals without overwhelming psychological friction.

Unlike traditional budget apps that apply rigid, equal spending cuts across all categories, FinTrac AI's **Elastic RL Savings Engine** continuously learns each user's unique spending psychology — routing cuts to low-friction categories, protecting psychologically sensitive areas, and auto-recovering from financial shocks like income disruptions or seasonal spending surges.

> **Core Hypothesis**: The primary cause of budgeting app abandonment is not lack of willpower — it is *psychologically misallocated* spending pressure. By modeling behavioral friction as a dynamic, learnable signal, FinTrac AI achieves a **97.08% 12-month user retention rate** versus **63.54%** for traditional proportional budgeting — a statistically significant absolute improvement of **+33.54%**.

---

## Key Results at a Glance

| Metric | Elastic RL Engine | Traditional Budgeting | Delta |
| :--- | :---: | :---: | :---: |
| **Month 12 User Retention** | **97.08%** | 63.54% | **+33.54 pp** |
| **Mean Active Lifespan** | **11.78 months** | 9.56 months | **+23.2%** |
| **Mean Savings Compliance** | **41.63%** | 38.61% | **+7.8%** |
| **Mean Behavioral Cost** | **115.22 units** | 115.75 units | **-0.5%** |
| **Cohort Size** | 5,000 users | 5,000 users | — |
| **Simulation Horizon** | 12 months | 12 months | — |

*Validated via two-sample t-tests, chi-squared tests, and Cohen's d effect sizes.*

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [The Elastic RL Savings Engine](#2-the-elastic-rl-savings-engine)
3. [Key Features](#3-key-features)
4. [Tech Stack](#4-tech-stack)
5. [Repository Structure](#5-repository-structure)
6. [Getting Started](#6-getting-started)
7. [Reproducing Research Results](#7-reproducing-research-results)
8. [Documentation Index](#8-documentation-index)
9. [Author](#9-author)
10. [License](#10-license)

---

## 1. Architecture Overview

FinTrac AI is a multi-layer SaaS application with a clear separation of concerns across the frontend, authentication, background compute, and ML research layers.

```
+-------------------------------------------------------------+
|                  Next.js 14 (App Router)                     |
|   Dashboard . Savings Optimizer . Chatbot . Transactions     |
+---------------------------+---------------------------------+
                            |
          +-----------------+------------------+
          |                                    |
          v                                    v
+--------------------+           +----------------------------+
| Supabase (Postgres)|           |  Inngest Serverless Jobs   |
| + Row Level Security|          |  . PDF Statement Parser    |
| + Clerk RLS Policies|          |  . Friction Update Engine  |
| + Behavioral Profiles          |  . Monthly RL Scheduler    |
+--------------------+           +----------------------------+
          |                                    |
          +------------------+-----------------+
                             |
                             v
+-------------------------------------------------------------+
|            Elastic RL Savings Engine (Core ML)               |
|  POMDP Model . Q-learning Friction Updates . Habit Tracking  |
+-------------------------------------------------------------+
```

### Authentication: Clerk + Supabase Federation

- **Clerk** handles identity: MFA, OAuth, magic links, and session management with zero custom auth code.
- **Supabase RLS** enforces data isolation via a custom `clerk_user_id()` PostgreSQL function that parses bearer JWTs, ensuring every user sees only their own financial records.
- **Webhook Sync**: On `user.created` events, a Svix-verified webhook inserts the Clerk profile into the Supabase `public.users` table using an isolated Service Role Key.

---

## 2. The Elastic RL Savings Engine

### Problem: The Rigid Budget Trap

Traditional budgeting apps divide savings targets equally across spending categories, ignoring that psychological friction varies dramatically per category, per user, and over time. When users are pressured to cut spending in high-friction categories (e.g., subscriptions they rely on emotionally), they disengage and churn.

### Solution: Partially Observable Markov Decision Process (POMDP)

FinTrac AI models the user's true behavioral state as a hidden variable and learns to optimize budget allocation using observed compliance signals.

**Friction-Weighted Budget Allocation:**

```
Cut(t,c) = Target(t) * [(1 - F_hat(t,c))^2] / [sum over c' of (1 - F_hat(t,c'))^2]
```

High-friction categories receive smaller cuts; low-friction categories absorb more.

**Q-Learning Friction Update Rule:**

```
On compliance failure:  F_hat(t+1,c) = F_hat(t,c) + alpha * (1 - obs) * 1.5
On habit streak >= 3:   F_hat(t+1,c) = F_hat(t,c) - 0.05
```

Where `alpha = 0.15` is the learning rate and `obs` is the observed compliance signal with Gaussian noise N(0, 0.05).

### Ablation Study: Why Active Learning Beats Perfect Profiling

| System | Initial Knowledge | Active Learning | Month 12 Retention |
| :--- | :---: | :---: | :---: |
| Traditional Budgeting | None | No | 62.82% |
| Static Friction-Aware | Perfect baseline | No | 68.58% |
| **Elastic RL Engine** | Uninformed prior (0.5) | **Yes** | **97.90%** |

The key insight: **dynamic adaptation beats even perfect initial profiling**. A static model with perfect knowledge still fails when users experience income shocks or seasonal spending surges — because it cannot re-route cuts in real time.

### Seed Stability (Reproducibility)

The engine was validated across 5 random seeds. The extremely low standard deviation confirms robustness:

| Seed | Month 12 Retention |
| :---: | :---: |
| 1 | 97.42% |
| 42 | 97.76% |
| 123 | 97.60% |
| 999 | 97.92% |
| 2026 | 97.96% |
| **Mean ± SD** | **97.73% ± 0.20%** |

---

## 3. Key Features

### AI & Intelligence Layer

- **Elastic RL Savings Optimizer** — Friction-weighted budget allocation updated monthly via Q-learning.
- **8-Stage Hybrid Transaction Classifier** — Cascading pipeline: Local Cache → Global Registry → Heuristic Rules → Fuzzy Levenshtein (Fuse.js) → GPT-4o-mini fallback.
- **AI Financial Chatbot** — Context-aware assistant answering budget questions in natural language.
- **Behavioral Personality Profiling** — Classifies users into Aspirational Savers, Income Shock profiles, and Seasonal Spenders.

### Data Ingestion

- **Multiline PDF Bank Statement Parser** — Regex-based multi-page transaction extraction with balance-delta credit/debit inference.
- **SMS Transaction Sync** — Android SMS normalization: strips VPAs, UTR codes, and city tags to extract clean transactions.
- **Manual Transaction Corrections** — User-confirmed overrides stored in `merchant_memory` for future zero-latency lookups.

### Security & Compliance

- **Clerk + Supabase RLS Federation** — Every database query is scoped to the authenticated user via JWT-parsed row-level policies.
- **No Proxy Backend** — Frontend clients authenticate directly with Supabase using Clerk JWTs, eliminating proxy API overhead.
- **Inngest Serverless Pipeline** — Asynchronous, fault-tolerant background jobs for statement processing and monthly friction updates.

### Dashboard & Analytics

- **Savings Optimizer Dashboard** — Visual optimization matrix with friction gauges, compliance trajectories, and real-time simulator.
- **Interactive Friction Simulator** — Tabbed UI showing real-time budget reallocation as friction parameters change.
- **Transaction Management** — Full debit/credit ledger with category overrides and merchant memory.
- **Investment & Card Pages** — Future-ready pages for investment tracking and payment card management.

---

## 4. Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5.x |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Authentication** | Clerk (MFA, OAuth, JWT) |
| **Database** | Supabase (PostgreSQL + RLS) |
| **Background Jobs** | Inngest (serverless event pipeline) |
| **AI / LLM** | OpenAI GPT-4o-mini |
| **Fuzzy Matching** | Fuse.js (Levenshtein distance) |
| **Research / ML** | Python, NumPy, Matplotlib, SciPy |
| **Deployment** | Vercel |
| **Version Control** | Git + GitHub |

---

## 5. Repository Structure

```text
fintrac-ai-landing/
|
+-- md/                              # All Project Documentation
|   +-- simulation_monthly_data.md   # Empirical monthly data arrays (RL vs Traditional)
|   +-- tests_reproducibility.md     # Step-by-step guide to reproduce all tables & figures
|   +-- simulation_documentation.md  # Core simulation design & mathematical model
|   +-- simulation_documentation_1.md# Full POMDP results, ablation & robustness analysis
|   +-- simulation_documentation_2.md# IEEE figure generation & table methodology
|   +-- simulation_documentation_3.md# Learning rate sweeps & sensitivity analysis
|   +-- clerk_supabase_architecture.md # Auth flow and RLS implementation details
|   +-- features_06_06_2026.md       # Exhaustive feature-by-feature technical docs
|   +-- feature_documentation_1.md   # Feature deep-dives (Part 1)
|   +-- feature_documentation_2.md   # Feature deep-dives (Part 2)
|   +-- implementation.md            # Full implementation log
|   +-- implementation_plan.md       # Planning artifacts
|   +-- simulation_results_paper.md  # Academic-format results summary
|   +-- test_documentation_1.md      # Unit test documentation (Part 1)
|   +-- test_documentation_2.md      # Unit test documentation (Part 2)
|   +-- review.md                    # Code review notes
|   +-- walk.md                      # Full walkthrough
|   \-- walkthrough.md               # Walkthrough summary
|
+-- research/                        # Simulation & Academic Research Scripts
|   +-- fintrac_simulation_final.py  # Primary 5,000-user POMDP simulation engine
|   +-- extract_results.py           # Aggregates CSV output, runs t-tests & chi-sq
|   +-- verify_ablation_thresholds.py# Ablation study across churn thresholds
|   +-- fintrac_paper_figures.py     # Generates academic-grade PNG/PDF figures
|   +-- ieee_figures_and_tables.py   # IEEE-format figure & table generation (600 dpi)
|   +-- fintrac_ablation_experiment.py # Traditional vs Static vs RL comparison
|   +-- fintrac_km_survival.png      # Figure 1: Kaplan-Meier Survival Curves
|   +-- fintrac_sensitivity_alpha.png# Figure: Learning rate sensitivity sweep
|   +-- fintrac_retention_distribution.png # Figure: Seed stability boxplot
|   \-- fintrac_ablation_study.png   # Figure: Ablation comparison bar chart
|
+-- ieee_output/                     # Publication-Ready IEEE Figures (PNG + PDF @ 600 dpi)
|   +-- fig1_km_survival.{png,pdf}   # Kaplan-Meier user survival curves
|   +-- fig2_compliance_trajectory.{png,pdf} # RL vs Traditional compliance trajectories
|   +-- fig3_friction_convergence.{png,pdf}  # Friction convergence per category
|   +-- fig4_seed_stability.{png,pdf}# Seed stability distribution (5 seeds)
|   +-- fig5_ablation_study.{png,pdf}# Ablation study comparison
|   \-- fig6_sensitivity_panel.{png,pdf}     # Learning rate sensitivity panel
|
+-- src/                             # Next.js Application Source
|   +-- app/                         # App Router: pages & API routes
|   |   +-- dashboard/               # Dashboard routes (savings, budgets, transactions...)
|   |   \-- api/                     # API handlers (Inngest, Clerk webhook, secure)
|   +-- components/                  # Reusable UI components
|   +-- lib/
|   |   +-- ai/
|   |   |   +-- updateFrictionWeights.ts    # RL friction update engine (core logic)
|   |   |   \-- runFrictionUpdatesTests.ts  # 13-assertion unit test suite
|   |   \-- jobs/
|   |       +-- inngest-client.ts    # Inngest client configuration
|   |       \-- functions.ts         # Scheduled jobs (monthlyFrictionUpdate, etc.)
|   \-- services/
|       \-- smsSyncService.ts        # Android SMS parsing & normalization
|
+-- supabase/
|   \-- migrations/                  # PostgreSQL migration files
|       \-- 00013_friction_updates.sql # friction_scores, failure_streaks, behavioral_profiles
|
+-- scripts/
|   \-- diagnostic/                  # Platform diagnostics & database checks
|
+-- README.md                        # This file
+-- package.json
+-- next.config.mjs
\-- tsconfig.json
```

---

## 6. Getting Started

### Prerequisites

- Node.js 18+
- npm or bun
- A Clerk account (for auth)
- A Supabase project (for database)

### Clone & Install

```bash
git clone https://github.com/zaid1234-11/fintrac-ai-landing.git
cd fintrac-ai-landing
npm install
```

### Environment Configuration

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI
OPENAI_API_KEY=sk-...

# Inngest
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

### Run Locally

```bash
npm run dev
```

Application runs at: `http://localhost:8080`

### Database Migrations

Apply Supabase migrations to set up the schema including friction scores, behavioral profiles, and RLS policies:

```bash
npx supabase db push
```

---

## 7. Reproducing Research Results

All simulation results are deterministic and fully reproducible using the scripts in `research/`. For a complete step-by-step guide, see [`md/tests_reproducibility.md`](md/tests_reproducibility.md).

### Quick Reference

| Result | Script | Command |
| :--- | :--- | :--- |
| Table I (Cohort Stats) | `fintrac_simulation_final.py` + `extract_results.py` | `python research/fintrac_simulation_final.py && python research/extract_results.py` |
| Table II (Ablation) | `verify_ablation_thresholds.py` | `python research/verify_ablation_thresholds.py` |
| IEEE Figures (1-6) | `ieee_figures_and_tables.py` | `python research/ieee_figures_and_tables.py` |
| Academic Figures | `fintrac_paper_figures.py` | `python research/fintrac_paper_figures.py` |
| RL Unit Tests | `runFrictionUpdatesTests.ts` | `npx ts-node src/lib/ai/runFrictionUpdatesTests.ts` |

**Expected key outputs:**

- RL Month 12 Retention: **97.08%** | Traditional: **63.54%**
- Compliance: RL **41.63%** vs Traditional **38.61%** (t = 55.86, p < 0.001)
- Behavioral Cost: RL **115.22** vs Traditional **115.75** (t = -3.61, p < 0.001, d = -0.02)
- Seed stability SD: **0.20%** across 5 seeds

---

## 8. Documentation Index

All markdown documentation (except this README) is organized in the [`md/`](md/) folder:

| Document | Description |
| :--- | :--- |
| [`simulation_monthly_data.md`](md/simulation_monthly_data.md) | Month-by-month compliance, behavioral cost & friction arrays |
| [`tests_reproducibility.md`](md/tests_reproducibility.md) | Step-by-step reproduction guide for all tables and figures |
| [`simulation_documentation_1.md`](md/simulation_documentation_1.md) | Full POMDP results, ablation study, seed stability & threats to validity |
| [`simulation_documentation_2.md`](md/simulation_documentation_2.md) | IEEE figure generation methodology |
| [`simulation_documentation_3.md`](md/simulation_documentation_3.md) | Learning rate sensitivity analysis |
| [`clerk_supabase_architecture.md`](md/clerk_supabase_architecture.md) | Clerk + Supabase federation & RLS implementation |
| [`features_06_06_2026.md`](md/features_06_06_2026.md) | Exhaustive feature & module technical documentation |
| [`implementation.md`](md/implementation.md) | End-to-end implementation log |
| [`walkthrough.md`](md/walkthrough.md) | Summary walkthrough of all major changes |

---

## 9. Author

**Zaid Saifi**

- GitHub: [github.com/zaid1234-11](https://github.com/zaid1234-11)
- LinkedIn: [linkedin.com/in/zaidsaifiai](https://www.linkedin.com/in/zaidsaifiai)

---

## 10. License

This project is open-source and available under the [MIT License](LICENSE).

---

<div align="center">

*Built with rigorous behavioral science, production-grade engineering, and a belief that sustainable savings should feel natural — not punishing.*

</div>
