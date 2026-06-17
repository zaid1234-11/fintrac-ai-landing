import pandas as pd
import numpy as np

# ---------------------------------------------------------
# 1. Configuration: 5,000 Users, 12 Months (FROZEN)
# ---------------------------------------------------------
np.random.seed(42)
NUM_USERS = 5000
MONTHS = 12
CATEGORIES = ['Dining', 'Shopping', 'Subscriptions', 'Entertainment']
BASE_TARGET_SAVINGS = 200.0
LEARNING_RATE_ALPHA = 0.10

PERSONAS = ['Aspirational_Saver', 'Income_Shock', 'Seasonal_Spender']

def initialize_user_base():
    return pd.DataFrame({
        'user_id': range(1, NUM_USERS + 1),
        'persona': np.random.choice(PERSONAS, NUM_USERS, p=[0.4, 0.3, 0.3])
    })

def get_true_user_friction(persona):
    if persona == 'Aspirational_Saver': return {'Dining': 0.7, 'Shopping': 0.7, 'Subscriptions': 0.8, 'Entertainment': 0.7}
    elif persona == 'Income_Shock': return {'Dining': 0.5, 'Shopping': 0.5, 'Subscriptions': 0.7, 'Entertainment': 0.5}
    else: return {'Dining': 0.5, 'Shopping': 0.3, 'Subscriptions': 0.8, 'Entertainment': 0.5}

# ---------------------------------------------------------
# 2. Parallel Dynamic Simulation
# ---------------------------------------------------------
def run_final_simulation():
    users_df = initialize_user_base()
    records = []
    
    print(f"Running Final Study 2.5 (Noisy POMDP & Relative Recovery). {NUM_USERS} users...")

    for _, user in users_df.iterrows():
        uid, persona = user['user_id'], user['persona']
        
        true_friction_trad = get_true_user_friction(persona)
        true_friction_rl = get_true_user_friction(persona)
        model_friction_rl = {cat: 0.5 for cat in CATEGORIES} # Uninformed prior
        
        habit_streaks_rl = {cat: 0 for cat in CATEGORIES}
        churn_streak_rl, churn_streak_trad = 0, 0
        active_trad, active_rl = True, True
        
        # Personalized Baseline Tracking
        historical_comp_rl = []
        pre_shock_baseline_rl = None
        recovery_streak_rl = 0
        recovered_month_rl = None
        
        for month in range(1, MONTHS + 1):
            current_target = BASE_TARGET_SAVINGS
            
            # --- DYNAMIC LIFE EVENTS (Mild Shock) ---
            if persona == 'Income_Shock':
                if month == 6:
                    # Lock in baseline before shock
                    pre_shock_baseline_rl = np.mean(historical_comp_rl) if historical_comp_rl else 0.8
                    
                    # MILD SHOCK: +0.10 Friction Spike (instead of 0.15)
                    true_friction_trad = {k: min(0.99, v + 0.10) for k, v in true_friction_trad.items()}
                    true_friction_rl = {k: min(0.99, v + 0.10) for k, v in true_friction_rl.items()}
                    
                if month >= 6:
                    # MILD SHOCK: Retain 75% capacity (instead of 50%)
                    current_target *= 0.75 

            if persona == 'Seasonal_Spender':
                if month == 11:
                    true_friction_trad['Shopping'] = 0.95
                    true_friction_rl['Shopping'] = 0.95
                elif month == 12: 
                    true_friction_trad['Shopping'] = 0.5
                    true_friction_rl['Shopping'] = 0.5

            # --- ALGORITHM A: TRADITIONAL ---
            if active_trad:
                trad_cuts = {cat: current_target / len(CATEGORIES) for cat in CATEGORIES}
                avg_comp_trad = 0
                
                for cat in CATEGORIES:
                    base_comp = max(0.0, 1.0 - true_friction_trad[cat])
                    actual = trad_cuts[cat] * np.clip(base_comp + np.random.normal(0, 0.1), 0, 1)
                    comp_ratio = actual / max(0.01, trad_cuts[cat])
                    avg_comp_trad += comp_ratio
                    pain = trad_cuts[cat] * true_friction_trad[cat]
                    
                    records.append({
                        'user_id': uid, 'persona': persona, 'month': month, 'category': cat,
                        'algorithm': 'Traditional', 'target': trad_cuts[cat], 
                        'compliance': comp_ratio, 'behavioral_cost': pain
                    })
                
                if (avg_comp_trad / len(CATEGORIES)) < 0.3:
                    churn_streak_trad += 1
                else:
                    churn_streak_trad = 0
                    
                if churn_streak_trad >= 3:
                    active_trad = False 

            # --- ALGORITHM B: ELASTIC RL ENGINE ---
            if active_rl:
                weights = {cat: (1.0 - max(0.01, model_friction_rl[cat]))**2 for cat in CATEGORIES}
                total_weight = sum(weights.values())
                if total_weight > 0.0001:
                    rl_cuts = {cat: current_target * (w / total_weight) for cat, w in weights.items()}
                else:
                    rl_cuts = {cat: current_target / len(CATEGORIES) for cat in CATEGORIES}
                
                avg_comp_rl = 0
                
                for cat in CATEGORIES:
                    base_comp = max(0.0, 1.0 - true_friction_rl[cat])
                    if persona == 'Aspirational_Saver': base_comp += (month * 0.02) 

                    # True Human Action
                    actual = rl_cuts[cat] * np.clip(base_comp + np.random.normal(0, 0.1), 0, 1)
                    true_comp_ratio = actual / max(0.01, rl_cuts[cat])
                    avg_comp_rl += true_comp_ratio
                    pain = rl_cuts[cat] * true_friction_rl[cat]
                    
                    # Agent Observation (NOISY)
                    observation_noise = np.random.normal(0, 0.05)
                    observed_comp = np.clip(true_comp_ratio + observation_noise, 0, 1)
                    
                    # RL Update uses NOISY OBSERVATION
                    if observed_comp < 0.95:
                        habit_streaks_rl[cat] = 0
                        penalty = LEARNING_RATE_ALPHA * (1.0 - observed_comp) * 1.5 
                        model_friction_rl[cat] = min(0.99, model_friction_rl[cat] + penalty)
                    else:
                        habit_streaks_rl[cat] += 1
                        model_friction_rl[cat] = max(0.01, model_friction_rl[cat] - 0.05)
                        if habit_streaks_rl[cat] >= 3:
                            true_friction_rl[cat] = max(0.01, true_friction_rl[cat] - 0.05)
                            
                    records.append({
                        'user_id': uid, 'persona': persona, 'month': month, 'category': cat,
                        'algorithm': 'Elastic_RL', 'target': rl_cuts[cat], 
                        'compliance': true_comp_ratio, 'behavioral_cost': pain
                    })
                
                avg_monthly_comp_rl = avg_comp_rl / len(CATEGORIES)
                if month < 6: historical_comp_rl.append(avg_monthly_comp_rl)
                
                # Churn Logic
                if avg_monthly_comp_rl < 0.3:
                    churn_streak_rl += 1
                else:
                    churn_streak_rl = 0
                    
                if churn_streak_rl >= 3:
                    active_rl = False 
                    
                # Relative Recovery Tracking (90% of Pre-Shock Baseline)
                if persona == 'Income_Shock' and month > 6 and active_rl and pre_shock_baseline_rl:
                    if avg_monthly_comp_rl >= (0.90 * pre_shock_baseline_rl):
                        recovery_streak_rl += 1
                        if recovery_streak_rl == 2 and recovered_month_rl is None:
                            recovered_month_rl = month
                    else:
                        recovery_streak_rl = 0

            if month == MONTHS and persona == 'Income_Shock':
                 records.append({'user_id': uid, 'persona': persona, 'month': month, 'category': 'RECOVERY_TRACKER', 'algorithm': 'Elastic_RL', 'target': recovered_month_rl, 'compliance': 0, 'behavioral_cost': 0})

    return pd.DataFrame(records)

df_final = run_final_simulation()
df_final.to_csv("fintrac_study_final.csv", index=False)
print("Simulation Complete. Time to extract results.")
