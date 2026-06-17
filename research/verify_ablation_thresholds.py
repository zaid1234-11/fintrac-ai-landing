import pandas as pd
import numpy as np

NUM_USERS = 5000
MONTHS = 12
CATEGORIES = ['Dining', 'Shopping', 'Subscriptions', 'Entertainment']
BASE_TARGET_SAVINGS = 200.0
LEARNING_RATE_ALPHA = 0.10
PERSONAS = ['Aspirational_Saver', 'Income_Shock', 'Seasonal_Spender']
PERSONA_PROBS = [0.4, 0.3, 0.3]

def get_true_user_friction(persona):
    if persona == 'Aspirational_Saver':
        return {'Dining': 0.7, 'Shopping': 0.7, 'Subscriptions': 0.8, 'Entertainment': 0.7}
    elif persona == 'Income_Shock':
        return {'Dining': 0.5, 'Shopping': 0.5, 'Subscriptions': 0.7, 'Entertainment': 0.5}
    else:
        return {'Dining': 0.5, 'Shopping': 0.3, 'Subscriptions': 0.8, 'Entertainment': 0.5}

def run_simulation(seed, alpha, churn_threshold):
    np.random.seed(seed)
    
    users = pd.DataFrame({
        'user_id': range(1, NUM_USERS + 1),
        'persona': np.random.choice(PERSONAS, NUM_USERS, p=PERSONA_PROBS)
    })
    
    active_trad = np.ones(NUM_USERS, dtype=bool)
    active_static = np.ones(NUM_USERS, dtype=bool)
    active_rl = np.ones(NUM_USERS, dtype=bool)
    
    churn_streak_trad = np.zeros(NUM_USERS)
    churn_streak_static = np.zeros(NUM_USERS)
    churn_streak_rl = np.zeros(NUM_USERS)
    
    model_static = [get_true_user_friction(p) for p in users['persona']]
    model_rl = [{cat: 0.5 for cat in CATEGORIES} for _ in range(NUM_USERS)]
    
    true_frictions_trad = [get_true_user_friction(p) for p in users['persona']]
    true_frictions_static = [get_true_user_friction(p) for p in users['persona']]
    true_frictions_rl = [get_true_user_friction(p) for p in users['persona']]
    
    habit_streaks_rl = [{cat: 0 for cat in CATEGORIES} for _ in range(NUM_USERS)]
    
    for month in range(1, MONTHS + 1):
        for idx, row in users.iterrows():
            persona = row['persona']
            
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
                churn_streak_trad[idx] = churn_streak_trad[idx] + 1 if aggregate_compliance < churn_threshold else 0
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
                churn_streak_static[idx] = churn_streak_static[idx] + 1 if aggregate_compliance < churn_threshold else 0
                if churn_streak_static[idx] >= 3:
                    active_static[idx] = False
            
            # 3. Adaptive RL (Uninformed Prior, Active Update)
            if active_rl[idx]:
                current_target_rl = BASE_TARGET_SAVINGS
                if persona == 'Income_Shock':
                    if month == 6:
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
                for cat in CATEGORIES:
                    base_comp = max(0.0, 1.0 - true_frictions_rl[idx][cat])
                    if persona == 'Aspirational_Saver':
                        base_comp += (month * 0.02)
                    
                    actual = cuts[cat] * np.clip(base_comp + np.random.normal(0, 0.10), 0, 1)
                    total_actual += actual
                    
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
                churn_streak_rl[idx] = churn_streak_rl[idx] + 1 if aggregate_compliance < churn_threshold else 0
                if churn_streak_rl[idx] >= 3:
                    active_rl[idx] = False

    return {
        'Traditional': (active_trad.sum() / NUM_USERS) * 100,
        'Static': (active_static.sum() / NUM_USERS) * 100,
        'Adaptive_RL': (active_rl.sum() / NUM_USERS) * 100
    }

print("Running with 0.33 threshold...")
res_33 = run_simulation(seed=42, alpha=0.10, churn_threshold=0.33)
print(res_33)

print("Running with 0.30 threshold...")
res_30 = run_simulation(seed=42, alpha=0.10, churn_threshold=0.30)
print(res_30)
