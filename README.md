# FinTrac AI Landing

A modern AI-powered financial analytics landing page built with Vite, React, TypeScript, and Tailwind CSS.
The project focuses on creating a premium, responsive user experience with clean UI architecture, reusable components, and scalable frontend design patterns.

---

## Live Demo

[Deployment Link](https://fintrac-ai-landing.vercel.app/)

---

## Overview

FinTrac AI Landing is designed as a high-performance SaaS-style landing page and dashboard experience for an AI-driven financial intelligence platform. The application showcases predictive analytics, financial insights, and modern product-focused UI/UX practices.

The goal of this project was to explore:

- scalable frontend architecture
- responsive UI systems
- smooth animations and transitions
- reusable React component design
- modern SaaS landing page development

---

## Tech Stack

### Frontend

- Vite
- React.js
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend / APIs

- REST API-ready structure
- AI finance assistant and analytics flows

### Tools & Platforms

- Git & GitHub
- Vercel Deployment

---

## Features

- Fully responsive modern UI
- Reusable component-based architecture
- Dashboard and analytics screens
- Smooth interactive user experience
- API-ready scalable structure
- Tailwind-based design system
- Mobile-first responsive layouts
- Budgeting, transactions, investment, security, and chatbot pages

---

## Repository Directory Structure

```text
├── md/                         # Exhaustive Project Documentation
│   ├── clerk_supabase_architecture.md
│   ├── feature_documentation_1.md
│   ├── feature_documentation_2.md
│   ├── features_06_06_2026.md
│   ├── implementation.md
│   ├── implementation_plan.md
│   ├── review.md
│   ├── simulation_documentation.md
│   ├── simulation_documentation_1.md
│   ├── simulation_documentation_2.md
│   ├── simulation_documentation_3.md
│   ├── simulation_results_paper.md
│   ├── test_documentation_1.md
│   ├── test_documentation_2.md
│   ├── tests_reproducibility.md
│   ├── walk.md
│   └── walkthrough.md
│
├── research/                   # Simulation, Ablation & Academic Figures
│   ├── extract_results.py              # Aggregates statistics & runs t-tests
│   ├── fintrac_ablation_experiment.py  # Ablation studies codebase
│   ├── fintrac_ablation_study.png       # Figure 5
│   ├── fintrac_km_survival.png          # Figure 1 (Kaplan-Meier Curves)
│   ├── fintrac_paper_figures.py         # Generates academic figures
│   ├── fintrac_research_figures.png     # Figure 3 (Friction Convergence)
│   ├── fintrac_retention_distribution.png # Figure 4 (Stability Boxplot)
│   ├── fintrac_sensitivity_alpha.png    # Figure 2 (Alpha Sweeps)
│   ├── fintrac_simulation.py            # Diagnostic simulation
│   ├── fintrac_simulation_final.py      # Primary 5000-user simulation engine
│   └── verify_ablation_thresholds.py    # Ablation fatigue threshold runs
│
├── scripts/                    # Platform Tooling & Diagnostics
│   └── diagnostic/
│       ├── check-db.js
│       ├── check-db.mjs
│       ├── test-personality-insights.js
│       └── trigger-parse.js
│
├── src/                        # Next.js 14 Frontend Application
│   ├── app/                    # App Router and API Routes (Inngest, Clerk, Supabase)
│   ├── components/             # Reusable UI Components (Dashboard, Simulator, etc.)
│   ├── lib/                    # Core Libraries & AI Logic
│   │   └── ai/
│   │       ├── runFrictionUpdatesTests.ts  # RL updates unit tests
│   │       └── updateFrictionWeights.ts    # Friction optimization engine
│   └── ...
│
├── supabase/                   # Supabase Database Migrations
│   └── migrations/
│       └── 00013_friction_updates.sql  # Cryptographic ledger & RLS schema
│
├── README.md                   # Project Overview
├── package.json                # Project Dependencies
├── tsconfig.json               # TypeScript Configuration
└── next.config.mjs             # Next.js Settings
```

---

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/zaid1234-11/fintrac-ai-landing.git
```

### Navigate to Project Folder

```bash
cd fintrac-ai-landing
```

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Application runs locally at:

```bash
http://localhost:8080
```

---

## Challenges Solved

- Designing a scalable and reusable component structure
- Maintaining responsive layouts across devices
- Optimizing UI rendering performance
- Structuring app state and integrations cleanly
- Building a polished SaaS-style interface using Tailwind CSS

---

## Screenshots

### Hero Section

![FinTrac AI hero section](docs/screenshots/hero-section.png)

### Dashboard / Analytics Sections

![FinTrac AI dashboard analytics](docs/screenshots/dashboard-analytics.png)

### Mobile Responsiveness / Transaction Experience

![FinTrac AI responsive transactions screen](docs/screenshots/transactions-responsive.png)

### Feature Cards / UI Highlights

![FinTrac AI workflow feature cards](docs/screenshots/workflow-feature-cards.png)

The landing page also includes smooth hover states, animated cards, and interactive dashboard highlights across the main user flows.

---

## Future Improvements

- Authentication system
- Real-time analytics integration
- Expanded dashboard functionality
- AI-generated financial reports
- Production API integrations



## Author

Zaid Saifi

- GitHub: [https://github.com/zaid1234-11](https://github.com/zaid1234-11)
- LinkedIn: [www.linkedin.com/in/zaidsaifiai]

---

## License

This project is open-source and available under the MIT License.
