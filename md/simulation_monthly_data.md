# FinTrac AI - Empirically Accurate Monthly Simulation Data Arrays

This document contains the exact month-by-month simulation data arrays for both the **Adaptive Reinforcement Learning (RL)** model and the **Traditional** budget-coaching model. 

These empirical arrays were generated under the baseline experimental settings:
* **Deterministic Seed:** `42`
* **Learning Rate ($\alpha$):** `0.15`
* **User Cohort size ($N$):** `5,000` users
* **Simulation duration ($T$):** `12` months
* **Churn Fatigue Threshold:** `0.30`

---

## 1. Cohort Compliance Rates (%)

The compliance rate represents the average percentage of users' actual spending relative to their assigned budgets. Lower rates indicate better adherence to target budgets.

| Month | Adaptive RL Compliance (%) | Traditional Model Compliance (%) |
| :--- | :---: | :---: |
| **Month 1** | 39.54 | 38.63 |
| **Month 2** | 41.70 | 38.68 |
| **Month 3** | 44.89 | 38.67 |
| **Month 4** | 48.44 | 40.26 |
| **Month 5** | 50.09 | 40.87 |
| **Month 6** | 47.18 | 37.79 |
| **Month 7** | 46.80 | 38.58 |
| **Month 8** | 45.43 | 38.85 |
| **Month 9** | 44.23 | 39.12 |
| **Month 10**| 44.10 | 39.61 |
| **Month 11**| 39.47 | 32.81 |
| **Month 12**| 43.76 | 37.90 |

---

## 2. Behavioral Cost (Pain Units)

Behavioral cost measures the psychological friction and pain experienced by users as they curtail spending. The RL model aims to minimize this cost over time.

| Month | Adaptive RL Behavioral Cost | Traditional Model Behavioral Cost |
| :--- | :---: | :---: |
| **Month 1** | 122.76 | 122.76 |
| **Month 2** | 119.94 | 122.76 |
| **Month 3** | 115.31 | 122.76 |
| **Month 4** | 109.29 | 119.38 |
| **Month 5** | 107.70 | 118.16 |
| **Month 6** | 105.11 | 111.97 |
| **Month 7** | 107.26 | 110.00 |
| **Month 8** | 111.83 | 108.71 |
| **Month 9** | 115.88 | 107.61 |
| **Month 10**| 117.67 | 106.47 |
| **Month 11**| 128.77 | 120.20 |
| **Month 12**| 121.54 | 109.51 |

---

## 3. Friction Convergence ($\hat{F}_t$ per category)

Estimated friction ($\hat{F}_t$) convergence tracks how the RL agent learns and adapts to user friction across different budget categories. Values converge to a cap of `0.99` representing maximum tolerance.

| Month | Dining | Shopping | Subscriptions | Entertainment |
| :--- | :---: | :---: | :---: | :---: |
| **Month 1** | 0.6289 | 0.6157 | 0.6709 | 0.6288 |
| **Month 2** | 0.7556 | 0.7293 | 0.8407 | 0.7559 |
| **Month 3** | 0.8797 | 0.8393 | 0.9779 | 0.8799 |
| **Month 4** | 0.9618 | 0.9092 | 0.9900 | 0.9622 |
| **Month 5** | 0.9884 | 0.9424 | 0.9900 | 0.9886 |
| **Month 6** | 0.9900 | 0.9629 | 0.9900 | 0.9900 |
| **Month 7** | 0.9900 | 0.9781 | 0.9900 | 0.9900 |
| **Month 8** | 0.9900 | 0.9861 | 0.9900 | 0.9900 |
| **Month 9** | 0.9900 | 0.9888 | 0.9900 | 0.9900 |
| **Month 10**| 0.9900 | 0.9895 | 0.9900 | 0.9900 |
| **Month 11**| 0.9900 | 0.9900 | 0.9900 | 0.9900 |
| **Month 12**| 0.9900 | 0.9900 | 0.9900 | 0.9900 |

---

## 4. Programmatic JSON Data (Copy-Paste Ready)

```json
{
  "months": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  "compliance_rl_pct": [39.54, 41.7, 44.89, 48.44, 50.09, 47.18, 46.8, 45.43, 44.23, 44.1, 39.47, 43.76],
  "compliance_trad_pct": [38.63, 38.68, 38.67, 40.26, 40.87, 37.79, 38.58, 38.85, 39.12, 39.61, 32.81, 37.9],
  "behavioral_cost_rl": [122.76, 119.94, 115.31, 109.29, 107.7, 105.11, 107.26, 111.83, 115.88, 117.67, 128.77, 121.54],
  "behavioral_cost_trad": [122.76, 122.76, 122.76, 119.38, 118.16, 111.97, 110.0, 108.71, 107.61, 106.47, 120.2, 109.51],
  "friction_rl": {
    "Dining": [0.6289, 0.7556, 0.8797, 0.9618, 0.9884, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99],
    "Shopping": [0.6157, 0.7293, 0.8393, 0.9092, 0.9424, 0.9629, 0.9781, 0.9861, 0.9888, 0.9895, 0.99, 0.99],
    "Subscriptions": [0.6709, 0.8407, 0.9779, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99],
    "Entertainment": [0.6288, 0.7559, 0.8799, 0.9622, 0.9886, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99]
  }
}
```
