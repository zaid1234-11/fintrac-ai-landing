# FinTrac AI - Simulation & Test Reproducibility Guide

This document details the exact files, settings, and commands required to reproduce the simulation tables, validation results, and mathematical unit tests for FinTrac AI. All simulation scripts use deterministic random seeding (`np.random.seed(42)`) to ensure perfect replication of empirical results.

---

## 1. Simulation Validation & Results (Table I)

### Executing the Simulation Loop
The full $5,000$-user Partially Observable Markov Decision Process (POMDP) simulation runs via:
* **File:** [fintrac_simulation_final.py](file:///C:/Users/zaids/.gemini/antigravity/scratch/fintrac-ai-landing/fintrac_simulation_final.py)
* **Command:** `python fintrac_simulation_final.py`
* **Output:** Generates `fintrac_study_final.csv` containing raw transactional records.

### Compiling Table I (Cohort Performance Metrics)
To parse the output CSV and compute survival rates, active lifespan, compliance means, behavioral costs, t-tests ($p$-values), Cohen's $d$, and recovery metrics:
* **File:** [extract_results.py](file:///C:/Users/zaids/.gemini/antigravity/scratch/fintrac-ai-landing/extract_results.py)
* **Command:** `python extract_results.py`
* **Expected Output:**
  - Traditional Retention (Month 12): **63.54%**
  - Elastic RL Retention (Month 12): **97.08%**
  - Average Active Lifespan: RL = **11.78** months, Trad = **9.56** months
  - Behavioral Cost ($P_t$): RL Mean = **115.22**, Trad Mean = **115.75** ($t = -3.61$, $p < 0.001$)
  - Compliance Ratio: RL Mean = **41.63%**, Trad Mean = **38.61%** ($t = 55.86$, $p < 0.001$)
  - Income Shock Recovery: **14.43%** (Mean Month of Recovery: **9.66**)

---

## 2. Ablation Studies (Table II)

To reproduce the retention rates comparing Traditional, Static Friction-Aware, and Adaptive RL models across both the $0.33$ and $0.30$ churn fatigue thresholds:
* **File:** [verify_ablation_thresholds.py](file:///C:/Users/zaids/.gemini/antigravity/brain/174f7e64-ede5-4546-97f9-1bc55d70a804/scratch/verify_ablation_thresholds.py)
* **Command:** `python verify_ablation_thresholds.py`
* **Expected Output Matrix:**
  - **0.33 Churn Threshold:** Traditional = **55.36%**, Static = **59.64%**, Adaptive RL = **87.26%**
  - **0.30 Churn Threshold:** Traditional = **62.82%**, Static = **68.58%**, Adaptive RL = **97.90%**

---

## 3. Academic Plot & Figure Generation

To regenerate the publication-ready visualization charts:
* **File:** [fintrac_paper_figures.py](file:///C:/Users/zaids/.gemini/antigravity/scratch/fintrac-ai-landing/fintrac_paper_figures.py)
* **Command:** `python fintrac_paper_figures.py`
* **Expected Output Files:**
  - `fintrac_km_survival.png` (Figure 1: Kaplan-Meier Survival Curves)
  - `fintrac_sensitivity_alpha.png` (Figure 2: Learning Rate Sensitivity curves)
  - `fintrac_retention_distribution.png` (Figure 4: Seed Stability Distribution boxplot)
  - `fintrac_ablation_study.png` (Figure 5: Ablation Comparison bar chart)

---

## 4. Mathematical Unit Tests (RL Update Logic)

To run the deterministic assertions verifying the Q-learning weight updates, consecutive failure streak penalties, zero resets, and habit decay thresholds:
* **File:** [runFrictionUpdatesTests.ts](file:///C:/Users/zaids/.gemini/antigravity/scratch/fintrac-ai-landing/src/lib/ai/runFrictionUpdatesTests.ts)
* **Command:** `npx ts-node src/lib/ai/runFrictionUpdatesTests.ts`
* **Expected Output:** Console logs indicating that all 6 test scenarios (Cold Start, Consecutive failure, Zero reset, Compliance month 1, Compliance month 2, and Cooldown decay) passed successfully.
