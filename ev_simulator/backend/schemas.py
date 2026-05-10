from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Literal

# ==================== Legacy Simulation Endpoint ====================

class LegacySimulationRequest(BaseModel):
    battery_capacity: float
    current_battery: float
    charger_power: float
    ambient_temperature: float

class LegacySimulationResponse(BaseModel):
    charging_time_minutes: float
    final_battery_percentage: float
    battery_temperature_rise: float
    efficiency_percentage: float
    energy_loss_kwh: float
    cost_estimate: float

# ==================== Simulation Endpoint ====================

class ChargeCurveData(BaseModel):
    """Complete charging curve data with time-series arrays"""
    time_minutes: List[float] = Field(..., description="Time points in minutes")
    soc_percent: List[float] = Field(..., description="State of charge percentages")
    power_kW: List[float] = Field(..., description="Charging power in kW")
    battery_temp_celsius: List[float] = Field(..., description="Battery temperature in Celsius")
    efficiency_percent: List[float] = Field(..., description="Efficiency percentages")

class SimulationRequest(BaseModel):
    """Request body for POST /api/simulate"""
    battery_capacity_kWh: float = Field(..., gt=0, description="Battery capacity in kWh")
    current_soc: float = Field(..., ge=0, le=100, description="Current state of charge (0-100%)")
    target_soc: float = Field(..., ge=0, le=100, description="Target state of charge (0-100%)")
    grid_voltage: float = Field(..., gt=0, description="Grid voltage in volts")
    ambient_temp_celsius: float = Field(..., ge=-50, le=60, description="Ambient temperature in Celsius")
    charging_mode: Literal["slow", "fast", "dynamic"] = Field(..., description="Charging mode")
    
    @field_validator("current_soc", "target_soc")
    @classmethod
    def validate_soc_range(cls, v, info):
        if not (0 <= v <= 100):
            raise ValueError("SOC must be between 0 and 100")
        return v
    
    @field_validator("target_soc")
    @classmethod
    def validate_target_greater_than_current(cls, v, info):
        if "current_soc" in info.data and v < info.data["current_soc"]:
            raise ValueError("Target SOC must be greater than or equal to current SOC")
        return v

class SimulationResponse(BaseModel):
    """Response body for POST /api/simulate"""
    estimated_time_minutes: float = Field(..., description="Estimated charging time in minutes")
    energy_delivered_kWh: float = Field(..., description="Energy to be delivered in kWh")
    cost_estimate_inr: float = Field(..., description="Cost estimate in INR")
    average_power_kW: float = Field(..., description="Average charging power in kW")
    average_efficiency_percent: float = Field(..., ge=0, le=100, description="Average charging efficiency percentage")
    max_battery_temp_celsius: float = Field(..., description="Maximum battery temperature reached")
    charge_curve: ChargeCurveData = Field(..., description="Complete charging curve time-series data")
    thermal_status: Literal["normal", "warm", "hot"] = Field(..., description="Battery thermal status")
    status: str = Field(default="success", description="Operation status")

# ==================== Charging Stations Endpoint ====================

class ChargingStationResponse(BaseModel):
    """Single charging station in the list"""
    id: int = Field(..., description="Unique station ID")
    name: str = Field(..., description="Station name")
    location: str = Field(..., description="Physical location address")
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lng: float = Field(..., ge=-180, le=180, description="Longitude")
    available_ports: int = Field(..., ge=0, description="Number of available charging ports")
    max_power_kW: float = Field(..., gt=0, description="Maximum power output in kW")
    price_per_kWh: float = Field(..., gt=0, description="Price per kWh in INR")
    is_online: bool = Field(..., description="Station operational status")

class ChargingStationsListResponse(BaseModel):
    """Response for GET /api/charging-stations"""
    stations: List[ChargingStationResponse]
    total_count: int = Field(..., description="Total number of stations")
    status: str = Field(default="success")

# ==================== Vehicle Profiles Endpoint ====================

class VehicleProfileResponse(BaseModel):
    """Single EV vehicle profile"""
    id: int = Field(..., description="Unique vehicle profile ID")
    name: str = Field(..., description="Vehicle model name")
    battery_capacity_kWh: float = Field(..., gt=0, description="Battery capacity in kWh")
    max_charge_rate_kW: float = Field(..., gt=0, description="Maximum charge rate in kW")
    connector_type: str = Field(..., description="Charging connector type (CCS, CHAdeMO, Type2, etc)")
    efficiency_percent: float = Field(..., ge=50, le=100, description="Typical charging efficiency")
    
class VehicleProfilesListResponse(BaseModel):
    """Response for GET /api/vehicle-profiles"""
    vehicles: List[VehicleProfileResponse]
    total_count: int = Field(..., description="Total number of vehicles")
    status: str = Field(default="success")

# ==================== Metrics Endpoint ====================

class MetricsResponse(BaseModel):
    """Response for GET /api/metrics"""
    current_temperature: float
    average_efficiency: float
    total_sessions: int
    average_charge_time: float
