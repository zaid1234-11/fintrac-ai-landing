import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats

# ---------------------------------------------------------
# Configuration & Constants (Frozen for reproducibility)
# ---------------------------------------------------------
NUM_USERS = 5000
MONTHS = 12
CATEGORIES = ['Dining', 'Shopping', 'Subscriptions', 'Entertainment']
BASE_TARGET_SAVINGS = 200.0
PERSONAS = ['Aspirational_Saver', 'Income_Shock', 'Seasonal_Spender']
PERSONA_PROBS = [0.4, 0.3, 0.3]

def get_true_user_friction(persona):
    if persona == 'Aspirational_Saver':
        return {'Dining': 0.7, 'Shopping': 0.7, 'Subscriptions': 0.8, 'Entertainment': 0.7}
    elif persona == 'Income_Shock':
        return {'Dining': 0.5, 'Shopping': 0.5, 'Subscriptions': 0.7, 'Entertainment': 0.5}
    else: # Seasonal_Spender
        return {'Dining': 0.5, 'Shopping': 0.3, 'Subscriptions': 0.8, 'Entertainment': 0.5}

# Set styling for publication-ready figures
sns.set_theme(style="whitegrid", context="paper", font_scale=1.2)
plt.rcParams.update({
    'font.family': 'sans-serif',
    'axes.labelsize': 12,
    'axes.titlesize': 14,
    'xtick.labelsize': 11,
    'ytick.labelsize': 11,
    'figure.titlesize': 16,
    'legend.fontsize': 11
})

# Color palette corresponding to academic tones
COLOR_TRAD = '#1E3A8A'  # Navy
COLOR_STATIC = '#0D9488'  # Teal
COLOR_RL = '#6D28D9'  # Royal Purple

# ---------------------------------------------------------
# Core Simulation Engine (Aligned with fintrac_simulation_final.py)
# ---------------------------------------------------------
def run_simulation(seed, alpha):
    """
    Runs the complete parallel cohort simulation for a given seed and learning rate alpha.
    Tracks active user counts per month and performance metrics for the Adaptive RL model.
    """
    np.random.seed(seed)
    
    # Initialize cohort
    users = pd.DataFrame({
        'user_id': range(1, NUM_USERS + 1),
        'persona': np.random.choice(PERSONAS, NUM_USERS, p=PERSONA_PROBS)
    })
    
    # Trackers for active state and churn streaks
    active_trad = np.ones(NUM_USERS, dtype=bool)
    active_static = np.ones(NUM_USERS, dtype=bool)
    active_rl = np.ones(NUM_USERS, dtype=bool)
    
    churn_streak_trad = np.zeros(NUM_USERS)
    churn_streak_static = np.zeros(NUM_USERS)
    churn_streak_rl = np.zeros(NUM_USERS)
    
    # Internal models
    model_static = [get_true_user_friction(p) for p in users['persona']]
    model_rl = [{cat: 0.5 for cat in CATEGORIES} for _ in range(NUM_USERS)]
    
    true_frictions_trad = [get_true_user_friction(p) for p in users['persona']]
    true_frictions_static = [get_true_user_friction(p) for p in users['persona']]
    true_frictions_rl = [get_true_user_friction(p) for p in users['persona']]
    
    # Metrics to track monthly survival counts
    survival_counts = {
        'month': list(range(0, MONTHS + 1)),
        'Traditional': [NUM_USERS],
        'Static': [NUM_USERS],
        'Adaptive_RL': [NUM_USERS]
    }
    
    # Metric accumulators for Adaptive RL
    rl_user_compliance_history = {uid: [] for uid in range(1, NUM_USERS + 1)}
    rl_user_pre_shock_baseline = {}
    rl_user_recovered = np.zeros(NUM_USERS, dtype=bool)
    rl_user_recovery_streak = np.zeros(NUM_USERS)
    
    rl_active_months_compliance = []
    rl_active_months_pain = []
    
    habit_streaks_rl = [{cat: 0 for cat in CATEGORIES} for _ in range(NUM_USERS)]
    
    for month in range(1, MONTHS + 1):
        for idx, row in users.iterrows():
            persona = row['persona']
            uid = row['user_id']
            
            # 1. Traditional (Equal Weights)
            if active_trad[idx]:
                current_target_trad = BASE_TARGET_SAVINGS
                if persona == 'Income_Shock':
                    if month == 6:
                        true_frictions_trad[idx] = {k: min(0.99, v + 0.10) for k, v in true_frictions_trad[idx].items()}
                    if month >= 6:
                        current_target_trad *= 0.75
                elif persona == 'Seasonal_Spender':
                    if month == 11:
                        true_frictions_trad[idx]['Shopping'] = 0.95
                    elif month == 12:
                        true_frictions_trad[idx]['Shopping'] = 0.5
                
                cuts = {cat: current_target_trad / 4 for cat in CATEGORIES}
                total_actual = 0
                for cat in CATEGORIES:
                    base_comp = max(0.0, 1.0 - true_frictions_trad[idx][cat])
                    actual = cuts[cat] * np.clip(base_comp + np.random.normal(0, 0.10), 0, 1)
                    total_actual += actual
                aggregate_compliance = total_actual / current_target_trad
                churn_streak_trad[idx] = churn_streak_trad[idx] + 1 if aggregate_compliance < 0.30 else 0
                if churn_streak_trad[idx] >= 3:
                    active_trad[idx] = False
            
            # 2. Static Friction (Perfect Prior, No Update)
            if active_static[idx]:
                current_target_static = BASE_TARGET_SAVINGS
                if persona == 'Income_Shock':
                    if month == 6:
                        true_frictions_static[idx] = {k: min(0.99, v + 0.10) for k, v in true_frictions_static[idx].items()}
                    if month >= 6:
                        current_target_static *= 0.75
                elif persona == 'Seasonal_Spender':
                    if month == 11:
                        true_frictions_static[idx]['Shopping'] = 0.95
                    elif month == 12:
                        true_frictions_static[idx]['Shopping'] = 0.5
                
                weights = {cat: (1.0 - max(0.01, model_static[idx][cat]))**2 for cat in CATEGORIES}
                total_w = sum(weights.values())
                cuts = {cat: current_target_static * (w / total_w) for cat, w in weights.items()}
                total_actual = 0
                for cat in CATEGORIES:
                    base_comp = max(0.0, 1.0 - true_frictions_static[idx][cat])
                    actual = cuts[cat] * np.clip(base_comp + np.random.normal(0, 0.10), 0, 1)
                    total_actual += actual
                aggregate_compliance = total_actual / current_target_static
                churn_streak_static[idx] = churn_streak_static[idx] + 1 if aggregate_compliance < 0.30 else 0
                if churn_streak_static[idx] >= 3:
                    active_static[idx] = False
            
            # 3. Adaptive RL (Uninformed Prior, Active Update)
            if active_rl[idx]:
                current_target_rl = BASE_TARGET_SAVINGS
                if persona == 'Income_Shock':
                    if month == 6:
                        history = rl_user_compliance_history[uid]
                        rl_user_pre_shock_baseline[uid] = np.mean(history) if history else 0.8
                        true_frictions_rl[idx] = {k: min(0.99, v + 0.10) for k, v in true_frictions_rl[idx].items()}
                    if month >= 6:
                        current_target_rl *= 0.75
                elif persona == 'Seasonal_Spender':
                    if month == 11:
                        true_frictions_rl[idx]['Shopping'] = 0.95
                    elif month == 12:
                        true_frictions_rl[idx]['Shopping'] = 0.5
                
                weights = {cat: (1.0 - max(0.01, model_rl[idx][cat]))**2 for cat in CATEGORIES}
                total_w = sum(weights.values())
                cuts = {cat: current_target_rl * (w / total_w) for cat, w in weights.items()}
                
                total_actual = 0
                total_pain = 0
                
                for cat in CATEGORIES:
                    base_comp = max(0.0, 1.0 - true_frictions_rl[idx][cat])
                    if persona == 'Aspirational_Saver':
                        base_comp += (month * 0.02)
                    
                    actual = cuts[cat] * np.clip(base_comp + np.random.normal(0, 0.10), 0, 1)
                    total_actual += actual
                    total_pain += cuts[cat] * true_frictions_rl[idx][cat]
                    
                    # RL Update using noisy observation
                    obs_comp = np.clip((actual / max(0.01, cuts[cat])) + np.random.normal(0, 0.05), 0, 1)
                    if obs_comp < 0.95:
                        habit_streaks_rl[idx][cat] = 0
                        penalty = alpha * (1.0 - obs_comp) * 1.5
                        model_rl[idx][cat] = min(0.99, model_rl[idx][cat] + penalty)
                    else:
                        habit_streaks_rl[idx][cat] += 1
                        model_rl[idx][cat] = max(0.01, model_rl[idx][cat] - 0.05)
                        if habit_streaks_rl[idx][cat] >= 3:
                            true_frictions_rl[idx][cat] = max(0.01, true_frictions_rl[idx][cat] - 0.05)
                
                aggregate_compliance = total_actual / current_target_rl
                rl_active_months_compliance.append(aggregate_compliance)
                rl_active_months_pain.append(total_pain)
                
                if month < 6:
                    rl_user_compliance_history[uid].append(aggregate_compliance)
                
                churn_streak_rl[idx] = churn_streak_rl[idx] + 1 if aggregate_compliance < 0.30 else 0
                if churn_streak_rl[idx] >= 3:
                    active_rl[idx] = False
                
                # Post-shock recovery tracking
                if persona == 'Income_Shock' and month > 6 and active_rl[idx] and uid in rl_user_pre_shock_baseline:
                    baseline = rl_user_pre_shock_baseline[uid]
                    if aggregate_compliance >= (0.90 * baseline):
                        rl_user_recovery_streak[idx] += 1
                        if rl_user_recovery_streak[idx] >= 2:
                            rl_user_recovered[idx] = True
                    else:
                        rl_user_recovery_streak[idx] = 0
        
        # Save active counts at the end of the month
        survival_counts['Traditional'].append(int(active_trad.sum()))
        survival_counts['Static'].append(int(active_static.sum()))
        survival_counts['Adaptive_RL'].append(int(active_rl.sum()))
        
    retention_rl = (active_rl.sum() / NUM_USERS) * 100
    retention_trad = (active_trad.sum() / NUM_USERS) * 100
    retention_static = (active_static.sum() / NUM_USERS) * 100
    
    income_shock_mask = (users['persona'] == 'Income_Shock').values
    total_income_shock = int(income_shock_mask.sum())
    recovered_income_shock = int(rl_user_recovered[income_shock_mask].sum())
    recovery_rate_rl = (recovered_income_shock / total_income_shock) * 100 if total_income_shock > 0 else 0.0
    
    mean_compliance_rl = float(np.mean(rl_active_months_compliance)) * 100 if rl_active_months_compliance else 0.0
    mean_pain_rl = float(np.mean(rl_active_months_pain)) if rl_active_months_pain else 0.0
    
    return {
        'retention_trad': retention_trad,
        'retention_static': retention_static,
        'retention_rl': retention_rl,
        'survival_counts': survival_counts,
        'rl_metrics': {
            'retention': retention_rl,
            'recovery_rate': recovery_rate_rl,
            'compliance': mean_compliance_rl,
            'behavioral_cost': mean_pain_rl
        }
    }

# ---------------------------------------------------------
# Execution: Step 1. Generate Kaplan-Meier & Ablation Plots
# ---------------------------------------------------------
print("Generating Kaplan-Meier and Ablation graphs (Seed=42, alpha=0.10)...")
res_base = run_simulation(seed=42, alpha=0.10)
counts = res_base['survival_counts']

# Figure 1: Kaplan-Meier Survival Curves
plt.figure(figsize=(8, 5))
months = counts['month']
# Convert counts to probabilities (out of 1.0)
prob_trad = [c / NUM_USERS for c in counts['Traditional']]
prob_static = [c / NUM_USERS for c in counts['Static']]
prob_rl = [c / NUM_USERS for c in counts['Adaptive_RL']]

plt.step(months, prob_trad, where='post', label='Traditional Budgeting (Control)', color=COLOR_TRAD, linestyle='--', linewidth=2)
plt.step(months, prob_static, where='post', label='Static Friction-Aware', color=COLOR_STATIC, linestyle='-.', linewidth=2)
plt.step(months, prob_rl, where='post', label='Adaptive RL Engine (Treatment)', color=COLOR_RL, linestyle='-', linewidth=2.5)

plt.title('Figure 1: Kaplan-Meier User Survival Curves', fontsize=14, pad=15)
plt.xlabel('Timeline (Months)', fontsize=12)
plt.ylabel('Survival Probability (Retention)', fontsize=12)
plt.xlim(0, 12)
plt.ylim(0.4, 1.02)
plt.xticks(range(0, 13))
plt.legend(loc='lower left', frameon=True)
plt.tight_layout()
plt.savefig("fintrac_km_survival.png", dpi=300)
plt.close()
print("Saved 'fintrac_km_survival.png'")

# Figure 5: Ablation Study Comparison Bar Chart
plt.figure(figsize=(7, 5))
models = ['Traditional', 'Static Friction-Aware', 'Adaptive RL Engine']
retentions = [res_base['retention_trad'], res_base['retention_static'], res_base['retention_rl']]
bars = plt.bar(models, retentions, color=[COLOR_TRAD, COLOR_STATIC, COLOR_RL], width=0.5)

plt.title('Figure 5: Ablation Study Comparison (Month 12)', fontsize=14, pad=15)
plt.ylabel('Month 12 User Retention (%)', fontsize=12)
plt.ylim(0, 110)
for bar in bars:
    height = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2.0, height + 2, f'{height:.2f}%', ha='center', va='bottom', fontsize=11, fontweight='bold')
    
plt.tight_layout()
plt.savefig("fintrac_ablation_study.png", dpi=300)
plt.close()
print("Saved 'fintrac_ablation_study.png'")

# ---------------------------------------------------------
# Execution: Step 2. Stability Analysis (Multiple Seeds)
# ---------------------------------------------------------
seeds = [1, 42, 123, 999, 2026]
stability_retentions = []
print("\nRunning Random Seed Stability Analysis...")
for s in seeds:
    res = run_simulation(seed=s, alpha=0.10)
    ret = res['rl_metrics']['retention']
    stability_retentions.append(ret)
    print(f"  Seed {s:4d} | Adaptive RL Retention: {ret:.2f}%")

mean_ret = np.mean(stability_retentions)
sd_ret = np.std(stability_retentions)
print(f"Stability Results: Mean = {mean_ret:.2f}%, SD = {sd_ret:.2f}%")

# Figure 4: Retention Distribution Across Seeds Boxplot
plt.figure(figsize=(5, 5))
sns.boxplot(y=stability_retentions, color='#D8B4FE', width=0.3, fliersize=6)
sns.stripplot(y=stability_retentions, color=COLOR_RL, size=8, jitter=0.05, linewidth=1, edgecolor='black')
plt.title('Figure 4: Retention Distribution (5 Seeds)', fontsize=14, pad=15)
plt.ylabel('Month 12 User Retention (%)', fontsize=12)
# Add statistical annotation text
plt.text(0.1, mean_ret, f'Mean: {mean_ret:.2f}%\nSD: {sd_ret:.2f}%', ha='left', va='center', fontsize=11, bbox=dict(facecolor='white', alpha=0.8, boxstyle='round,pad=0.5'))
plt.xlim(-0.5, 0.8)
plt.tight_layout()
plt.savefig("fintrac_retention_distribution.png", dpi=300)
plt.close()
print("Saved 'fintrac_retention_distribution.png'")

# ---------------------------------------------------------
# Execution: Step 3. Sensitivity Analysis (Learning Rate alpha)
# ---------------------------------------------------------
alphas = [0.05, 0.10, 0.15, 0.20]
sensitivity_results = []
print("\nRunning Learning Rate Sensitivity Sweep...")
for a in alphas:
    res = run_simulation(seed=42, alpha=a)
    metrics = res['rl_metrics']
    sensitivity_results.append({
        'alpha': a,
        'retention': metrics['retention'],
        'recovery_rate': metrics['recovery_rate'],
        'compliance': metrics['compliance'],
        'behavioral_cost': metrics['behavioral_cost']
    })
    print(f"  alpha {a:.2f} | Retention: {metrics['retention']:.2f}% | Recovery: {metrics['recovery_rate']:.2f}% | Compliance: {metrics['compliance']:.2f}% | Pain: {metrics['behavioral_cost']:.2f}")

sens_df = pd.DataFrame(sensitivity_results)

# Figure 2: Learning Rate (alpha) Sensitivity Analysis Curves
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# Subplot 1: Month 12 Retention
axes[0, 0].plot(sens_df['alpha'], sens_df['retention'], marker='o', color=COLOR_RL, linewidth=2)
axes[0, 0].set_title('Month 12 User Retention (%)')
axes[0, 0].set_xlabel('Learning Rate ($\\alpha$)')
axes[0, 0].set_ylabel('Retention (%)')
axes[0, 0].set_xticks(alphas)
axes[0, 0].set_ylim(min(sens_df['retention']) - 2, max(sens_df['retention']) + 2)

# Subplot 2: Income Shock Recovery Rate
axes[0, 1].plot(sens_df['alpha'], sens_df['recovery_rate'], marker='s', color='#EC4899', linewidth=2)
axes[0, 1].set_title('Income Shock Recovery Rate (%)')
axes[0, 1].set_xlabel('Learning Rate ($\\alpha$)')
axes[0, 1].set_ylabel('Recovery Rate (%)')
axes[0, 1].set_xticks(alphas)
axes[0, 1].set_ylim(min(sens_df['recovery_rate']) - 2, max(sens_df['recovery_rate']) + 2)

# Subplot 3: Mean Compliance Ratio
axes[1, 0].plot(sens_df['alpha'], sens_df['compliance'], marker='^', color=COLOR_STATIC, linewidth=2)
axes[1, 0].set_title('Mean Savings Compliance Ratio (%)')
axes[1, 0].set_xlabel('Learning Rate ($\\alpha$)')
axes[1, 0].set_ylabel('Compliance (%)')
axes[1, 0].set_xticks(alphas)
axes[1, 0].set_ylim(min(sens_df['compliance']) - 1, max(sens_df['compliance']) + 1)

# Subplot 4: Mean Monthly Behavioral Cost (Pain)
axes[1, 1].plot(sens_df['alpha'], sens_df['behavioral_cost'], marker='d', color='#F59E0B', linewidth=2)
axes[1, 1].set_title('Mean Monthly Behavioral Cost (Pain)')
axes[1, 1].set_xlabel('Learning Rate ($\\alpha$)')
axes[1, 1].set_ylabel('Pain Units')
axes[1, 1].set_xticks(alphas)
axes[1, 1].set_ylim(min(sens_df['behavioral_cost']) - 2, max(sens_df['behavioral_cost']) + 2)

plt.suptitle('Figure 2: Learning Rate ($\\alpha$) Sensitivity Analysis', y=0.98, fontsize=16)
plt.tight_layout(rect=[0, 0, 1, 0.95])
plt.savefig("fintrac_sensitivity_alpha.png", dpi=300)
plt.close()
print("Saved 'fintrac_sensitivity_alpha.png'")

print("\nAll figures generated and saved successfully.")
