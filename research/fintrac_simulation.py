import pandas as pd
import numpy as np
from scipy import stats
import matplotlib.pyplot as plt
import seaborn as sns

# ---------------------------------------------------------
# 1. Configuration & Setup
# ---------------------------------------------------------
np.random.seed(42)
NUM_USERS = 1000
MONTHS = 6
CATEGORIES = ['Dining', 'Shopping', 'Subscriptions', 'Entertainment']
TARGET_MONTHLY_SAVINGS = 200.0
LEARNING_RATE_ALPHA = 0.15

PERSONAS = ['Balanced', 'Impulse_Shopper', 'Rigid_Creature']

# Set aesthetic style for publication-ready graphs
sns.set_theme(style="whitegrid", context="paper", font_scale=1.2)

# ---------------------------------------------------------
# 2. Simulation Logic
# ---------------------------------------------------------
def initialize_user_base():
    """Generates the baseline user cohort."""
    return pd.DataFrame({
        'user_id': range(1, NUM_USERS + 1),
        'persona': np.random.choice(PERSONAS, NUM_USERS, p=[0.5, 0.3, 0.2])
    })

def get_baseline_friction(persona):
    if persona == 'Impulse_Shopper': return {'Dining': 0.6, 'Shopping': 0.1, 'Subscriptions': 0.9, 'Entertainment': 0.4}
    elif persona == 'Rigid_Creature': return {'Dining': 0.8, 'Shopping': 0.8, 'Subscriptions': 0.9, 'Entertainment': 0.7}
    else: return {'Dining': 0.5, 'Shopping': 0.5, 'Subscriptions': 0.8, 'Entertainment': 0.5}

def run_ab_simulation():
    users_df = initialize_user_base()
    records = []

    for _, user in users_df.iterrows():
        uid, persona = user['user_id'], user['persona']
        
        # We run the exact same user through TWO parallel realities
        frictions_RL = get_baseline_friction(persona)
        frictions_TRAD = get_baseline_friction(persona) # Traditional friction doesn't update, but we track it to calculate pain
        
        for month in range(1, MONTHS + 1):
            # --- ALGORITHM A: TRADITIONAL PROPORTIONAL ---
            # Cuts are distributed evenly across all 4 categories ($50 each)
            trad_cuts = {cat: TARGET_MONTHLY_SAVINGS / len(CATEGORIES) for cat in CATEGORIES}
            
            for cat in CATEGORIES:
                # User is less likely to comply if the blind cut hits a high friction area
                base_comp_trad = max(0.0, 1.0 - frictions_TRAD[cat])
                actual_trad = trad_cuts[cat] * np.clip(base_comp_trad + np.random.normal(0, 0.1), 0, 1)
                pain_trad = actual_trad * frictions_TRAD[cat]
                compliance_trad = np.clip(actual_trad / trad_cuts[cat], 0, 1) if trad_cuts[cat] >= 0.1 else 1.0
                
                records.append({
                    'user_id': uid, 'persona': persona, 'month': month, 'category': cat,
                    'algorithm': 'Traditional', 'predicted_cut': trad_cuts[cat],
                    'actual_cut': actual_trad, 'compliance': compliance_trad,
                    'behavioral_cost': pain_trad, 'friction_score': frictions_TRAD[cat]
                })

            # --- ALGORITHM B: ELASTIC RL ENGINE ---
            # Cuts distributed inversely to squared friction
            weights = {cat: (1.0 - max(0.01, frictions_RL[cat]))**2 for cat in CATEGORIES}
            total_weight = sum(weights.values())
            if total_weight > 0.0001:
                rl_cuts = {cat: TARGET_MONTHLY_SAVINGS * (w / total_weight) for cat, w in weights.items()}
            else:
                rl_cuts = {cat: TARGET_MONTHLY_SAVINGS / len(CATEGORIES) for cat in CATEGORIES}
            
            for cat in CATEGORIES:
                base_comp_rl = max(0.0, 1.0 - frictions_RL[cat])
                actual_rl = rl_cuts[cat] * np.clip(base_comp_rl + np.random.normal(0, 0.1), 0, 1)
                pain_rl = actual_rl * frictions_RL[cat]
                compliance_rl = np.clip(actual_rl / rl_cuts[cat], 0, 1) if rl_cuts[cat] >= 0.1 else 1.0
                
                # RL Update Rule
                if compliance_rl < 0.99:
                    penalty = LEARNING_RATE_ALPHA * (1.0 - compliance_rl) * 1.5 # Using simplified 1.5x streak for simulation
                    new_fric = min(1.0, frictions_RL[cat] + penalty)
                else:
                    new_fric = max(0.0, frictions_RL[cat] - 0.05) # 3-month decay simplified
                    
                records.append({
                    'user_id': uid, 'persona': persona, 'month': month, 'category': cat,
                    'algorithm': 'Elastic_RL', 'predicted_cut': rl_cuts[cat],
                    'actual_cut': actual_rl, 'compliance': compliance_rl,
                    'behavioral_cost': pain_rl, 'friction_score': frictions_RL[cat]
                })
                frictions_RL[cat] = new_fric

    return pd.DataFrame(records)

# ---------------------------------------------------------
# 3. Execution & Statistical Analysis
# ---------------------------------------------------------
print("Running Monte Carlo Simulation (1000 users, 6 months)...")
df = run_ab_simulation()
df.to_csv("fintrac_rl_simulation_results.csv", index=False)

# Aggregate monthly stats per user per algorithm
monthly_user_stats = df.groupby(['user_id', 'algorithm', 'month']).agg({
    'compliance': 'mean',
    'behavioral_cost': 'sum',
    'actual_cut': 'sum'
}).reset_index()

# Extract arrays for independent T-Tests
rl_cost = monthly_user_stats[monthly_user_stats['algorithm'] == 'Elastic_RL']['behavioral_cost']
trad_cost = monthly_user_stats[monthly_user_stats['algorithm'] == 'Traditional']['behavioral_cost']

rl_comp = monthly_user_stats[monthly_user_stats['algorithm'] == 'Elastic_RL']['compliance']
trad_comp = monthly_user_stats[monthly_user_stats['algorithm'] == 'Traditional']['compliance']

rl_sav = monthly_user_stats[monthly_user_stats['algorithm'] == 'Elastic_RL']['actual_cut']
trad_sav = monthly_user_stats[monthly_user_stats['algorithm'] == 'Traditional']['actual_cut']

# T-Tests
t_stat_cost, p_val_cost = stats.ttest_ind(rl_cost, trad_cost)
t_stat_comp, p_val_comp = stats.ttest_ind(rl_comp, trad_comp)
t_stat_sav, p_val_sav = stats.ttest_ind(rl_sav, trad_sav)

# Cohen's d
d_cost = (rl_cost.mean() - trad_cost.mean()) / np.sqrt((rl_cost.std()**2 + trad_cost.std()**2) / 2)
d_comp = (rl_comp.mean() - trad_comp.mean()) / np.sqrt((rl_comp.std()**2 + trad_comp.std()**2) / 2)
d_sav = (rl_sav.mean() - trad_sav.mean()) / np.sqrt((rl_sav.std()**2 + trad_sav.std()**2) / 2)

print("\n=== STATISTICAL VALIDATION ===")
print(f"Behavioral Cost: RL Mean={rl_cost.mean():.2f}, Trad Mean={trad_cost.mean():.2f} | p={p_val_cost:.4e} | Cohen's d={d_cost:.2f}")
print(f"Compliance: RL Mean={rl_comp.mean()*100:.1f}%, Trad Mean={trad_comp.mean()*100:.1f}% | p={p_val_comp:.4e} | Cohen's d={d_comp:.2f}")
print(f"Actual Savings Achieved: RL Mean=Rs.{rl_sav.mean():.2f}, Trad Mean=Rs.{trad_sav.mean():.2f} | p={p_val_sav:.4e} | Cohen's d={d_sav:.2f}")

# ---------------------------------------------------------
# 4. Academic Figure Generation
# ---------------------------------------------------------
fig, axes = plt.subplots(1, 3, figsize=(18, 5))

# Fig 1: Compliance Over Time
sns.lineplot(data=monthly_user_stats, x='month', y='compliance', hue='algorithm', marker='o', ax=axes[0])
axes[0].set_title('Mean Savings Compliance over 6 Months')
axes[0].set_ylabel('Compliance Ratio')

# Fig 2: Behavioral Cost Reduction
sns.barplot(data=monthly_user_stats, x='month', y='behavioral_cost', hue='algorithm', ax=axes[1])
axes[1].set_title('Aggregate Behavioral Cost (Pain)')
axes[1].set_ylabel('Cost Units')

# Fig 3: Friction Convergence (Proof of Self-Healing)
# Filtering for Impulse Shoppers tracking the Shopping category
impulse_shopping = df[(df['persona'] == 'Impulse_Shopper') & (df['category'] == 'Shopping') & (df['algorithm'] == 'Elastic_RL')]
sns.lineplot(data=impulse_shopping, x='month', y='friction_score', marker='s', color='purple', ax=axes[2])
axes[2].set_title('Adaptive Friction Convergence (Shopping)')
axes[2].set_ylabel('Friction Score (0 to 1)')
axes[2].set_ylim(0, 1)

plt.tight_layout()
plt.savefig("fintrac_research_figures.png", dpi=300)
print("\nGenerated high-resolution figures: 'fintrac_research_figures.png'")
