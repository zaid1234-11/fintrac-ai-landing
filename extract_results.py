import pandas as pd
import numpy as np
from scipy import stats

# Load data
df = pd.read_csv("fintrac_study_final.csv")

# Filter out recovery tracker rows for standard metric calculations
df_standard = df[df['category'] != 'RECOVERY_TRACKER']

# 1. User Retention (Survival Rate) at Month 12
total_users = df['user_id'].nunique()
# Count users with records in Month 12
active_trad_m12 = df_standard[(df_standard['algorithm'] == 'Traditional') & (df_standard['month'] == 12)]['user_id'].nunique()
active_rl_m12 = df_standard[(df_standard['algorithm'] == 'Elastic_RL') & (df_standard['month'] == 12)]['user_id'].nunique()

retention_trad = (active_trad_m12 / total_users) * 100
retention_rl = (active_rl_m12 / total_users) * 100

active_months_trad = df_standard[df_standard['algorithm'] == 'Traditional'].groupby('user_id')['month'].nunique()
active_months_rl = df_standard[df_standard['algorithm'] == 'Elastic_RL'].groupby('user_id')['month'].nunique()

print("=== RETENTION & SURVIVAL ANALYSIS ===")
print(f"Traditional Proportional Retention at Month 12: {retention_trad:.2f}% ({active_trad_m12}/{total_users})")
print(f"Elastic RL Retention at Month 12: {retention_rl:.2f}% ({active_rl_m12}/{total_users})")
print(f"Relative Improvement in Retention: {((retention_rl - retention_trad) / retention_trad) * 100:.2f}%")
print(f"Average Active Months per User: RL = {active_months_rl.mean():.2f} months, Trad = {active_months_trad.mean():.2f} months\n")

# 2. Monthly Behavioral Cost and Compliance per user (across all months they were active)
monthly_user_stats = df_standard.groupby(['user_id', 'algorithm', 'month']).agg({
    'compliance': 'mean',
    'behavioral_cost': 'sum'
}).reset_index()

# Arrays for T-test
rl_cost = monthly_user_stats[monthly_user_stats['algorithm'] == 'Elastic_RL']['behavioral_cost']
trad_cost = monthly_user_stats[monthly_user_stats['algorithm'] == 'Traditional']['behavioral_cost']

rl_comp = monthly_user_stats[monthly_user_stats['algorithm'] == 'Elastic_RL']['compliance']
trad_comp = monthly_user_stats[monthly_user_stats['algorithm'] == 'Traditional']['compliance']

# T-Tests
t_stat_cost, p_val_cost = stats.ttest_ind(rl_cost, trad_cost)
t_stat_comp, p_val_comp = stats.ttest_ind(rl_comp, trad_comp)

# Cohen's d
d_cost = (rl_cost.mean() - trad_cost.mean()) / np.sqrt((rl_cost.std()**2 + trad_cost.std()**2) / 2)
d_comp = (rl_comp.mean() - trad_comp.mean()) / np.sqrt((rl_comp.std()**2 + trad_comp.std()**2) / 2)

print("=== STATISTICAL VALIDATION OF CORE METRICS ===")
print(f"Behavioral Cost: RL Mean={rl_cost.mean():.2f} (SD={rl_cost.std():.2f}), Trad Mean={trad_cost.mean():.2f} (SD={trad_cost.std():.2f}) | t={t_stat_cost:.2f} | p={p_val_cost:.4e} | Cohen's d={d_cost:.2f}")
print(f"Compliance Ratio: RL Mean={rl_comp.mean()*100:.2f}% (SD={rl_comp.std()*100:.2f}%), Trad Mean={trad_comp.mean()*100:.2f}% (SD={trad_comp.std()*100:.2f}%) | t={t_stat_comp:.2f} | p={p_val_comp:.4e} | Cohen's d={d_comp:.2f}\n")

# 3. Relative Recovery for Income Shock Persona under Elastic RL
# Extract recovery trackers
recovery_df = df[df['category'] == 'RECOVERY_TRACKER']
total_income_shocks = recovery_df['user_id'].nunique()
recovered_users = recovery_df[recovery_df['target'].notna()]
num_recovered = recovered_users['user_id'].nunique()
mean_recovery_month = recovered_users['target'].astype(float).mean()

recovery_rate = (num_recovered / total_income_shocks) * 100

print("=== RELATIVE RECOVERY ANALYSIS (INCOME SHOCK PERSONA) ===")
print(f"Total Income Shock Users: {total_income_shocks}")
print(f"Recovered Users under Elastic RL: {num_recovered} ({recovery_rate:.2f}%)")
print(f"Mean Month of Recovery: {mean_recovery_month:.2f} (Shock occurred at Month 6)")
