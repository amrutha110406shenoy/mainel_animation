from fastapi import APIRouter, HTTPException
from schemas import (
    LegacySimulationRequest,
    LegacySimulationResponse,
    SimulationRequest, 
    SimulationResponse
)
from model.charging_simulation import EVChargingSimulator
from routes.health import update_metrics
import logging

router = APIRouter(prefix="/api", tags=["simulation"])
logger = logging.getLogger(__name__)

simulator = EVChargingSimulator()

def _get_charger_power(charging_mode: str) -> float:
    """Convert charging mode to power in kW."""
    mode_power_map = {
        "slow": 7.0,    # AC Level 1/2 charging
        "fast": 50.0,   # DC fast charging
        "dynamic": 22.0 # AC Level 3 or adaptive DC
    }
    return mode_power_map.get(charging_mode, 22.0)

@router.post("/simulate", response_model=SimulationResponse)
async def run_simulation(request: SimulationRequest):
    """
    Run advanced EV charging simulation with charge curve generation.
    
    Parameters:
    - battery_capacity_kWh: Total battery capacity (kWh)
    - current_soc: Current state of charge (0-100%)
    - target_soc: Target state of charge (0-100%)
    - grid_voltage: Grid voltage (volts)
    - ambient_temp_celsius: Ambient temperature (Celsius)
    - charging_mode: Charging mode (slow, fast, dynamic)
    
    Returns:
    Detailed simulation with charge curve, efficiency, cost, and thermal status
    """
    try:
        # Validate inputs
        if request.battery_capacity_kWh <= 0:
            raise HTTPException(status_code=400, detail="Battery capacity must be positive")
        
        if not (0 <= request.current_soc <= 100):
            raise HTTPException(status_code=400, detail="Current SOC must be between 0 and 100")
        
        if not (0 <= request.target_soc <= 100):
            raise HTTPException(status_code=400, detail="Target SOC must be between 0 and 100")
        
        if request.target_soc < request.current_soc:
            raise HTTPException(
                status_code=400,
                detail="Target SOC must be greater than or equal to current SOC"
            )
        
        if request.grid_voltage <= 0:
            raise HTTPException(status_code=400, detail="Grid voltage must be positive")
        
        if not (-50 <= request.ambient_temp_celsius <= 60):
            raise HTTPException(
                status_code=400,
                detail="Ambient temperature must be between -50°C and 60°C"
            )
        
        if request.charging_mode not in ["slow", "fast", "dynamic"]:
            raise HTTPException(
                status_code=400,
                detail="Charging mode must be 'slow', 'fast', or 'dynamic'"
            )

        # Run advanced simulation
        result = simulator.simulate_charging(
            battery_capacity_kwh=request.battery_capacity_kWh,
            current_soc=request.current_soc / 100.0,  # Convert from percentage to decimal
            target_soc=request.target_soc / 100.0,    # Convert from percentage to decimal
            charger_power_kw=_get_charger_power(request.charging_mode),
            ambient_temp_celsius=request.ambient_temp_celsius,
            grid_voltage=request.grid_voltage
        )

        # Update metrics
        try:
            update_metrics(
                temperature=request.ambient_temp_celsius,
                efficiency=result["average_efficiency_percent"],
                charge_time=result["estimated_time_minutes"]
            )
        except Exception as e:
            logger.warning(f"Could not update metrics: {str(e)}")

        return SimulationResponse(**result)
    
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        logger.error(f"Simulation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@router.post("/simulate/start", response_model=LegacySimulationResponse)
async def start_simulation(request: LegacySimulationRequest):
    """
    Legacy simulation endpoint for backward compatibility.
    
    Parameters:
    - battery_capacity: Total battery capacity (kWh)
    - current_battery: Current battery level (%)
    - charger_power: Charger power output (kW)
    - ambient_temperature: Ambient temperature (°C)
    """
    try:
        # Validate inputs
        if request.battery_capacity <= 0:
            raise HTTPException(status_code=400, detail="Battery capacity must be positive")
        if not (0 <= request.current_battery <= 100):
            raise HTTPException(status_code=400, detail="Current battery must be between 0 and 100")
        if request.charger_power <= 0:
            raise HTTPException(status_code=400, detail="Charger power must be positive")

        # Run advanced simulation and map back to legacy response
        adv_res = simulator.simulate_charging(
            battery_capacity_kwh=request.battery_capacity,
            current_soc=request.current_battery / 100.0,
            target_soc=1.0,  # Legacy always charges to 100%
            charger_power_kw=request.charger_power,
            ambient_temp_celsius=request.ambient_temperature,
            grid_voltage=400.0
        )
        
        energy_stored = request.battery_capacity * (1.0 - request.current_battery / 100.0)
        energy_loss = adv_res["energy_delivered_kWh"] - energy_stored
        
        result = {
            "charging_time_minutes": adv_res["estimated_time_minutes"],
            "final_battery_percentage": 100.0,
            "battery_temperature_rise": adv_res["max_battery_temp_celsius"] - request.ambient_temperature,
            "efficiency_percentage": adv_res["average_efficiency_percent"],
            "energy_loss_kwh": max(0.0, energy_loss),
            "cost_estimate": adv_res["cost_estimate_inr"]
        }

        # Update metrics
        try:
            update_metrics(
                temperature=result.get("battery_temperature_rise", request.ambient_temperature),
                efficiency=result.get("efficiency_percentage", 90),
                charge_time=result.get("charging_time_minutes", 0)
            )
        except Exception as e:
            logger.warning(f"Could not update metrics: {str(e)}")

        return LegacySimulationResponse(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Simulation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")
