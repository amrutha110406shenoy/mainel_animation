"""
Time-of-Use (TOU) tariff pricing engine for Indian EV charging.
Rates: off-peak Rs.8/kWh | mid-peak Rs.14/kWh | peak Rs.22/kWh | spike Rs.30/kWh
"""
import random

# Tariff tiers (₹/kWh)
TARIFF = {
    0: 8.0,   # off-peak  (22:00 – 06:00)
    1: 14.0,  # mid-peak  (06:00 – 14:00)
    2: 22.0,  # peak      (14:00 – 22:00)
    3: 30.0,  # spike     (random 10% chance during peak hours)
}

TIER_NAMES = {0: "Off-Peak", 1: "Mid-Peak", 2: "Peak", 3: "Price Spike"}


def get_price_tier(hour: int) -> int:
    """Return price tier integer (0–3) for the given hour of day."""
    if hour >= 22 or hour < 6:
        return 0  # off-peak
    elif hour < 14:
        return 1  # mid-peak
    else:
        # Peak window: 10% chance of spike
        if random.random() < 0.10:
            return 3
        return 2  # peak


def get_price(hour: int) -> float:
    """Return ₹/kWh price for the given hour."""
    return TARIFF[get_price_tier(hour)]


def get_price_from_tier(tier: int) -> float:
    """Return ₹/kWh price from a pre-computed tier."""
    return TARIFF.get(tier, 22.0)


def get_24h_schedule() -> list[dict]:
    """Return deterministic 24-hour price schedule (no random spikes)."""
    schedule = []
    for h in range(24):
        if h >= 22 or h < 6:
            tier, price = 0, 8.0
        elif h < 14:
            tier, price = 1, 14.0
        else:
            tier, price = 2, 22.0
        schedule.append({
            "hour": h,
            "tier": tier,
            "tier_name": TIER_NAMES[tier],
            "price": price
        })
    return schedule
