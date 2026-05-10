from fastapi import APIRouter

router = APIRouter()

# In-memory storage for metrics
metrics_store = {
    "current_temperature": 25.0,
    "average_efficiency": 92.5,
    "total_sessions": 0,
    "average_charge_time": 45.0,
}

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "EV Charging Simulator API",
        "version": "1.0.0"
    }

@router.get("/metrics")
async def get_metrics():
    return metrics_store

def update_metrics(temperature: float, efficiency: float, charge_time: float):
    """Update metrics from simulation"""
    metrics_store["current_temperature"] = temperature
    metrics_store["average_efficiency"] = efficiency
    metrics_store["total_sessions"] += 1
    metrics_store["average_charge_time"] = charge_time
