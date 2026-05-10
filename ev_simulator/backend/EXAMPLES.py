#!/usr/bin/env python3
"""
Example API calls demonstrating the complete EV Charging Simulator backend

These examples show how to use each endpoint with realistic scenarios
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def pretty_print(title: str, response: dict):
    """Pretty print API response"""
    print(f"\n{'='*80}")
    print(f"📋 {title}")
    print(f"{'='*80}")
    print(json.dumps(response, indent=2))

# ============================================================================
# EXAMPLE 1: Fast Charging - Quick Top-up
# ============================================================================
print("\n" + "🔋 EXAMPLE 1: Fast Charging (Quick Top-up)")
print("Scenario: Tesla Model 3 needs quick 10-80% charge")

fast_charge_payload = {
    "battery_capacity_kWh": 75.0,
    "current_soc": 10.0,
    "target_soc": 80.0,
    "grid_voltage": 400.0,
    "ambient_temp_celsius": 25.0,
    "charging_mode": "fast"
}

print(f"Request: {json.dumps(fast_charge_payload, indent=2)}")
# response = requests.post(f"{BASE_URL}/api/simulate", json=fast_charge_payload)
# pretty_print("Fast Charge Response", response.json())

# ============================================================================
# EXAMPLE 2: Slow Charging - Overnight Charge
# ============================================================================
print("\n" + "🌙 EXAMPLE 2: Slow Charging (Overnight)")
print("Scenario: Hyundai Kona does full overnight charge in AC")

slow_charge_payload = {
    "battery_capacity_kWh": 64.0,
    "current_soc": 20.0,
    "target_soc": 100.0,
    "grid_voltage": 230.0,
    "ambient_temp_celsius": 22.0,
    "charging_mode": "slow"
}

print(f"Request: {json.dumps(slow_charge_payload, indent=2)}")
# response = requests.post(f"{BASE_URL}/api/simulate", json=slow_charge_payload)
# pretty_print("Slow Charge Response", response.json())

# ============================================================================
# EXAMPLE 3: Dynamic Charging - Smart Adaptive
# ============================================================================
print("\n" + "⚡ EXAMPLE 3: Dynamic Charging (Adaptive)")
print("Scenario: MG ZS EV uses dynamic mode for optimal efficiency")

dynamic_charge_payload = {
    "battery_capacity_kWh": 50.0,
    "current_soc": 30.0,
    "target_soc": 90.0,
    "grid_voltage": 380.0,
    "ambient_temp_celsius": 28.0,
    "charging_mode": "dynamic"
}

print(f"Request: {json.dumps(dynamic_charge_payload, indent=2)}")
# response = requests.post(f"{BASE_URL}/api/simulate", json=dynamic_charge_payload)
# pretty_print("Dynamic Charge Response", response.json())

# ============================================================================
# EXAMPLE 4: Cold Weather Charging
# ============================================================================
print("\n" + "❄️  EXAMPLE 4: Cold Weather Charging")
print("Scenario: Nissan Leaf charging in winter (-5°C)")

cold_weather_payload = {
    "battery_capacity_kWh": 62.0,
    "current_soc": 15.0,
    "target_soc": 85.0,
    "grid_voltage": 400.0,
    "ambient_temp_celsius": -5.0,
    "charging_mode": "slow"
}

print(f"Request: {json.dumps(cold_weather_payload, indent=2)}")
print("Note: Power derating to 80% due to cold temperature")
# response = requests.post(f"{BASE_URL}/api/simulate", json=cold_weather_payload)
# pretty_print("Cold Weather Charge Response", response.json())

# ============================================================================
# EXAMPLE 5: Hot Weather Charging
# ============================================================================
print("\n" + "🌞 EXAMPLE 5: Hot Weather Charging")
print("Scenario: Tata Nexon EV charging in extreme heat (45°C)")

hot_weather_payload = {
    "battery_capacity_kWh": 75.0,
    "current_soc": 25.0,
    "target_soc": 75.0,
    "grid_voltage": 400.0,
    "ambient_temp_celsius": 45.0,
    "charging_mode": "dynamic"
}

print(f"Request: {json.dumps(hot_weather_payload, indent=2)}")
print("Note: Power derating to 70% due to extreme heat")
# response = requests.post(f"{BASE_URL}/api/simulate", json=hot_weather_payload)
# pretty_print("Hot Weather Charge Response", response.json())

# ============================================================================
# EXAMPLE 6: Get All Charging Stations
# ============================================================================
print("\n" + "🏁 EXAMPLE 6: Find Available Charging Stations")

print("Request: GET /api/charging-stations")
# response = requests.get(f"{BASE_URL}/api/charging-stations")
# pretty_print("All Charging Stations", response.json())

print("\nRequest: GET /api/charging-stations?online_only=true")
# response = requests.get(f"{BASE_URL}/api/charging-stations?online_only=true")
# pretty_print("Online Charging Stations Only", response.json())

# ============================================================================
# EXAMPLE 7: Get Specific Charging Station
# ============================================================================
print("\n" + "📍 EXAMPLE 7: Get Specific Charging Station Details")

print("Request: GET /api/charging-stations/1")
station_example = {
    "id": 1,
    "name": "Tesla Supercharger - Bangalore Downtown",
    "location": "Brigade Gateway, Bangalore",
    "lat": 12.9352,
    "lng": 77.6245,
    "available_ports": 8,
    "max_power_kW": 350,
    "price_per_kWh": 8.5,
    "is_online": True
}
print(json.dumps(station_example, indent=2))

# ============================================================================
# EXAMPLE 8: Get All Vehicle Profiles
# ============================================================================
print("\n" + "🚗 EXAMPLE 8: Get Available Vehicle Profiles")

print("Request: GET /api/vehicle-profiles")
# response = requests.get(f"{BASE_URL}/api/vehicle-profiles")
# pretty_print("All Vehicle Profiles", response.json())

print("\nRequest: GET /api/vehicle-profiles?connector_type=CCS")
# response = requests.get(f"{BASE_URL}/api/vehicle-profiles?connector_type=CCS")
# pretty_print("CCS Connector Vehicles", response.json())

# ============================================================================
# EXAMPLE 9: Get Specific Vehicle Profile
# ============================================================================
print("\n" + "🏎️  EXAMPLE 9: Get Specific Vehicle Profile")

print("Request: GET /api/vehicle-profiles/1")
vehicle_example = {
    "id": 1,
    "name": "Tesla Model 3",
    "battery_capacity_kWh": 75,
    "max_charge_rate_kW": 250,
    "connector_type": "NACS",
    "efficiency_percent": 94
}
print(json.dumps(vehicle_example, indent=2))

# ============================================================================
# EXAMPLE 10: Error Handling - Invalid SOC
# ============================================================================
print("\n" + "⚠️  EXAMPLE 10: Error Handling - Invalid SOC")

invalid_soc_payload = {
    "battery_capacity_kWh": 75.0,
    "current_soc": 150.0,  # ❌ Invalid: > 100%
    "target_soc": 80.0,
    "grid_voltage": 400.0,
    "ambient_temp_celsius": 25.0,
    "charging_mode": "fast"
}

print(f"Request: {json.dumps(invalid_soc_payload, indent=2)}")
error_response = {
    "detail": "Current SOC must be between 0 and 100"
}
print("Expected Response:")
print(json.dumps(error_response, indent=2))

# ============================================================================
# EXAMPLE 11: Error Handling - Target < Current
# ============================================================================
print("\n" + "⚠️  EXAMPLE 11: Error Handling - Target SOC < Current SOC")

invalid_target_payload = {
    "battery_capacity_kWh": 75.0,
    "current_soc": 80.0,
    "target_soc": 20.0,  # ❌ Invalid: < current_soc
    "grid_voltage": 400.0,
    "ambient_temp_celsius": 25.0,
    "charging_mode": "fast"
}

print(f"Request: {json.dumps(invalid_target_payload, indent=2)}")
error_response = {
    "detail": "Target SOC must be greater than or equal to current SOC"
}
print("Expected Response:")
print(json.dumps(error_response, indent=2))

# ============================================================================
# EXAMPLE 12: Error Handling - Invalid Charging Mode
# ============================================================================
print("\n" + "⚠️  EXAMPLE 12: Error Handling - Invalid Charging Mode")

invalid_mode_payload = {
    "battery_capacity_kWh": 75.0,
    "current_soc": 20.0,
    "target_soc": 80.0,
    "grid_voltage": 400.0,
    "ambient_temp_celsius": 25.0,
    "charging_mode": "turbo"  # ❌ Invalid mode
}

print(f"Request: {json.dumps(invalid_mode_payload, indent=2)}")
error_response = {
    "detail": "Charging mode must be 'slow', 'fast', or 'dynamic'"
}
print("Expected Response:")
print(json.dumps(error_response, indent=2))

# ============================================================================
# EXAMPLE 13: Real-world Scenario - Fleet Charging
# ============================================================================
print("\n" + "🚙 EXAMPLE 13: Real-World Scenario - Fleet Charging")
print("Scenario: Company manages 3 EVs in different conditions")

fleet_vehicles = [
    {
        "vehicle": "Tesla Model 3 (Vehicle 1)",
        "location": "Bangalore Supercharger",
        "payload": {
            "battery_capacity_kWh": 75.0,
            "current_soc": 5.0,
            "target_soc": 80.0,
            "grid_voltage": 400.0,
            "ambient_temp_celsius": 28.0,
            "charging_mode": "fast"
        }
    },
    {
        "vehicle": "Hyundai Kona Electric (Vehicle 2)",
        "location": "Office AC Charger",
        "payload": {
            "battery_capacity_kWh": 64.0,
            "current_soc": 30.0,
            "target_soc": 100.0,
            "grid_voltage": 230.0,
            "ambient_temp_celsius": 25.0,
            "charging_mode": "slow"
        }
    },
    {
        "vehicle": "Tata Nexon EV Max (Vehicle 3)",
        "location": "Public DC Charger",
        "payload": {
            "battery_capacity_kWh": 75.0,
            "current_soc": 15.0,
            "target_soc": 90.0,
            "grid_voltage": 400.0,
            "ambient_temp_celsius": 32.0,
            "charging_mode": "dynamic"
        }
    }
]

for vehicle_info in fleet_vehicles:
    print(f"\n{vehicle_info['vehicle']} at {vehicle_info['location']}")
    print(f"Payload: {json.dumps(vehicle_info['payload'], indent=2)}")

# ============================================================================
# EXAMPLE 14: Health Check
# ============================================================================
print("\n" + "💚 EXAMPLE 14: Health Check")

print("Request: GET /health")
health_response = {
    "status": "healthy",
    "service": "EV Charging Simulator API",
    "version": "1.0.0"
}
print("Expected Response:")
print(json.dumps(health_response, indent=2))

# ============================================================================
# EXAMPLE 15: System Metrics
# ============================================================================
print("\n" + "📊 EXAMPLE 15: Get System Metrics")

print("Request: GET /api/metrics")
metrics_response = {
    "current_temperature": 25.0,
    "average_efficiency": 92.5,
    "total_sessions": 15,
    "average_charge_time": 87.3
}
print("Expected Response:")
print(json.dumps(metrics_response, indent=2))

# ============================================================================
# Summary
# ============================================================================
print("\n" + "="*80)
print("📚 EXAMPLE SCENARIOS COMPLETE")
print("="*80)
print("""
To run these examples live:

1. Start the backend:
   cd backend
   python main.py

2. In another terminal, run:
   python test_api.py

Or use the interactive API documentation:
   http://localhost:8000/docs

Key Endpoints:
- POST /api/simulate                      - Advanced charging simulation
- POST /api/simulate/legacy              - Legacy simulation (backward compatible)
- GET  /api/charging-stations             - List all charging stations
- GET  /api/charging-stations/{id}        - Get specific station
- GET  /api/vehicle-profiles              - List all vehicle profiles
- GET  /api/vehicle-profiles/{id}         - Get specific vehicle
- GET  /health                            - Health check
- GET  /api/metrics                       - System metrics

Supported Charging Modes:
- slow:    AC charging (~7kW), efficient, longer time
- fast:    DC charging (~35-50kW), quick top-up
- dynamic: Adaptive charging, balanced approach
""")
print("="*80 + "\n")
