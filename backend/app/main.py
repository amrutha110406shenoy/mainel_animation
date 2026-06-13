"""
FastAPI application entry point — EV Dynamic Charging Simulator API.
"""
import os
import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from app.routers.session   import router as session_router
from app.routers.analytics import router as analytics_router
from app.data.loader       import load_session_reports, load_hourly_loads
from app.model             import inference

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ── Environment variables ─────────────────────────────────────────────────────
load_dotenv()
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
DATA_PATH    = Path(os.getenv("DATA_PATH", "data"))

# ── App instance ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="EV Dynamic Charging Simulator API",
    description="AI-Powered EV Charging Station Digital Twin — REST + WebSocket",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup event ─────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    logger.info("Starting EV Charging Simulator API …")
    app.state.sessions_df = load_session_reports(DATA_PATH / "ev_charging_reports.csv")
    app.state.loads_df    = load_hourly_loads(DATA_PATH / "ev_hourly_loads.csv")
    app.state.policy_info = inference.get_policy_info()
    logger.info(
        f"Loaded {len(app.state.sessions_df)} sessions, "
        f"{len(app.state.loads_df)} load rows. "
        f"Model: {app.state.policy_info['model_type']}"
    )
    logger.info("EV Charging Simulator API started ✓")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(session_router,   prefix="/api")
app.include_router(analytics_router, prefix="/api")

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["system"])
async def health(request: Request):
    sessions_df = getattr(request.app.state, "sessions_df", None)
    policy_info = getattr(request.app.state, "policy_info", {})
    return {
        "status":          "ok",
        "model_loaded":    policy_info.get("model_loaded", False),
        "model_type":      policy_info.get("model_type", "unknown"),
        "sessions_count":  len(sessions_df) if sessions_df is not None else 0,
        "timestamp":       __import__("datetime").datetime.utcnow().isoformat(),
    }

# ── Exception handlers ────────────────────────────────────────────────────────
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(status_code=404, content={"error": "Endpoint not found"})

@app.exception_handler(500)
async def server_error_handler(request: Request, exc):
    return JSONResponse(status_code=500, content={"error": "Internal server error"})
