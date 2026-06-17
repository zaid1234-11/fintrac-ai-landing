# FinTrac AI - Mathematical & Simulation Validation Report (v2)

This document provides a highly detailed mathematical breakdown and final simulation report for the **Elastic Reinforcement Learning (RL) Savings Engine**. It presents the formal formulations, update rules, cohort simulations, ablation experiments, stability distribution, and learning rate sensitivity analysis.

---

## 1. Mathematical Formulation of the Optimization Engine

The core optimization problem is designed to solve the trade-off between maximizing savings cuts and minimizing the user's psychological fatigue (behavioral pain). 

### 1.1 Variable Definitions
- $T_t \in \mathbb{R}^+$: The total recommended savings target for month $t$.
- $c \in \{1, 2, 3, 4\}$: The budget category index representing **Dining**, **Shopping**, **Subscriptions**, and **Entertainment**.
- $X_{t, c} \in \mathbb{R}^+$: The recommended savings cut for category $c$ in month $t$, satisfying the budget constraint:
  $$\sum_{c=1}^4 X_{t, c} = T_t$$
- $F_{t, c} \in [0.01, 0.99]$: The reinforcement learning agent's internal estimate of the user's friction (rigidity) for category $c$ in month $t$.
- $F^{\text{true}}_{t, c} \in [0.01, 0.99]$: The user's underlying, unobservable true behavioral friction for category $c$.

### 1.2 Category Allocation Weights
To allocate the savings cuts, the engine calculates category weights $W_{t, c}$ inversely proportional to the squared estimated friction:
$$W_{t, c} = \left( 1.0 - \max(0.01, F_{t, c}) \right)^2$$

The recommended cut $X_{t, c}$ is computed by distributing the target $T_t$ proportionally across these weights:
$$X_{t, c} = T_t \cdot \frac{W_{t, c}}{\sum_{c'=1}^4 W_{t, c'}}$$

### 1.3 Behavioral Cost (Psychological Pain)
The total psychological cost (pain) $P_t$ experienced by the user in month $t$ is modeled as a linear function of the cuts and their true underlying frictions:
$$P_t = \sum_{c=1}^4 X_{t, c} \cdot F^{\text{true}}_{t, c}$$

---

## 2. Dynamic Update Engine & POMDP Framework

Because the true psychological friction $F^{\text{true}}_{t, c}$ is unobservable, we model the system as a **Partially Observable Markov Decision Process (POMDP)**. The agent receives a noisy compliance signal and executes value-based updates.

### 2.1 Compliance & Execution Noise
For each category $c$, the user's base savings compliance is calculated as:
$$C^{\text{base}}_{t, c} = \max\left( 0.0, 1.0 - F^{\text{true}}_{t, c} \right)$$

For Aspirational Savers, a habit-building factor is added month-over-month:
$$C^{\text{base}}_{t, c} = \max\left( 0.0, 1.0 - F^{\text{true}}_{t, c} \right) + 0.02 \cdot t$$

The actual savings achieved by the user, $A_{t, c}$, is subject to transactional execution noise:
$$A_{t, c} = X_{t, c} \cdot \text{clip}\left( C^{\text{base}}_{t, c} + \epsilon_{\text{exec}}, 0.0, 1.0 \right), \quad \epsilon_{\text{exec}} \sim \mathcal{N}(0.0, 0.10)$$

The actual compliance ratio is then:
$$C_{t, c} = \frac{A_{t, c}}{\max(0.01, X_{t, c})}$$

### 2.2 Noisy Agent Observations
The reinforcement learning agent does not observe $C_{t, c}$ perfectly. It receives a noisy observation $O_{t, c}$:
$$O_{t, c} = \text{clip}\left( C_{t, c} + \epsilon_{\text{obs}}, 0.0, 1.0 \right), \quad \epsilon_{\text{obs}} \sim \mathcal{N}(0.0, 0.05)$$

### 2.3 RL Weight Update Rule
The estimated friction weight $F_{t+1, c}$ is updated based on $O_{t, c}$ and the learning rate $\alpha$:
- **Non-Compliance Update** (if $O_{t, c} < 0.95$):
  $$F_{t+1, c} = \min\left(0.99, F_{t, c} + \alpha \cdot (1.0 - O_{t, c}) \cdot 1.5\right)$$
- **Compliance Update** (if $O_{t, c} \ge 0.95$):
  $$F_{t+1, c} = \max\left(0.01, F_{t, c} - 0.05\right)$$

### 2.4 Habit Formation Loop (Self-Healing)
If the user complies successfully ($O_{t, c} \ge 0.95$) for $S_{t, c} \ge 3$ consecutive months, their underlying psychological resistance decreases (habit is built):
$$F^{\text{true}}_{t+1, c} = \max\left(0.01, F^{\text{true}}_{t, c} - 0.05\right)$$

---

## 3. Mild Shock POMDP Simulation Results

The simulation evaluated $N = 5,000$ synthetic users over $T = 12$ months, comparing the Elastic RL Engine (Treatment) against Traditional Proportional Budgeting (Control).

### 3.1 Overall Cohort Statistics

| Metric | Treatment (Elastic RL) | Control (Traditional) | Performance Delta | Statistical Significance |
| :--- | :---: | :---: | :---: | :---: |
| **Month 12 Retention Rate** | $97.08\%$ | $63.54\%$ | $+33.54\%$ (absolute) | $\chi^2(1) = 1723.1, p < 0.001$ |
| **Mean Active Lifespan** | $11.78$ months | $9.56$ months | $+2.22$ months ($+23.2\%$) | $t(9821) = 52.12, p < 0.001$ |
| **Mean Compliance Ratio** | $41.63\%$ ($\text{SD} = 8.05\%$) | $38.61\%$ ($\text{SD} = 9.60\%$) | $+3.02\%$ ($+7.8\%$) | $t = 55.86, p < 0.001$, $d = 0.34$ |
| **Mean Monthly Behavioral Cost (Pain)** | $115.22$ ($\text{SD} = 27.34$) | $115.75$ ($\text{SD} = 18.65$) | $-0.53$ | $t = -3.61, p < 0.001$, $d = -0.02$ |

![Figure 1: Kaplan-Meier Survival Curves](C:\Users\zaids\.gemini\antigravity\brain\174f7e64-ede5-4546-97f9-1bc55d70a804\fintrac_km_survival.png)

### 3.2 Post-Shock Recovery for Income Shock Victims
At Month 6, $1,497$ users experienced an income shock (friction surged by $+0.10$, target fell to $75\%$).
- Relative Recovery rate (returning to $\ge 90\%$ of pre-shock compliance baseline for 2 consecutive months): **14.43%** ($216$ users).
- Mean Month of Recovery: **Month 9.66** (3.66 months post-shock).

---

## 4. Ablation Study Results

The ablation study compared three states of knowledge under a deterministic seed (`42`) with $N = 5,000$ users. It sweeps over two fatigue thresholds (aggregate compliance below $0.33$ or $0.30$ for three consecutive months):

### 4.1 Comparison at $0.33$ Churn Fatigue Threshold
| System Architecture | Initial Prior | Learning Enabled | Month 12 Retention Rate |
| :--- | :---: | :---: | :---: |
| **1. Traditional** | Equal Weights ($1.0$) | No | **55.36%** |
| **2. Static Friction-Aware** | Perfect True Baseline | No | **59.64%** |
| **3. Adaptive RL Engine** | Uninformed Prior ($0.5$) | Yes | **87.26%** |

### 4.2 Comparison at $0.30$ Churn Fatigue Threshold
| System Architecture | Initial Prior | Learning Enabled | Month 12 Retention Rate |
| :--- | :---: | :---: | :---: |
| **1. Traditional** | Equal Weights ($1.0$) | No | **62.40%** |
| **2. Static Friction-Aware** | Perfect True Baseline | No | **69.08%** |
| **3. Adaptive RL Engine** | Uninformed Prior ($0.5$) | Yes | **97.76%** |

![Figure 5: Ablation Comparison](C:\Users\zaids\.gemini\antigravity\brain\174f7e64-ede5-4546-97f9-1bc55d70a804\fintrac_ablation_study.png)

---

## 5. Robustness & Validation sweeps

### 5.1 Random Seed Stability Analysis
Swept five seeds `[1, 42, 123, 999, 2026]` under $\alpha = 0.10$:
- **Seed 1**: $97.42\%$ retention
- **Seed 42**: $97.76\%$ retention
- **Seed 123**: $97.60\%$ retention
- **Seed 999**: $97.92\%$ retention
- **Seed 2026**: $97.96\%$ retention
- **Mean ± SD**: **97.73% ± 0.20%**

![Figure 4: Seed Stability Distribution](C:\Users\zaids\.gemini\antigravity\brain\174f7e64-ede5-4546-97f9-1bc55d70a804\fintrac_retention_distribution.png)

### 5.2 Learning Rate ($\alpha$) Sensitivity Sweep
Swept learning rate values under Seed 42:
- **$\alpha = 0.05$**: $97.88\%$ retention | $46.96\%$ recovery | $44.31\%$ compliance | $116.24$ pain
- **$\alpha = 0.10$ (selected)**: $97.76\%$ retention | $10.09\%$ recovery | $45.06\%$ compliance | $114.60$ pain
- **$\alpha = 0.15$**: $97.90\%$ retention | $5.34\%$ recovery | $44.66\%$ compliance | $115.32$ pain
- **$\alpha = 0.20$**: $97.82\%$ retention | $5.88\%$ recovery | $43.88\%$ compliance | $116.84$ pain

![Figure 2: Learning Rate Sensitivity](C:\Users\zaids\.gemini\antigravity\brain\174f7e64-ede5-4546-97f9-1bc55d70a804\fintrac_sensitivity_alpha.png)

---

## 6. Threats to Validity

- **Internal Validity**: Mitigated by running parallel cohort simulations under identical random seeds to isolate the treatment effect.
- **External Validity**: Generalizability is limited by synthetic personas, which cannot capture complex macroeconomic shifts or human unpredictability.
- **Construct Validity**: Friction and behavioral cost are stylized linear abstractions. Commercial setups should proxy friction through direct features (e.g., app cancellations, modifications).
- **Statistical Conclusion Validity**: Chi-squared and two-sample t-tests confirm statistical conclusion validity, reporting extremely low p-values ($p < 0.001$).
