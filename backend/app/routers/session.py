"""
REST + WebSocket session endpoints.
  POST   /api/session/start
  WS     /ws/session/{session_id}
  GET    /api/session/{session_id}/summary
"""
import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel, Field

from app.services.simulator import create_session, get_session, run_simulation

logger   = logging.getLogger(__name__)
router   = APIRouter(tags=["session"])


# ── Pydantic request model ────────────────────────────────────────────────────

class SessionConfig(BaseModel):
    battery_soc:       float = Field(20.0,  ge=0,  le=100, description="Initial SoC %")
    target_soc:        float = Field(90.0,  ge=10, le=100, description="Target SoC %")
    battery_capacity:  float = Field(60.0,  ge=10, le=150, description="Battery kWh")
    vehicles_waiting:  int   = Field(2,     ge=0,  le=20,  description="Queue length")
    solar_pct:         float = Field(0.0,   ge=0,  le=100, description="Solar %")
    hour_of_day:       int   = Field(9,     ge=0,  le=23,  description="Start hour")
    charger_type:      str   = Field("Mixed", description="Fast DC / Slow AC / Mixed")
    mode:              str   = Field("Smart RL", description="Smart RL / Immediate / Off-Peak / V2G")
    dwell_hours:       float = Field(8.0,   ge=0.5, le=24, description="Max dwell hours")
    user_type:         str   = Field("Private", description="Private / Shared")
    plugin_category:   int   = Field(4,     ge=0,  le=7,   description="Plugin time window")
    vehicle_make:      str   = Field("Tata Nexon", description="EV make")


# ── REST endpoints ────────────────────────────────────────────────────────────

@router.post("/session/start")
async def start_session(config: SessionConfig):
    """Initialise a new simulation session and return the session ID."""
    meta = create_session(config.model_dump())
    logger.info(f"Session started: {meta['session_id']}")
    return meta


@router.get("/session/{session_id}/summary")
async def get_summary(session_id: str):
    """Return the stored summary for a completed session."""
    meta = get_session(session_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Session not found")
    if meta["summary"] is None:
        raise HTTPException(status_code=202, detail="Session still running")
    return meta["summary"]


# ── WebSocket streaming endpoint ──────────────────────────────────────────────

@router.websocket("/ws/session/{session_id}")
async def session_websocket(websocket: WebSocket, session_id: str):
    """
    Stream simulation timestep payloads at 0.5s intervals until done.
    Each message is a JSON object; final message includes session_summary.
    """
    await websocket.accept()
    logger.info(f"WebSocket connected: session={session_id}")

    meta = get_session(session_id)
    if not meta:
        await websocket.send_json({"error": f"Session {session_id} not found"})
        await websocket.close()
        return

    try:
        async for payload in run_simulation(session_id):
            await websocket.send_json(payload)
            if payload.get("done"):
                break
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: session={session_id}")
    except Exception as e:
        logger.error(f"WebSocket error (session={session_id}): {e}")
        try:
            await websocket.send_json({"error": str(e)})
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
        logger.info(f"WebSocket closed: session={session_id}")
