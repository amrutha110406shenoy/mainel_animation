from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import sys
import os

# Add model path to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'model'))

from config import CORS_ORIGINS, CORS_METHODS, CORS_HEADERS, CORS_CREDENTIALS, API_TITLE, API_VERSION, API_DESCRIPTION
from routes import simulation, health, data

# Initialize FastAPI app
app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=CORS_CREDENTIALS,
    allow_methods=CORS_METHODS,
    allow_headers=CORS_HEADERS,
)

# Include routers
app.include_router(health.router)
app.include_router(simulation.router)
app.include_router(data.router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "EV Charging Simulator API",
        "version": API_VERSION,
        "docs": "/docs",
        "endpoints": {
            "simulation": "/api/simulate",
            "charging_stations": "/api/charging-stations",
            "vehicle_profiles": "/api/vehicle-profiles",
            "health": "/health",
            "metrics": "/api/metrics"
        }
    }

if __name__ == "__main__":
    import uvicorn
    from config import HOST, PORT
    uvicorn.run(app, host=HOST, port=PORT)
