"""
Synthetic dataset generator for EV Charging Simulator.
Generates two CSV files matching the AdO3 dataset schema.
Run once: python generate_datasets.py
"""
import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

np.random.seed(42)
random.seed(42)

# ── Dataset 1: EV Charging Session Reports (6,878 sessions) ──────────────────
print("Generating ev_charging_reports.csv ...")

plugin_categories = {
    0: (6, 9),   # Early morning
    1: (9, 12),  # Morning
    2: (12, 14), # Midday
    3: (14, 16), # Early afternoon
    4: (16, 19), # Afternoon peak
    5: (19, 22), # Evening
    6: (22, 24), # Night
    7: (0, 6),   # Overnight
}

sessions = []
start_date = datetime(2018, 12, 1)
end_date   = datetime(2020, 1, 31)
total_days = (end_date - start_date).days

for i in range(6878):
    day_offset = random.randint(0, total_days)
    date = start_date + timedelta(days=day_offset)
    month = date.month

    plugin_cat = random.choices(
        [0, 1, 2, 3, 4, 5, 6, 7],
        weights=[8, 10, 8, 12, 18, 16, 14, 14]
    )[0]
    hour_range = plugin_categories[plugin_cat]
    plugin_hour = random.randint(hour_range[0], hour_range[1] - 1)
    plugin_min  = random.randint(0, 59)
    plugin_time = date.replace(hour=plugin_hour, minute=plugin_min, second=0)

    duration_hours = round(np.random.lognormal(mean=1.6, sigma=0.7), 2)
    duration_hours = np.clip(duration_hours, 0.25, 24.0)

    plugout_time = plugin_time + timedelta(hours=float(duration_hours))

    charger_kw   = random.choice([3.6, 7.2])
    energy_kwh   = round(min(charger_kw * duration_hours, random.uniform(20, 75)), 2)

    user_type = random.choices(["Private", "Shared"], weights=[65, 35])[0]

    sessions.append({
        "session_id":       i + 1,
        "plugin_time":      plugin_time.strftime("%Y-%m-%d %H:%M:%S"),
        "plugout_time":     plugout_time.strftime("%Y-%m-%d %H:%M:%S"),
        "duration_hours":   duration_hours,
        "energy_kwh":       energy_kwh,
        "user_type":        user_type,
        "plugin_category":  plugin_cat,
        "month":            month,
    })

df1 = pd.DataFrame(sessions)
df1.to_csv("ev_charging_reports.csv", index=False)
print(f"  Created ev_charging_reports.csv  ({len(df1)} rows)")

# ── Dataset 2: Hourly EV Loads per User (88,156 rows) ────────────────────────
print("Generating ev_hourly_loads.csv ...")

n_users = 3673  # ceil(88156 / 24) = 3673 users × 24 hours
records = []

for user_id in range(1, n_users + 1):
    user_type = random.choices(["Private", "Shared"], weights=[65, 35])[0]
    base_peak_hour = random.randint(14, 22)

    for hour in range(24):
        # Uncontrolled 3.6kW – peaks at user's preferred hour
        uncontrolled_3_6 = round(
            3.6 * max(0, np.random.normal(
                1.0 if abs(hour - base_peak_hour) < 3 else 0.2, 0.15
            )), 3)

        # Uncontrolled 7.2kW – same shape, double power
        uncontrolled_7_2 = round(uncontrolled_3_6 * random.uniform(1.8, 2.1), 3)

        # Flexible 3.6kW – shifted to off-peak (22-06)
        off_peak = 1 if (hour >= 22 or hour < 6) else 0
        flex_3_6 = round(
            3.6 * max(0, np.random.normal(
                0.85 if off_peak else 0.05, 0.10
            )), 3)

        # Flexible 7.2kW – same off-peak shift
        flex_7_2 = round(flex_3_6 * random.uniform(1.8, 2.1), 3)

        records.append({
            "user_id":            user_id,
            "user_type":          user_type,
            "hour":               hour,
            "uncontrolled_3_6kw": uncontrolled_3_6,
            "uncontrolled_7_2kw": uncontrolled_7_2,
            "flexible_3_6kw":     flex_3_6,
            "flexible_7_2kw":     flex_7_2,
        })

df2 = pd.DataFrame(records[:88156])  # exactly 88,156 rows
df2.to_csv("ev_hourly_loads.csv", index=False)
print(f"  Created ev_hourly_loads.csv      ({len(df2)} rows)")
print("Done!")
