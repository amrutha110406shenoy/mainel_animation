# EV Charging Simulator
Full-stack EV dynamic charging simulator with real-time ML-based simulation

## Project Structure

```
ev_simulator/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChargingSimulator.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── backend/           # FastAPI backend
│   ├── routes/
│   │   ├── health.py
│   │   └── simulation.py
│   ├── main.py
│   ├── config.py
│   ├── schemas.py
│   ├── simulator.py
│   ├── requirements.txt
│   └── Dockerfile
├── model/             # ML/Simulation models
│   ├── charging_models.py
│   └── __init__.py
├── docker-compose.yml
├── .env
└── .env.example
```

## Features

- **Frontend (React + Vite)**
  - Real-time charging simulation interface
  - Interactive control sliders for battery capacity, charger power, ambient temperature
  - Live dashboard with metrics and trend charts
  - Responsive design with gradient UI

- **Backend (FastAPI)**
  - CORS enabled for frontend communication
  - RESTful API with `/api/simulate/start` endpoint
  - Health check and metrics endpoints
  - Input validation and error handling

- **Model (Python)**
  - Physics-based battery charging simulation
  - Thermal dynamics calculation
  - Efficiency estimation
  - Cost calculation

## Setup

### Prerequisites
- Node.js 18+ (for frontend)
- Python 3.9+ (for backend)
- Docker & Docker Compose (optional)

### Quick Start (Local Development)

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

#### Backend Setup
```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
Backend runs on `http://localhost:8000`

### Docker Setup

```bash
# Build and start all services
docker-compose up --build

# Services will be available at:
# Frontend: http://localhost:5173
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## API Endpoints

### Start Simulation
```
POST /api/simulate/start
Content-Type: application/json

{
  "battery_capacity": 100,
  "current_battery": 20,
  "charger_power": 50,
  "ambient_temperature": 25
}
```

### Get Metrics
```
GET /api/metrics
```

### Health Check
```
GET /health
```

## Configuration

Edit `.env` file to customize:
- `VITE_API_BASE_URL` - Frontend API URL
- `MODEL_PATH` - Path to ML model
- `SECRET_KEY` - Application secret key
- Other simulation parameters

## Environment Variables

- `VITE_API_BASE_URL`: Frontend API base URL (default: `http://localhost:8000`)
- `MODEL_PATH`: Path to charging model (default: `./model/charging_model.pkl`)
- `SECRET_KEY`: Application secret key (change in production!)

## Technology Stack

- **Frontend**: React 18, Vite, Axios, Recharts, Lucide Icons
- **Backend**: FastAPI, Uvicorn, Pydantic
- **Model**: NumPy, SciPy
- **DevOps**: Docker, Docker Compose

## Development

### Running Tests
```bash
cd backend
pytest
```

### API Documentation
Once running, visit `http://localhost:8000/docs` for interactive Swagger UI

## License

MIT
