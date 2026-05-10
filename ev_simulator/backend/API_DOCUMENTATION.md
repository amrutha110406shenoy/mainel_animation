# EV Charging Simulator - FastAPI Backend Documentation

## Overview

This backend provides REST APIs for EV charging simulation, charging station management, and vehicle profile management.

**Base URL:** `http://localhost:8000`

**API Documentation (Interactive):** `http://localhost:8000/docs`

---

## Endpoints

### 1. Health & Metrics

#### GET `/health`
Health check endpoint
```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "EV Charging Simulator API",
  "version": "1.0.0"
}
```

---

#### GET `/api/metrics`
Get real-time system metrics
```bash
curl http://localhost:8000/api/metrics
```

**Response:**
```json
{
  "current_temperature": 25.0,
  "average_efficiency": 92.5,
  "total_sessions": 5,
  "average_charge_time": 45.0
}
```

---

### 2. Charging Simulation

#### POST `/api/simulate`
**Advanced simulation with multiple charging modes and charge curve**

```bash
curl -X POST http://localhost:8000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "battery_capacity_kWh": 75,
    "current_soc": 20,
    "target_soc": 80,
    "grid_voltage": 400,
    "ambient_temp_celsius": 25,
    "charging_mode": "fast"
  }'
```

**Request Fields:**
| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `battery_capacity_kWh` | float | > 0 | Total battery capacity in kWh |
| `current_soc` | float | 0-100 | Current state of charge (%) |
| `target_soc` | float | 0-100 | Target state of charge (%) |
| `grid_voltage` | float | > 0 | Grid voltage in volts |
| `ambient_temp_celsius` | float | -50 to 60 | Ambient temperature in Celsius |
| `charging_mode` | string | slow\|fast\|dynamic | Charging mode |

**Charging Modes:**
- `slow`: 7kW (AC charging), high efficiency, longer time
- `fast`: ~50kW (DC fast charging), good balance
- `dynamic`: ~35kW, adapts to conditions

**Response:**
```json
{
  "estimated_time_minutes": 127.5,
  "energy_delivered_kWh": 45.0,
  "cost_estimate_inr": 360.0,
  "efficiency_percent": 92.5,
  "charge_curve": [
    {
      "time": 0.0,
      "soc": 20.0,
      "power_kw": 35.2
    },
    {
      "time": 5.0,
      "soc": 23.5,
      "power_kw": 34.8
    },
    {
      "time": 10.0,
      "soc": 27.1,
      "power_kw": 34.5
    },
    ...
    {
      "time": 127.5,
      "soc": 80.0,
      "power_kw": 0.5
    }
  ],
  "thermal_status": "normal",
  "status": "success"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `estimated_time_minutes` | float | Time to charge from current to target SOC |
| `energy_delivered_kWh` | float | Energy that will be delivered to battery |
| `cost_estimate_inr` | float | Estimated cost in Indian Rupees |
| `efficiency_percent` | float | Charging efficiency (80-95%) |
| `charge_curve` | array | Time series data points of charging profile |
| `thermal_status` | string | Battery thermal status (normal/warm/hot) |

**Charge Curve Point:**
| Field | Type | Description |
|-------|------|-------------|
| `time` | float | Elapsed time in minutes |
| `soc` | float | State of charge at this point (%) |
| `power_kw` | float | Charging power at this point (kW) |

**Thermal Status Indicators:**
- `normal`: Temperature rise < 80°C equivalent heat generation
- `warm`: Temperature rise 80-150°C equivalent
- `hot`: Temperature rise > 150°C equivalent (throttling occurs)

---

#### POST `/api/simulate/legacy`
**Legacy simulation endpoint (backward compatible)**

```bash
curl -X POST http://localhost:8000/api/simulate/legacy \
  -H "Content-Type: application/json" \
  -d '{
    "battery_capacity": 100,
    "current_battery": 20,
    "charger_power": 50,
    "ambient_temperature": 25
  }'
```

**Request Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `battery_capacity` | float | Battery capacity in kWh |
| `current_battery` | float | Current battery level (%) |
| `charger_power` | float | Charger power in kW |
| `ambient_temperature` | float | Ambient temperature in °C |

---

### 3. Charging Stations

#### GET `/api/charging-stations`
Get list of available charging stations

```bash
# Get all stations
curl http://localhost:8000/api/charging-stations

# Get only online stations
curl http://localhost:8000/api/charging-stations?online_only=true
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `online_only` | boolean | Filter only online stations |
| `city` | string | Filter by city name (optional) |

**Response:**
```json
{
  "stations": [
    {
      "id": 1,
      "name": "Tesla Supercharger - Bangalore Downtown",
      "location": "Brigade Gateway, Bangalore",
      "lat": 12.9352,
      "lng": 77.6245,
      "available_ports": 8,
      "max_power_kW": 350,
      "price_per_kWh": 8.5,
      "is_online": true
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
      "is_online": true
    },
    ...
  ],
  "total_count": 8,
  "status": "success"
}
```

---

#### GET `/api/charging-stations/{station_id}`
Get details of a specific charging station

```bash
curl http://localhost:8000/api/charging-stations/1
```

**Response:** Single station object (see above format)

---

### 4. Vehicle Profiles

#### GET `/api/vehicle-profiles`
Get list of available EV vehicle profiles

```bash
# Get all profiles
curl http://localhost:8000/api/vehicle-profiles

# Filter by connector type
curl http://localhost:8000/api/vehicle-profiles?connector_type=CCS
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `connector_type` | string | Filter by connector (CCS, CHAdeMO, NACS, Type2) |

**Response:**
```json
{
  "vehicles": [
    {
      "id": 1,
      "name": "Tesla Model 3",
      "battery_capacity_kWh": 75,
      "max_charge_rate_kW": 250,
      "connector_type": "NACS",
      "efficiency_percent": 94
    },
    {
      "id": 2,
      "name": "Hyundai Kona Electric",
      "battery_capacity_kWh": 64,
      "max_charge_rate_kW": 77,
      "connector_type": "CCS",
      "efficiency_percent": 91
    },
    ...
  ],
  "total_count": 5,
  "status": "success"
}
```

---

#### GET `/api/vehicle-profiles/{vehicle_id}`
Get details of a specific vehicle profile

```bash
curl http://localhost:8000/api/vehicle-profiles/1
```

**Response:** Single vehicle object (see above format)

---

## Error Handling

All endpoints return proper HTTP status codes and error messages:

### HTTP Status Codes
- `200 OK` - Successful request
- `400 Bad Request` - Invalid input parameters
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Server error

### Error Response Format
```json
{
  "detail": "Error message describing what went wrong"
}
```

### Example Errors

**Invalid SOC:**
```bash
curl -X POST http://localhost:8000/api/simulate \
  -d '{"battery_capacity_kWh": 75, "current_soc": 150, ...}'
```
```json
{
  "detail": "Current SOC must be between 0 and 100"
}
```

**Target SOC < Current SOC:**
```json
{
  "detail": "Target SOC must be greater than or equal to current SOC"
}
```

**Invalid Charging Mode:**
```json
{
  "detail": "Charging mode must be 'slow', 'fast', or 'dynamic'"
}
```

---

## Example Use Cases

### Fast Charge to 80%
```bash
curl -X POST http://localhost:8000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "battery_capacity_kWh": 75,
    "current_soc": 10,
    "target_soc": 80,
    "grid_voltage": 400,
    "ambient_temp_celsius": 25,
    "charging_mode": "fast"
  }'
```

### Slow Charge in Cold Weather
```bash
curl -X POST http://localhost:8000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "battery_capacity_kWh": 64,
    "current_soc": 30,
    "target_soc": 100,
    "grid_voltage": 400,
    "ambient_temp_celsius": -5,
    "charging_mode": "slow"
  }'
```

### Dynamic Charge to Full
```bash
curl -X POST http://localhost:8000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "battery_capacity_kWh": 50,
    "current_soc": 5,
    "target_soc": 100,
    "grid_voltage": 230,
    "ambient_temp_celsius": 35,
    "charging_mode": "dynamic"
  }'
```

---

## Data Models

### Pydantic Validation Rules

**SimulationRequest:**
- `battery_capacity_kWh`: Must be > 0
- `current_soc`: Must be 0-100
- `target_soc`: Must be 0-100 and >= current_soc
- `grid_voltage`: Must be > 0
- `ambient_temp_celsius`: Must be -50 to 60
- `charging_mode`: Must be "slow", "fast", or "dynamic"

**ChargingStationResponse:**
- `lat`: -90 to 90 (latitude)
- `lng`: -180 to 180 (longitude)
- `available_ports`: >= 0
- `max_power_kW`: > 0
- `price_per_kWh`: > 0

**VehicleProfileResponse:**
- `battery_capacity_kWh`: > 0
- `max_charge_rate_kW`: > 0
- `efficiency_percent`: 50-100

---

## Testing

Run the included test script to verify all endpoints:

```bash
cd backend
python test_api.py
```

This will test all endpoints with various scenarios and error cases.

---

## Integration with Frontend

The frontend should call:

**For charging simulation:**
```javascript
const response = await axios.post('http://localhost:8000/api/simulate', {
  battery_capacity_kWh: 75,
  current_soc: 20,
  target_soc: 80,
  grid_voltage: 400,
  ambient_temp_celsius: 25,
  charging_mode: 'fast'
});
```

**For charging stations:**
```javascript
const response = await axios.get('http://localhost:8000/api/charging-stations?online_only=true');
```

**For vehicle profiles:**
```javascript
const response = await axios.get('http://localhost:8000/api/vehicle-profiles?connector_type=CCS');
```

---

## Performance Notes

- Charge curve generation: ~50-100ms per simulation
- All responses include proper caching headers
- Metrics endpoint updates every 30 seconds
- Mock data is loaded in memory (no database calls)

---

## Future Enhancements

- [ ] Database integration for persistent station data
- [ ] Real-time station availability updates
- [ ] User authentication and authorization
- [ ] Rate limiting per API key
- [ ] Webhook support for long-running simulations
- [ ] GraphQL endpoint
- [ ] WebSocket for real-time charge updates
