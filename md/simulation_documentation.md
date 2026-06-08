# FinTrac AI - Simulation & Validation Documentation

This document compiles the empirical results and mathematical foundations of the simulation framework used to validate the **Elastic Reinforcement Learning (RL) Savings Engine**. It describes both the main **Mild Shock POMDP Simulation** (comparing Elastic RL vs. Traditional Proportional Budgeting) and the **Ablation Study** (comparing Traditional, Static Friction-Aware, and Adaptive RL).

---

## 1. Experimental Parameters & Cohort Characterization

To ensure rigorous validation, the platform's behavior is simulated on a cohort of $N = 5,000$ synthetic users over a $T = 12$ month horizon.

### 1.1 Cohort Personas
Users are distributed across three realistic personas representing distinct behavioral patterns and constraints:
1. **Aspirational Savers ($40\%$)**: Moderate initial friction with a gradual baseline recovery (compliance increases by $0.02$ per month to model habit formation).
2. **Income Shock Victims ($30\%$)**: At Month 6, these users experience a mild financial disruption, causing their true behavioral friction to increase by $+0.10$ and their monthly savings target to reduce by $25\%$ ($target \times 0.75$).
3. **Seasonal Spenders ($30\%$)**: Experience temporary, severe spending rigidity in specific categories during holiday periods (e.g., Shopping friction surges to $0.95$ in Month 11, then resets to $0.5$ in Month 12).

### 1.2 Partially Observable Markov Decision Process (POMDP) Model
Real-world budgeting systems do not have perfect access to the user's psychological state or true intent. The simulation models this incomplete visibility using:
- **Observation Noise**: Gaussian noise $\mathcal{N}(0, 0.05)$ is added to the compliance signal observed by the optimization engine during updates.
- **Transactional Execution Noise**: Gaussian noise $\mathcal{N}(0, 0.10)$ is added to the actual spending compliance, representing everyday financial variations.

### 1.3 User Churn & Retention Rules
- **Fatigue Threshold**: If a user's average compliance across all budget categories falls below $30\%$ ($\text{compliance} < 0.30$) for **three consecutive months**, the user is assumed to have abandoned the tool (permanently flagged as churned).
- **Survival Tracking**: The retention rate is measured as the ratio of active users in Month 12 to the initial cohort size ($N = 5,000$).

---

## 2. Mild Shock POMDP Simulation Results

This simulation compares the **Elastic RL Engine** (Treatment) directly against **Traditional Proportional Budgeting** (Control). Under Traditional budgeting, savings cuts are divided equally across all categories regardless of user friction. Under Elastic RL, cuts are allocated inversely proportional to squared friction weights and updated monthly.

### 2.1 Cohort Statistics Summary

| Metric | Treatment (Elastic RL) | Control (Traditional) | Performance Delta | Statistical Significance |
| :--- | :---: | :---: | :---: | :---: |
| **Month 12 Retention Rate** | $97.08\%$ | $63.54\%$ | $+33.54\%$ (absolute) | $\chi^2(1) = 1723.1, p < 0.001$ |
| **Mean Active Lifespan** | $11.78$ months | $9.56$ months | $+2.22$ months ($+23.2\%$) | $t(9821) = 52.12, p < 0.001$ |
| **Mean Compliance Ratio** | $41.63\%$ ($\text{SD} = 8.05\%$) | $38.61\%$ ($\text{SD} = 9.60\%$) | $+3.02\%$ ($+7.8\%$) | $t = 55.86, p < 0.001$, $d = 0.34$ |
| **Mean Monthly Behavioral Cost (Pain)** | $115.22$ ($\text{SD} = 27.34$) | $115.75$ ($\text{SD} = 18.65$) | $-0.53$ | $t = -3.61, p < 0.001$, $d = -0.02$ |

> [!NOTE]
> Even with **survival bias** affecting the control group (where the highest-friction, highest-pain Traditional users churned early and removed their data points from the active averages), the Elastic RL engine achieved a statistically significant reduction in behavioral cost ($p < 0.001$).

### 2.2 Post-Shock Resilience & Recovery
For the $1,497$ users subjected to the **Income Shock** persona:
- **Relative Recovery** is defined as returning to $\ge 90\%$ of their personal pre-shock baseline compliance (established during Months 1–5) for two consecutive months.
- **Recovery Rate**: **14.43%** ($216$ users) achieved full recovery.
- **Mean Month of Recovery**: **Month 9.66** (3.66 months post-shock).

---

## 3. The Ablation Study

To evaluate the contribution of active reinforcement learning versus static knowledge, we compared three distinct system states:
1. **Traditional Budgeting**: No initial friction knowledge (equal weights) and no active learning.
2. **Static Friction-Aware**: Perfect initial friction knowledge (starts with the user's true baseline) but no active learning (cannot adapt to shocks or habit changes).
3. **Adaptive RL Engine**: No initial friction knowledge (starts at a $0.5$ uninformed prior) but active learning (adapts to shocks and habits via Q-learning updates).

### 3.1 Ablation Study Results
The ablation experiment was run under a deterministic seed (`42`) with $N = 5,000$ users over a $12$-month period.

| System Architecture | Initial Prior | Learning Enabled | Month 12 Retention Rate |
| :--- | :---: | :---: | :---: |
| **1. Traditional** | Equal Weights ($1.0$) | No | **52.88%** |
| **2. Static Friction-Aware** | Perfect True Baseline | No | **71.14%** |
| **3. Adaptive RL Engine** | Uninformed Prior ($0.5$) | Yes | **96.42%** |


---

## 4. Discussion: Why Dynamic Adaptation Beats Perfect Profiling

The results from the ablation study demonstrate a critical principle in behavioral financial modeling: **dynamic adaptation is more important than initial profiling.**

1. **The Static Trap**: Even when initialized with perfect, omniscient knowledge of the user's true baseline friction, a static allocator cannot adjust. When the user experiences an income shock (Month 6) or seasonal spending surges (Month 11), the static profile becomes outdated. The system continues to demand cuts in categories that have become psychologically rigid, causing compliance to drop and leading to user churn.
2. **The Self-Correction Advantage**: The Adaptive RL Engine begins with a completely uninformed prior (all category frictions set to $0.5$). However, because it actively updates friction scores based on monthly compliance signals, it quickly maps out which categories are rigid or elastic. More importantly, when shocks occur, it automatically increases friction weights for affected categories, routing future cuts to more elastic areas.
3. **Implications**: Digital wealth management tools should prioritize closed-loop feedback systems that learn from user behaviors in real-time, rather than relying on heavy front-loaded profiling (e.g., initial risk/personality questionnaires) which quickly become obsolete under real-world financial pressure.

---

## 5. Reference Files
- Main Simulation Script: [fintrac_simulation_final.py](file:///C:/Users/zaids/.gemini/antigravity/scratch/fintrac-ai-landing/fintrac_simulation_final.py)
- Results Extractor: [extract_results.py](file:///C:/Users/zaids/.gemini/antigravity/scratch/fintrac-ai-landing/extract_results.py)
- Ablation Study Script: [fintrac_ablation_experiment.py](file:///C:/Users/zaids/.gemini/antigravity/scratch/fintrac-ai-landing/fintrac_ablation_experiment.py)
- Features Documentation: [features_06_06_2026.md](file:///C:/Users/zaids/.gemini/antigravity/scratch/fintrac-ai-landing/features_06_06_2026.md)
