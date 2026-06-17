"""
Multi-Seed Sensitivity Analysis — Lean Version
================================================
Runs each alpha across 10 seeds with a stripped-down simulation
focused only on the 4 metrics needed for Table II.
"""
import numpy as np
import time

NUM_USERS = 5000
MONTHS = 12
CATS = ['Dining', 'Shopping', 'Subscriptions', 'Entertainment']
N_CATS = 4
BASE_TARGET = 200.0
PERSONAS = ['Aspirational_Saver', 'Income_Shock', 'Seasonal_Spender']
P_PROBS = [0.4, 0.3, 0.3]

FRIC = {
    'Aspirational_Saver': [0.7, 0.7, 0.8, 0.7],
    'Income_Shock':       [0.5, 0.5, 0.7, 0.5],
    'Seasonal_Spender':   [0.5, 0.3, 0.8, 0.5],
}

def run_sim(seed, alpha):
    rng = np.random.RandomState(seed)
    personas = rng.choice(PERSONAS, NUM_USERS, p=P_PROBS)
    
    # Pre-compute persona indices
    is_shock = (personas == 'Income_Shock')
    is_seasonal = (personas == 'Seasonal_Spender')
    is_aspirational = (personas == 'Aspirational_Saver')
    
    # Initialize true friction and model friction as arrays [N_USERS, N_CATS]
    tf_rl = np.zeros((NUM_USERS, N_CATS))
    model_rl = np.full((NUM_USERS, N_CATS), 0.5)
    
    for i in range(NUM_USERS):
        tf_rl[i] = FRIC[personas[i]]
    
    tf_trad = tf_rl.copy()
    
    active_rl = np.ones(NUM_USERS, dtype=bool)
    active_trad = np.ones(NUM_USERS, dtype=bool)
    cs_rl = np.zeros(NUM_USERS, dtype=int)
    cs_trad = np.zeros(NUM_USERS, dtype=int)
    habit = np.zeros((NUM_USERS, N_CATS), dtype=int)
    
    # Recovery tracking
    comp_history_sum = np.zeros(NUM_USERS)
    comp_history_cnt = np.zeros(NUM_USERS, dtype=int)
    pre_shock_base = np.full(NUM_USERS, 0.8)
    rec_streak = np.zeros(NUM_USERS, dtype=int)
    recovered = np.zeros(NUM_USERS, dtype=bool)
    
    total_comp_rl = []
    total_pain_rl = []
    total_comp_trad = []
    total_pain_trad = []
    
    for month in range(1, MONTHS + 1):
        # --- Life events ---
        if month == 6:
            # Lock pre-shock baseline
            mask = is_shock & (comp_history_cnt > 0)
            pre_shock_base[mask] = comp_history_sum[mask] / comp_history_cnt[mask]
            # Friction spike
            tf_trad[is_shock] = np.minimum(0.99, tf_trad[is_shock] + 0.10)
            tf_rl[is_shock] = np.minimum(0.99, tf_rl[is_shock] + 0.10)
        
        if month == 11:
            tf_trad[is_seasonal, 1] = 0.95  # Shopping
            tf_rl[is_seasonal, 1] = 0.95
        elif month == 12:
            tf_trad[is_seasonal, 1] = 0.5
            tf_rl[is_seasonal, 1] = 0.5
        
        tgt = np.full(NUM_USERS, BASE_TARGET)
        if month >= 6:
            tgt[is_shock] *= 0.75
        
        # === TRADITIONAL ===
        a_idx = np.where(active_trad)[0]
        if len(a_idx) > 0:
            cuts = tgt[a_idx, None] / N_CATS  # [n_active, 4]
            bc = np.maximum(0.0, 1.0 - tf_trad[a_idx])
            noise = rng.normal(0, 0.10, size=(len(a_idx), N_CATS))
            actual = cuts * np.clip(bc + noise, 0, 1)
            tot_act = actual.sum(axis=1)
            tot_pain = (cuts * tf_trad[a_idx]).sum(axis=1)
            agg = tot_act / tgt[a_idx]
            
            total_comp_trad.extend(agg.tolist())
            total_pain_trad.extend(tot_pain.tolist())
            
            cs_trad[a_idx] = np.where(agg < 0.30, cs_trad[a_idx] + 1, 0)
            active_trad[a_idx[cs_trad[a_idx] >= 3]] = False
        
        # === ADAPTIVE RL ===
        a_idx = np.where(active_rl)[0]
        if len(a_idx) > 0:
            wts = (1.0 - np.maximum(0.01, model_rl[a_idx]))**2
            tw = wts.sum(axis=1, keepdims=True)
            tw = np.maximum(tw, 1e-4)
            cuts = tgt[a_idx, None] * (wts / tw)
            
            bc = np.maximum(0.0, 1.0 - tf_rl[a_idx])
            # Aspirational bonus
            asp_mask_local = is_aspirational[a_idx]
            bc[asp_mask_local] += month * 0.02
            
            noise = rng.normal(0, 0.10, size=(len(a_idx), N_CATS))
            actual = cuts * np.clip(bc + noise, 0, 1)
            tot_act = actual.sum(axis=1)
            tot_pain = (cuts * tf_rl[a_idx]).sum(axis=1)
            agg = tot_act / tgt[a_idx]
            
            total_comp_rl.extend(agg.tolist())
            total_pain_rl.extend(tot_pain.tolist())
            
            # RL update
            obs_noise = rng.normal(0, 0.05, size=(len(a_idx), N_CATS))
            obs = np.clip((actual / np.maximum(0.01, cuts)) + obs_noise, 0, 1)
            
            low = obs < 0.95
            high = ~low
            
            # Low compliance update
            penalty = alpha * (1.0 - obs) * 1.5
            model_rl[a_idx] = np.where(low, 
                np.minimum(0.99, model_rl[a_idx] + penalty), 
                model_rl[a_idx])
            habit[a_idx] = np.where(low, 0, habit[a_idx])
            
            # High compliance update
            model_rl[a_idx] = np.where(high,
                np.maximum(0.01, model_rl[a_idx] - 0.05),
                model_rl[a_idx])
            habit[a_idx] = np.where(high, habit[a_idx] + 1, habit[a_idx])
            
            # Habit decay of true friction
            habit_mask = habit[a_idx] >= 3
            tf_rl[a_idx] = np.where(habit_mask,
                np.maximum(0.01, tf_rl[a_idx] - 0.05),
                tf_rl[a_idx])
            
            # Pre-shock history
            if month < 6:
                comp_history_sum[a_idx] += agg
                comp_history_cnt[a_idx] += 1
            
            # Churn
            cs_rl[a_idx] = np.where(agg < 0.30, cs_rl[a_idx] + 1, 0)
            active_rl[a_idx[cs_rl[a_idx] >= 3]] = False
            
            # Recovery tracking
            if month > 6:
                shock_active = a_idx[is_shock[a_idx]]
                if len(shock_active) > 0:
                    shock_agg = agg[is_shock[a_idx]]
                    threshold = 0.90 * pre_shock_base[shock_active]
                    meets = shock_agg >= threshold
                    rec_streak[shock_active] = np.where(meets, rec_streak[shock_active] + 1, 0)
                    recovered[shock_active] |= (rec_streak[shock_active] >= 2)
    
    ret_rl = active_rl.sum() / NUM_USERS * 100
    n_shock = is_shock.sum()
    n_rec = recovered[is_shock].sum()
    rec_rate = (n_rec / n_shock * 100) if n_shock > 0 else 0
    
    return {
        'retention': ret_rl,
        'recovery': rec_rate,
        'compliance': np.mean(total_comp_rl) * 100,
        'pain': np.mean(total_pain_rl),
    }

# =========================================================
# Run Sweep
# =========================================================
ALPHAS = [0.05, 0.10, 0.15, 0.20]
SEEDS = list(range(1, 21))  # 20 seeds

print("=" * 90)
print("  MULTI-SEED SENSITIVITY ANALYSIS (Vectorized)")
print(f"  N={NUM_USERS}, T={MONTHS}, Seeds={len(SEEDS)}")
print("=" * 90)

results = []
t0 = time.time()

for alpha in ALPHAS:
    seed_data = {'retention': [], 'recovery': [], 'compliance': [], 'pain': []}
    
    for seed in SEEDS:
        r = run_sim(seed, alpha)
        for k in seed_data:
            seed_data[k].append(r[k])
    
    row = {}
    row['alpha'] = alpha
    for k in ['retention', 'recovery', 'compliance', 'pain']:
        row[f'{k}_mean'] = np.mean(seed_data[k])
        row[f'{k}_sd'] = np.std(seed_data[k], ddof=1)
        row[f'{k}_raw'] = seed_data[k]
    results.append(row)
    
    elapsed = time.time() - t0
    print(f"  alpha={alpha:.2f} done ({elapsed:.1f}s elapsed)")

total_time = time.time() - t0
print(f"\nTotal runtime: {total_time:.1f}s ({len(ALPHAS)*len(SEEDS)} simulation runs)")

# =========================================================
# Print & Save Results
# =========================================================
import os

out_path = os.path.join(os.path.dirname(__file__), 'table2_empirical_results.txt')
raw_csv_path = os.path.join(os.path.dirname(__file__), 'table2_raw_alpha_0.10.csv')

out_lines = []
def log_print(msg=""):
    print(msg)
    out_lines.append(msg)

log_print("\n")
log_print("=" * 100)
log_print("  TABLE II: LEARNING RATE SENSITIVITY (Empirical, 20 Seeds, N=5000)")
log_print("=" * 100)
log_print(f"{'alpha':>6}  {'Retention (%)':>20}  {'Recovery (%)':>20}  {'Compliance (%)':>20}  {'Behav. Cost':>20}")
log_print("-" * 100)
for r in results:
    marker = " <-- selected" if r['alpha'] == 0.10 else ""
    log_print(f"{r['alpha']:>6.2f}  "
              f"{r['retention_mean']:>8.2f} +/- {r['retention_sd']:>5.2f}  "
              f"{r['recovery_mean']:>8.2f} +/- {r['recovery_sd']:>5.2f}  "
              f"{r['compliance_mean']:>8.2f} +/- {r['compliance_sd']:>5.2f}  "
              f"{r['pain_mean']:>8.2f} +/- {r['pain_sd']:>5.2f}{marker}")
log_print("-" * 100)
log_print("Values: mean +/- SD across 20 independent seeds.")
log_print("=" * 100)

# =========================================================
# Per-seed raw data for alpha=0.10 (for reviewers)
# =========================================================
r10 = results[1]
log_print("\n\nPer-seed raw data for alpha=0.10:")
log_print(f"{'Seed':>6}  {'Retention':>10}  {'Recovery':>10}  {'Compliance':>12}  {'Pain':>10}")
log_print("-" * 56)
for i, seed in enumerate(SEEDS):
    log_print(f"{seed:>6}  "
              f"{r10['retention_raw'][i]:>9.2f}%  "
              f"{r10['recovery_raw'][i]:>9.2f}%  "
              f"{r10['compliance_raw'][i]:>11.2f}%  "
              f"{r10['pain_raw'][i]:>10.2f}")

# =========================================================
# Statistical test: recovery alpha=0.05 vs 0.10
# =========================================================
from scipy import stats
r05 = results[0]
t_stat, p_val = stats.ttest_ind(r05['recovery_raw'], r10['recovery_raw'])
pooled = np.sqrt((r05['recovery_sd']**2 + r10['recovery_sd']**2) / 2)
d = abs(r05['recovery_mean'] - r10['recovery_mean']) / pooled if pooled > 0 else float('inf')

log_print(f"\n\nRecovery comparison (alpha=0.05 vs 0.10):")
log_print(f"  0.05: {r05['recovery_mean']:.2f} +/- {r05['recovery_sd']:.2f}%")
log_print(f"  0.10: {r10['recovery_mean']:.2f} +/- {r10['recovery_sd']:.2f}%")
log_print(f"  t = {t_stat:.4f}, p = {p_val:.2e}")
log_print(f"  Cohen's d = {d:.2f} ({'large' if d > 0.8 else 'medium' if d > 0.5 else 'small'})")

# Write results text file
with open(out_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(out_lines))
log_print(f"\nSaved summary results to: {out_path}")

# Write raw CSV
import csv
with open(raw_csv_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['Seed', 'Retention', 'Recovery', 'Compliance', 'BehavioralCost'])
    for i, seed in enumerate(SEEDS):
        writer.writerow([
            seed,
            r10['retention_raw'][i],
            r10['recovery_raw'][i],
            r10['compliance_raw'][i],
            r10['pain_raw'][i]
        ])
log_print(f"Saved raw per-seed data to: {raw_csv_path}")

log_print("\n\nDone.")
