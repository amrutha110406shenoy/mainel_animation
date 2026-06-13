"""
Simulation engine – orchestrates EVChargingEnv + policy per WebSocket session.
Maintains an in-memory session store; writes summaries to SQLite.
"""
import asyncio
import uuid
import logging
import time
from typing import AsyncGenerator

from app.env.ev_env import EVChargingEnv
from app.model import inference

logger = logging.getLogger(__name__)

# In-memory session registry  {session_id: session_meta_dict}
_sessions: dict[str, dict] = {}


def create_session(config: dict) -> dict:
    """
    Initialise a new session: create the Gym env, store meta.
    Returns the session meta dict including session_id.
    """
    session_id = str(uuid.uuid4())[:8]
    env = EVChargingEnv(config)
    env.reset()

    meta = {
        "session_id":   session_id,
        "config":       config,
        "env":          env,
        "start_ts":     time.time(),
        "status":       "running",
        "summary":      None,
    }
    _sessions[session_id] = meta

    # Estimated wait time
    wait_time = env.estimated_wait_time()
    from app.services.pricing import get_price_tier, TIER_NAMES
    tier = get_price_tier(config.get("hour_of_day", 9))

    return {
        "session_id":        session_id,
        "estimated_wait_time": wait_time,
        "price_tier":        tier,
        "price_tier_name":   TIER_NAMES[tier],
        "config":            config,
    }


def get_session(session_id: str) -> dict | None:
    return _sessions.get(session_id)


async def run_simulation(session_id: str) -> AsyncGenerator[dict, None]:
    """
    Async generator that steps the env + policy and yields one JSON-able
    dict per timestep, streamed at ~0.5s intervals.
    """
    meta = _sessions.get(session_id)
    if not meta:
        yield {"error": f"Session {session_id} not found"}
        return

    env: EVChargingEnv = meta["env"]
    env.reset()
    timestep = 0

    while True:
        obs_dict = env.state_dict()
        action   = inference.predict(obs_dict)

        obs, reward, terminated, truncated, info = env.step(action)
        timestep += 1

        payload = {
            "timestep":        timestep,
            "action":          action,
            "action_name":     info["action_name"],
            "soc":             info["soc"],
            "power_kw":        info["power_kw"],
            "reward":          round(reward, 3),
            "reward_breakdown": info["reward_breakdown"],
            "price":           info["price"],
            "price_tier":      info["price_tier"],
            "cost_this_step":  info["cost_this_step"],
            "cumulative_cost": info["cumulative_cost"],
            "grid_load":       info["grid_load"],
            "renewable_pct":   info["renewable_pct"],
            "hour_of_day":     env.current_hour,
            "dwell_remaining": info["dwell_remaining"],
            "wait_time":       env.estimated_wait_time(),
            "done":            terminated or truncated,
        }

        if terminated or truncated:
            summary = {
                "session_id":       session_id,
                "total_timesteps":  timestep,
                "final_soc":        info["soc"],
                "target_soc":       env.target_soc,
                "soc_target_met":   info["soc"] >= env.target_soc,
                "total_cost":       info["cumulative_cost"],
                "total_energy_kwh": round(env.cumulative_energy, 2),
                "duration_hours":   env.max_dwell_hours,
            }
            payload["session_summary"] = summary
            meta["summary"] = summary
            meta["status"]  = "completed"
            yield payload
            break

        yield payload
        await asyncio.sleep(0.5)
