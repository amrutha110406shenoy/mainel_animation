"""
OpenAI Gymnasium EV Charging Environment.

State space (7 variables):
  [hour_of_day, battery_soc, remaining_dwell_hours, price_tier,
   grid_load_kw, user_type, plugin_category]

Action space: Discrete(4)
  0 → slow_charge_3.6kW
  1 → fast_charge_7.2kW (up to 150kW DC in full station)
  2 → pause / idle
  3 → v2g_discharge_3.6kW
"""
import numpy as np
import random
import gymnasium as gym
from gymnasium import spaces

from app.services.pricing import get_price_tier, get_price_from_tier


# Battery capacity options (kWh)
BATTERY_CAPACITIES = [30, 40, 60, 75, 100]

# Power (kW) per action
ACTION_POWER = {0: 3.6, 1: 7.2, 2: 0.0, 3: -3.6}

ACTION_NAMES = {
    0: "Slow Charge 3.6kW",
    1: "Fast Charge 7.2kW",
    2: "Pause / Idle",
    3: "V2G Discharge 3.6kW",
}


class EVChargingEnv(gym.Env):
    """
    Single-vehicle EV charging MDP.

    Each timestep = 1 simulation hour.
    Reward is a weighted sum of tariff savings, SoC progress,
    grid penalty, V2G revenue, and degradation cost.
    """

    metadata = {"render_modes": ["human"]}

    def __init__(self, config: dict | None = None):
        super().__init__()
        cfg = config or {}

        # Session parameters (overridable via config)
        self.initial_soc        = float(cfg.get("battery_soc", 20.0))
        self.target_soc         = float(cfg.get("target_soc", 90.0))
        self.start_hour         = int(cfg.get("hour_of_day", 9))
        self.user_type_val      = 0 if cfg.get("user_type", "Private") == "Private" else 1
        self.plugin_category    = int(cfg.get("plugin_category", 4))
        self.solar_pct          = float(cfg.get("solar_pct", 0.0))
        self.vehicles_waiting   = int(cfg.get("vehicles_waiting", 2))
        self.max_dwell_hours    = float(cfg.get("dwell_hours", 8.0))

        # Sample battery capacity
        self.battery_capacity = float(
            cfg.get("battery_capacity", random.choice(BATTERY_CAPACITIES))
        )

        # Gym spaces
        low  = np.array([0, 0, 0, 0, 0, 0, 0], dtype=np.float32)
        high = np.array([23, 100, 24, 3, 400, 1, 7], dtype=np.float32)
        self.observation_space = spaces.Box(low=low, high=high, dtype=np.float32)
        self.action_space      = spaces.Discrete(4)

        # Runtime state (populated in reset())
        self.current_hour      = self.start_hour
        self.soc               = self.initial_soc
        self.dwell_remaining   = self.max_dwell_hours
        self.price_tier        = get_price_tier(self.current_hour)
        self.grid_load         = self._base_grid_load(self.current_hour)
        self.cumulative_cost   = 0.0
        self.cumulative_energy = 0.0
        self.step_count        = 0
        self.done              = False

    # ─── Gym interface ────────────────────────────────────────────────────────

    def reset(self, *, seed=None, options=None):
        """Reset environment to initial state. Returns (obs, info)."""
        super().reset(seed=seed)
        self.soc             = self.initial_soc
        self.current_hour    = self.start_hour
        self.dwell_remaining = self.max_dwell_hours
        self.price_tier      = get_price_tier(self.current_hour)
        self.grid_load       = self._base_grid_load(self.current_hour)
        self.cumulative_cost = 0.0
        self.cumulative_energy = 0.0
        self.step_count      = 0
        self.done            = False
        return self._get_obs(), {}

    def step(self, action: int):
        """
        Apply action for one timestep (1 hour).

        Returns: (obs, reward, terminated, truncated, info)
        """
        if self.done:
            return self._get_obs(), 0.0, True, False, {}

        action = int(action)
        power_kw = ACTION_POWER[action]

        # ── V2G guard: minimum SoC floor ──────────────────────────────────────
        if action == 3 and self.soc <= 20.0:
            action, power_kw = 0, 3.6   # fallback to slow charge

        # ── SoC physics (1-hour timestep) ─────────────────────────────────────
        delta_soc = (power_kw * 1.0 / self.battery_capacity) * 100.0
        new_soc   = np.clip(self.soc + delta_soc, 0.0, 100.0)

        # ── Grid load update ──────────────────────────────────────────────────
        renewable_kw = (self.solar_pct / 100.0) * abs(power_kw)
        net_grid_draw = max(0.0, abs(power_kw) - renewable_kw) if power_kw > 0 else 0.0
        self.grid_load = self._base_grid_load(self.current_hour) + net_grid_draw

        # ── Pricing ───────────────────────────────────────────────────────────
        self.price_tier = get_price_tier(self.current_hour)
        price_per_kwh   = get_price_from_tier(self.price_tier)
        cost_this_step  = (abs(power_kw) * 1.0 * price_per_kwh) if power_kw >= 0 else 0.0

        # ── Reward components ─────────────────────────────────────────────────
        baseline_price  = 22.0   # peak as baseline
        tariff_savings  = (baseline_price - price_per_kwh) / baseline_price * abs(power_kw) * 0.5
        soc_progress    = (new_soc - self.soc) * 0.3
        grid_penalty    = 0.0
        if action == 1 and self.price_tier == 2:   # fast charge at peak
            grid_penalty = -((abs(power_kw) / 150.0) ** 2) * 5.0
        v2g_revenue = 0.0
        if action == 3 and self.price_tier == 3:   # V2G during spike
            v2g_revenue = abs(power_kw) * 1.0 * price_per_kwh * 0.4
        degradation = -abs(power_kw) * 0.001  # tiny per-kWh penalty

        reward = tariff_savings + soc_progress + grid_penalty + v2g_revenue + degradation

        # ── Advance time ──────────────────────────────────────────────────────
        self.soc           = float(new_soc)
        self.cumulative_cost  += cost_this_step
        if power_kw > 0:
            self.cumulative_energy += abs(power_kw) * 1.0
        self.step_count    += 1
        self.current_hour   = (self.current_hour + 1) % 24
        self.dwell_remaining = max(0.0, self.dwell_remaining - 1.0)

        # ── Terminal check ────────────────────────────────────────────────────
        terminated = self.dwell_remaining <= 0.0
        if terminated:
            soc_met = self.soc >= self.target_soc
            reward += 50.0 if soc_met else -30.0
            self.done = True

        info = {
            "action_name":     ACTION_NAMES[action],
            "power_kw":        power_kw,
            "soc":             self.soc,
            "price_tier":      self.price_tier,
            "price":           price_per_kwh,
            "cost_this_step":  round(cost_this_step, 3),
            "cumulative_cost": round(self.cumulative_cost, 3),
            "grid_load":       round(self.grid_load, 1),
            "renewable_pct":   self.solar_pct,
            "dwell_remaining": self.dwell_remaining,
            "reward_breakdown": {
                "tariff_savings": round(tariff_savings, 3),
                "soc_progress":   round(soc_progress, 3),
                "grid_penalty":   round(grid_penalty, 3),
                "v2g_revenue":    round(v2g_revenue, 3),
                "degradation":    round(degradation, 3),
            }
        }
        return self._get_obs(), float(reward), terminated, False, info

    # ─── Helpers ──────────────────────────────────────────────────────────────

    def _get_obs(self) -> np.ndarray:
        """Return normalised observation vector."""
        return np.array([
            self.current_hour,
            self.soc,
            self.dwell_remaining,
            float(self.price_tier),
            self.grid_load,
            float(self.user_type_val),
            float(self.plugin_category),
        ], dtype=np.float32)

    def state_dict(self) -> dict:
        """Return current env state as a plain dict for WebSocket streaming."""
        return {
            "hour_of_day":      self.current_hour,
            "soc":              round(self.soc, 2),
            "dwell_remaining":  round(self.dwell_remaining, 2),
            "price_tier":       self.price_tier,
            "grid_load":        round(self.grid_load, 1),
            "user_type":        self.user_type_val,
            "plugin_category":  self.plugin_category,
        }

    @staticmethod
    def _base_grid_load(hour: int) -> float:
        """Heuristic base grid load curve (kW) shaped on time of day."""
        # Sinusoidal with peak ~18:00
        angle = (hour - 6) / 24.0 * 2 * np.pi
        return round(150.0 + 120.0 * max(0, np.sin(angle)) + np.random.uniform(-10, 10), 1)

    def estimated_wait_time(self) -> float:
        """Rough wait-time estimate in minutes based on queue length."""
        avg_session_min = 90
        bays = 6
        queue = max(0, self.vehicles_waiting - bays)
        return round(queue * avg_session_min / bays, 1)

    def render(self, mode="human"):
        print(
            f"Hour={self.current_hour:02d}  SoC={self.soc:.1f}%  "
            f"Dwell={self.dwell_remaining:.1f}h  Grid={self.grid_load:.0f}kW"
        )
