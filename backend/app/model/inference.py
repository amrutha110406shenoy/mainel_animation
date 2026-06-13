"""
PPO model inference wrapper with graceful rule-based fallback.

If trained_model/ppo_ev_charging.zip is present, loads and uses it.
Otherwise logs a warning and applies a deterministic rule-based policy
that replicates the RL policy's known behaviour from the paper.
"""
import numpy as np
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).parent.parent.parent / "trained_model" / "ppo_ev_charging.zip"

_model       = None
_model_loaded = False

# Action index → human-readable name
ACTION_NAMES = {
    0: "Slow Charge 3.6kW",
    1: "Fast Charge 7.2kW",
    2: "Pause / Idle",
    3: "V2G Discharge 3.6kW",
}


def _load_model():
    """Attempt to load the Stable-Baselines3 PPO model at module import time."""
    global _model, _model_loaded
    if MODEL_PATH.exists():
        try:
            from stable_baselines3 import PPO
            _model = PPO.load(str(MODEL_PATH))
            _model_loaded = True
            logger.info(f"PPO model loaded from {MODEL_PATH}")
        except Exception as e:
            logger.warning(f"Failed to load PPO model ({e}) — using rule-based fallback")
    else:
        logger.warning(
            f"Model file not found at {MODEL_PATH} — using rule-based fallback policy"
        )


def _rule_based_predict(obs: np.ndarray) -> int:
    """
    Deterministic rule-based policy derived from the paper's optimal policy:
      - Off-peak (22–06): always slow charge
      - Mid-peak (06–14): slow charge unless SoC critical
      - Peak (14–22): if SoC < 20% → fast charge, else pause
      - Price spike (tier 3) + SoC > 40%: V2G discharge
    """
    hour       = int(obs[0])
    soc        = float(obs[1])
    price_tier = int(obs[3])

    # Price spike → V2G if SoC allows
    if price_tier == 3 and soc > 40.0:
        return 3  # V2G discharge

    # Off-peak window
    if hour >= 22 or hour < 6:
        return 0  # slow charge

    # Mid-peak (06–14)
    if hour < 14:
        if soc < 15.0:
            return 1  # fast charge — urgent
        return 0      # slow charge

    # Peak (14–22)
    if soc < 20.0:
        return 1  # fast charge — critical
    return 2          # pause


def predict(observation: dict) -> int:
    """
    Run inference on the given observation dict.

    Args:
        observation: dict with keys matching the env state
            (hour_of_day, soc, dwell_remaining, price_tier,
             grid_load, user_type, plugin_category)

    Returns:
        action int in {0, 1, 2, 3}
    """
    obs_array = np.array([
        observation.get("hour_of_day",     9),
        observation.get("soc",            20),
        observation.get("dwell_remaining", 4),
        observation.get("price_tier",      1),
        observation.get("grid_load",     150),
        observation.get("user_type",       0),
        observation.get("plugin_category", 4),
    ], dtype=np.float32)

    if _model_loaded and _model is not None:
        try:
            action, _ = _model.predict(obs_array, deterministic=True)
            return int(action)
        except Exception as e:
            logger.error(f"Model predict failed ({e}), falling back to rule-based")

    return _rule_based_predict(obs_array)


def get_action_name(action: int) -> str:
    """Map action integer to human-readable string."""
    return ACTION_NAMES.get(action, "Unknown")


def get_policy_info() -> dict:
    """Return policy metadata for the /health endpoint."""
    return {
        "model_type":    "PPO (Stable-Baselines3)" if _model_loaded else "Rule-Based Fallback",
        "model_loaded":  _model_loaded,
        "model_path":    str(MODEL_PATH),
        "action_space":  list(ACTION_NAMES.values()),
    }


# Load at import time
_load_model()
