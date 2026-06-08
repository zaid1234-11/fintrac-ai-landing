import pandas as pd
import numpy as np

# ---------------------------------------------------------
# 1. Configuration (Deterministic Seed)
# ---------------------------------------------------------
np.random.seed(42)
NUM_USERS = 5000
MONTHS = 12
CATEGORIES = ['Dining', 'Shopping', 'Subscriptions', 'Entertainment']
BASE_TARGET_SAVINGS = 200.0
LEARNING_RATE_ALPHA = 0.15

# Personas designed to test specific algorithmic weaknesses
# Income_Shock kills Traditional. Seasonal_Spender kills Static.
PERSONAS = ['Aspirational_Saver', 'Income_Shock', 'Seasonal_Spender']

def get_true_user_friction(persona):
    if persona == 'Aspirational_Saver': return {'Dining': 0.7, 'Shopping': 0.7, 'Subscriptions': 0.8, 'Entertainment': 0.7}
    elif persona == 'Income_Shock': return {'Dining': 0.5, 'Shopping': 0.3, 'Subscriptions': 0.9, 'Entertainment': 0.5}
    else: return {'Dining': 0.5, 'Shopping': 0.2, 'Subscriptions': 0.8, 'Entertainment': 0.5}

# ---------------------------------------------------------
# 2. Parallel Ablation Simulation
# ---------------------------------------------------------
def run_ablation_study():
    users = pd.DataFrame({
        'user_id': range(1, NUM_USERS + 1),
        'persona': np.random.choice(PERSONAS, NUM_USERS, p=[0.4, 0.3, 0.3])
    })
    
    print(f"Running Corrected Ablation Experiment (N={NUM_USERS})...")

    # Tracking active users
    active_trad = np.ones(NUM_USERS, dtype=bool)
    active_static = np.ones(NUM_USERS, dtype=bool)
    active_rl = np.ones(NUM_USERS, dtype=bool)
    
    churn_streak_trad = np.zeros(NUM_USERS)
    churn_streak_static = np.zeros(NUM_USERS)
    churn_streak_rl = np.zeros(NUM_USERS)
    
    # Internal Models
    model_static = [get_true_user_friction(p) for p in users['persona']] 
    model_rl = [{cat: 0.5 for cat in CATEGORIES} for _ in range(NUM_USERS)] 
    true_frictions = [get_true_user_friction(p) for p in users['persona']]
    
    for month in range(1, MONTHS + 1):
        for idx, row in users.iterrows():
            persona = row['persona']
            target = BASE_TARGET_SAVINGS
            
            # --- DYNAMIC LIFE EVENTS ---
            if persona == 'Income_Shock':
                if month == 6:
                    # +0.15 friction spike
                    true_frictions[idx] = {k: min(0.99, v + 0.15) for k, v in true_frictions[idx].items()}
                if month >= 6:
                    target *= 0.5
            elif persona == 'Seasonal_Spender':
                if month == 11:
                    true_frictions[idx]['Shopping'] = 0.95 # Sudden rigidity
                elif month == 12: 
                    true_frictions[idx]['Shopping'] = 0.2  # Recovery
            
            true_fric = true_frictions[idx]

            # --- ALLOCATOR & COMPLIANCE ENGINE ---
            def execute_allocator(weights, active_flag, churn_streak, is_rl=False):
                if not active_flag: return False, churn_streak
                
                total_w = sum(weights.values())
                cuts = {cat: target * (w / total_w) for cat, w in weights.items()}
                
                total_actual = 0
                
                for cat in CATEGORIES:
                    base_comp = max(0.0, 1.0 - true_fric[cat])
                    if persona == 'Aspirational_Saver': base_comp += (month * 0.02)
                    
                    actual = cuts[cat] * np.clip(base_comp + np.random.normal(0, 0.05), 0, 1)
                    total_actual += actual
                    
                    # RL UPDATE (Noisy observation per category)
                    if is_rl:
                        # If asked to cut < $1, compliance is inherently 100% (agent successfully avoided it)
                        if cuts[cat] < 1.0:
                            obs_comp = 1.0
                        else:
                            obs_comp = np.clip((actual / cuts[cat]) + np.random.normal(0, 0.05), 0, 1)
                            
                        if obs_comp < 0.95:
                            model_rl[idx][cat] = min(0.99, model_rl[idx][cat] + LEARNING_RATE_ALPHA * (1 - obs_comp) * 1.5)
                        else:
                            model_rl[idx][cat] = max(0.01, model_rl[idx][cat] - 0.05)

                # Total Savings Compliance
                aggregate_compliance = total_actual / target
                
                # Churn if aggregate compliance falls below 45%
                churn_streak = churn_streak + 1 if aggregate_compliance < 0.45 else 0
                return (churn_streak < 3), churn_streak

            # 1. Traditional (Equal Weights)
            w_trad = {cat: 1.0 for cat in CATEGORIES}
            active_trad[idx], churn_streak_trad[idx] = execute_allocator(w_trad, active_trad[idx], churn_streak_trad[idx])
            
            # 2. Static Friction (Perfect Prior, No Update)
            w_static = {cat: (1.0 - max(0.01, model_static[idx][cat]))**2 for cat in CATEGORIES}
            active_static[idx], churn_streak_static[idx] = execute_allocator(w_static, active_static[idx], churn_streak_static[idx])
            
            # 3. Adaptive RL (Uninformed Prior, Active Update)
            w_rl = {cat: (1.0 - max(0.01, model_rl[idx][cat]))**2 for cat in CATEGORIES}
            active_rl[idx], churn_streak_rl[idx] = execute_allocator(w_rl, active_rl[idx], churn_streak_rl[idx], is_rl=True)

    print("\n=== ABLATION RESULTS (MONTH 12 RETENTION) ===")
    print(f"Traditional:       {(active_trad.sum() / NUM_USERS) * 100:.2f}%")
    print(f"Static Friction:   {(active_static.sum() / NUM_USERS) * 100:.2f}%")
    print(f"Adaptive RL:       {(active_rl.sum() / NUM_USERS) * 100:.2f}%")

run_ablation_study()
