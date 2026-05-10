#!/usr/bin/env python
"""
Test script to demonstrate all FastAPI endpoints with sample requests
"""

import requests
import json
from typing import Dict, Any

# Base URL for the API
BASE_URL = "http://localhost:8000"

def print_response(title: str, response: requests.Response):
    """Pretty print API response"""
    print(f"\n{'='*80}")
    print(f"✓ {title}")
    print(f"{'='*80}")
    print(f"Status Code: {response.status_code}")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)

def test_health():
    """Test health check endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print_response("GET /health", response)
    except Exception as e:
        print(f"✗ Health check failed: {e}")

def test_metrics():
    """Test metrics endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/api/metrics")
        print_response("GET /api/metrics", response)
    except Exception as e:
        print(f"✗ Metrics failed: {e}")

def test_root():
    """Test root endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/")
        print_response("GET /", response)
    except Exception as e:
        print(f"✗ Root endpoint failed: {e}")

def test_charging_stations():
    """Test charging stations endpoint"""
    try:
        # Get all stations
        response = requests.get(f"{BASE_URL}/api/charging-stations")
        print_response("GET /api/charging-stations", response)
        
        # Get only online stations
        response = requests.get(f"{BASE_URL}/api/charging-stations?online_only=true")
        print_response("GET /api/charging-stations (online only)", response)
        
        # Get specific station
        response = requests.get(f"{BASE_URL}/api/charging-stations/1")
        print_response("GET /api/charging-stations/1", response)
    except Exception as e:
        print(f"✗ Charging stations test failed: {e}")

def test_vehicle_profiles():
    """Test vehicle profiles endpoint"""
    try:
        # Get all profiles
        response = requests.get(f"{BASE_URL}/api/vehicle-profiles")
        print_response("GET /api/vehicle-profiles", response)
        
        # Get profiles by connector type
        response = requests.get(f"{BASE_URL}/api/vehicle-profiles?connector_type=CCS")
        print_response("GET /api/vehicle-profiles (CCS only)", response)
        
        # Get specific vehicle
        response = requests.get(f"{BASE_URL}/api/vehicle-profiles/1")
        print_response("GET /api/vehicle-profiles/1", response)
    except Exception as e:
        print(f"✗ Vehicle profiles test failed: {e}")

def test_simulation_advanced():
    """Test advanced simulation endpoint"""
    try:
        # Test slow charging mode
        payload = {
            "battery_capacity_kWh": 75.0,
            "current_soc": 20.0,
            "target_soc": 80.0,
            "grid_voltage": 400.0,
            "ambient_temp_celsius": 25.0,
            "charging_mode": "slow"
        }
        response = requests.post(f"{BASE_URL}/api/simulate", json=payload)
        print_response("POST /api/simulate (SLOW mode)", response)
        
        # Test fast charging mode
        payload["charging_mode"] = "fast"
        payload["current_soc"] = 10.0
        response = requests.post(f"{BASE_URL}/api/simulate", json=payload)
        print_response("POST /api/simulate (FAST mode)", response)
        
        # Test dynamic charging mode
        payload["charging_mode"] = "dynamic"
        payload["current_soc"] = 30.0
        payload["ambient_temp_celsius"] = 35.0  # Hot weather
        response = requests.post(f"{BASE_URL}/api/simulate", json=payload)
        print_response("POST /api/simulate (DYNAMIC mode, hot weather)", response)
        
        # Test cold weather scenario
        payload["charging_mode"] = "slow"
        payload["ambient_temp_celsius"] = -5.0
        response = requests.post(f"{BASE_URL}/api/simulate", json=payload)
        print_response("POST /api/simulate (SLOW mode, cold weather)", response)
        
    except Exception as e:
        print(f"✗ Simulation test failed: {e}")

def test_simulation_error_handling():
    """Test error handling in simulation"""
    try:
        print("\n" + "="*80)
        print("Testing Error Handling")
        print("="*80)
        
        # Test invalid SOC range
        payload = {
            "battery_capacity_kWh": 75.0,
            "current_soc": 150.0,  # Invalid
            "target_soc": 80.0,
            "grid_voltage": 400.0,
            "ambient_temp_celsius": 25.0,
            "charging_mode": "slow"
        }
        response = requests.post(f"{BASE_URL}/api/simulate", json=payload)
        print_response("Error Test: Invalid SOC (150%)", response)
        
        # Test target < current
        payload["current_soc"] = 80.0
        payload["target_soc"] = 20.0
        response = requests.post(f"{BASE_URL}/api/simulate", json=payload)
        print_response("Error Test: Target SOC < Current SOC", response)
        
        # Test invalid charging mode
        payload["current_soc"] = 20.0
        payload["target_soc"] = 80.0
        payload["charging_mode"] = "invalid_mode"
        response = requests.post(f"{BASE_URL}/api/simulate", json=payload)
        print_response("Error Test: Invalid Charging Mode", response)
        
        # Test invalid grid voltage
        payload["charging_mode"] = "slow"
        payload["grid_voltage"] = -100.0
        response = requests.post(f"{BASE_URL}/api/simulate", json=payload)
        print_response("Error Test: Negative Grid Voltage", response)
        
    except Exception as e:
        print(f"✗ Error handling test failed: {e}")

def test_legacy_simulation():
    """Test legacy simulation endpoint for backward compatibility"""
    try:
        payload = {
            "battery_capacity": 100.0,
            "current_battery": 20.0,
            "charger_power": 50.0,
            "ambient_temperature": 25.0
        }
        response = requests.post(f"{BASE_URL}/api/simulate/legacy", json=payload)
        print_response("POST /api/simulate/legacy (backward compatibility)", response)
    except Exception as e:
        print(f"✗ Legacy simulation test failed: {e}")

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("EV Charging Simulator API - Test Suite")
    print("="*80)
    print(f"API Base URL: {BASE_URL}")
    print("Starting tests...\n")
    
    # Test basic endpoints
    test_root()
    test_health()
    test_metrics()
    
    # Test data endpoints
    test_charging_stations()
    test_vehicle_profiles()
    
    # Test simulation endpoints
    test_simulation_advanced()
    test_simulation_error_handling()
    test_legacy_simulation()
    
    print("\n" + "="*80)
    print("✓ All tests completed!")
    print("="*80 + "\n")

if __name__ == "__main__":
    main()
