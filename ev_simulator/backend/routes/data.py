from fastapi import APIRouter, HTTPException
from typing import List
from schemas import (
    ChargingStationResponse, ChargingStationsListResponse,
    VehicleProfileResponse, VehicleProfilesListResponse
)

router = APIRouter(prefix="/api", tags=["data"])

# Mock charging stations data
MOCK_CHARGING_STATIONS = [
    {
        "id": 1,
        "name": "Tesla Supercharger - Bangalore Downtown",
        "location": "Brigade Gateway, Bangalore",
        "lat": 12.9352,
        "lng": 77.6245,
        "available_ports": 8,
        "max_power_kW": 350,
        "price_per_kWh": 8.5,
        "is_online": True,
    },
    {
        "id": 2,
        "name": "Fortum Charge - Hyderabad Tech Park",
        "location": "HITEC City, Hyderabad",
        "lat": 17.3618,
        "lng": 78.4481,
        "available_ports": 4,
        "max_power_kW": 150,
        "price_per_kWh": 7.8,
        "is_online": True,
    },
    {
        "id": 3,
        "name": "Tata Power - Mumbai Central",
        "location": "Bandra, Mumbai",
        "lat": 19.0596,
        "lng": 72.8295,
        "available_ports": 6,
        "max_power_kW": 100,
        "price_per_kWh": 9.2,
        "is_online": True,
    },
    {
        "id": 4,
        "name": "Jio-bp Express - Delhi NCR",
        "location": "Gurugram, Delhi NCR",
        "lat": 28.4595,
        "lng": 77.0266,
        "available_ports": 3,
        "max_power_kW": 200,
        "price_per_kWh": 8.1,
        "is_online": False,
    },
    {
        "id": 5,
        "name": "Exicom - Pune Downtown",
        "location": "Kalyani Nagar, Pune",
        "lat": 18.5320,
        "lng": 73.8766,
        "available_ports": 5,
        "max_power_kW": 120,
        "price_per_kWh": 7.9,
        "is_online": True,
    },
    {
        "id": 6,
        "name": "ABB Charging - Kolkata",
        "location": "Salt Lake City, Kolkata",
        "lat": 22.5731,
        "lng": 88.3646,
        "available_ports": 2,
        "max_power_kW": 50,
        "price_per_kWh": 7.5,
        "is_online": True,
    },
    {
        "id": 7,
        "name": "Eaton Charge Pro - Chennai",
        "location": "IT Corridor, Chennai",
        "lat": 12.9716,
        "lng": 80.2409,
        "available_ports": 7,
        "max_power_kW": 175,
        "price_per_kWh": 8.3,
        "is_online": True,
    },
    {
        "id": 8,
        "name": "ChargeUp - Ahmedabad",
        "location": "Satellite, Ahmedabad",
        "lat": 23.0225,
        "lng": 72.5714,
        "available_ports": 1,
        "max_power_kW": 75,
        "price_per_kWh": 7.6,
        "is_online": True,
    },
]

# Mock vehicle profiles data
MOCK_VEHICLE_PROFILES = [
    {
        "id": 1,
        "name": "Tesla Model 3",
        "battery_capacity_kWh": 75,
        "max_charge_rate_kW": 250,
        "connector_type": "NACS",
        "efficiency_percent": 94,
    },
    {
        "id": 2,
        "name": "Hyundai Kona Electric",
        "battery_capacity_kWh": 64,
        "max_charge_rate_kW": 77,
        "connector_type": "CCS",
        "efficiency_percent": 91,
    },
    {
        "id": 3,
        "name": "Nissan Leaf Plus",
        "battery_capacity_kWh": 62,
        "max_charge_rate_kW": 100,
        "connector_type": "CHAdeMO",
        "efficiency_percent": 89,
    },
    {
        "id": 4,
        "name": "Tata Nexon EV Max",
        "battery_capacity_kWh": 75,
        "max_charge_rate_kW": 50,
        "connector_type": "CCS",
        "efficiency_percent": 87,
    },
    {
        "id": 5,
        "name": "MG ZS EV",
        "battery_capacity_kWh": 50,
        "max_charge_rate_kW": 144,
        "connector_type": "CCS",
        "efficiency_percent": 90,
    },
]


@router.get("/charging-stations", response_model=ChargingStationsListResponse)
async def get_charging_stations(city: str = None, online_only: bool = False):
    """
    Get list of EV charging stations.
    
    Query Parameters:
    - city: Filter by city name (optional)
    - online_only: Return only online stations (default: False)
    """
    try:
        stations = MOCK_CHARGING_STATIONS
        
        # Filter by online status if requested
        if online_only:
            stations = [s for s in stations if s["is_online"]]
        
        # Convert to response models
        station_responses = [ChargingStationResponse(**s) for s in stations]
        
        return ChargingStationsListResponse(
            stations=station_responses,
            total_count=len(station_responses)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching charging stations: {str(e)}")


@router.get("/vehicle-profiles", response_model=VehicleProfilesListResponse)
async def get_vehicle_profiles(connector_type: str = None):
    """
    Get list of EV vehicle profiles.
    
    Query Parameters:
    - connector_type: Filter by charging connector type (CCS, CHAdeMO, NACS, etc.)
    """
    try:
        vehicles = MOCK_VEHICLE_PROFILES
        
        # Filter by connector type if provided
        if connector_type:
            vehicles = [v for v in vehicles if v["connector_type"].upper() == connector_type.upper()]
            if not vehicles:
                raise HTTPException(
                    status_code=404,
                    detail=f"No vehicles found with connector type: {connector_type}"
                )
        
        # Convert to response models
        vehicle_responses = [VehicleProfileResponse(**v) for v in vehicles]
        
        return VehicleProfilesListResponse(
            vehicles=vehicle_responses,
            total_count=len(vehicle_responses)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching vehicle profiles: {str(e)}")


@router.get("/charging-stations/{station_id}", response_model=ChargingStationResponse)
async def get_charging_station(station_id: int):
    """Get details of a specific charging station"""
    try:
        station = next((s for s in MOCK_CHARGING_STATIONS if s["id"] == station_id), None)
        
        if not station:
            raise HTTPException(status_code=404, detail=f"Station {station_id} not found")
        
        return ChargingStationResponse(**station)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching station details: {str(e)}")


@router.get("/vehicle-profiles/{vehicle_id}", response_model=VehicleProfileResponse)
async def get_vehicle_profile(vehicle_id: int):
    """Get details of a specific vehicle profile"""
    try:
        vehicle = next((v for v in MOCK_VEHICLE_PROFILES if v["id"] == vehicle_id), None)
        
        if not vehicle:
            raise HTTPException(status_code=404, detail=f"Vehicle {vehicle_id} not found")
        
        return VehicleProfileResponse(**vehicle)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching vehicle profile: {str(e)}")
