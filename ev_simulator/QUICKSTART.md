# EV Charging Simulator - Quick Start Guide

## 🚀 Project Overview
Your full-stack EV dynamic charging simulator is ready! The project includes:

- **Frontend**: React + Vite (Port 5173) - Interactive UI with charging controls & dashboard
- **Backend**: FastAPI (Port 8000) - REST API with CORS enabled for frontend
- **Model**: Python simulation engine - ML-based charging dynamics calculations
- **Docker Support**: Complete docker-compose setup for containerized deployment

## 📂 Project Structure
```
ev_simulator/
├── frontend/              # React + Vite application
│   ├── src/
│   │   ├── components/    # React components (ChargingSimulator, Dashboard)
│   │   ├── App.jsx        # Main app with health check
│   │   └── main.jsx       # Entry point
│   ├── package.json       # Dependencies: React, Axios, Recharts
│   ├── vite.config.js     # Vite configuration with API proxy
│   └── Dockerfile         # Container config for frontend
│
├── backend/               # FastAPI application
│   ├── routes/            # API routes (health, simulation)
│   ├── main.py            # FastAPI app with CORS middleware
│   ├── config.py          # Configuration & environment variables
│   ├── schemas.py         # Pydantic data models
│   ├── simulator.py       # Core charging simulation engine
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile         # Container config for backend
│
├── model/                 # ML/Simulation models
│   ├── charging_models.py # Physics-based battery model
│   └── __init__.py        # Package initialization
│
├── docker-compose.yml     # Multi-container orchestration
├── .env                   # Environment variables (configured)
├── .env.example           # Environment template
└── README.md              # Full documentation
```

## ✅ What's Been Set Up

### Frontend
- ✅ React + Vite configured (HMR enabled)
- ✅ Charging simulator interface with sliders for:
  - Battery capacity (10-200 kWh)
  - Charger power (7-350 kW)
  - Ambient temperature (-20 to 50°C)
  - Current battery level
- ✅ Real-time dashboard with metrics
- ✅ Recharts integration for trending data
- ✅ API communication via Axios
- ✅ Responsive design with gradient UI

### Backend
- ✅ FastAPI with Uvicorn
- ✅ CORS middleware configured for frontend (localhost:5173)
- ✅ API endpoints:
  - `GET /health` - Health check
  - `GET /metrics` - System metrics
  - `POST /api/simulate/start` - Run charging simulation
- ✅ Input validation with Pydantic
- ✅ Error handling & logging
- ✅ Interactive API docs at `/docs`

### Model
- ✅ Physics-based battery charging simulation
- ✅ Thermal dynamics calculation
- ✅ Efficiency estimation with temperature/power factors
- ✅ Cost estimation based on electricity rates
- ✅ Energy loss calculation

### Environment Variables
- ✅ `VITE_API_BASE_URL` - Frontend API URL
- ✅ `MODEL_PATH` - ML model path
- ✅ `SECRET_KEY` - Application security key
- ✅ All in `.env` file (ready to use)

## 🏃 How to Run

### Option 1: Local Development (Recommended for Development)

**Terminal 1 - Start Backend:**
```bash
cd backend
python main.py
```
Backend runs on http://localhost:8000

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on http://localhost:5173

**Access the App:**
- UI: http://localhost:5173
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### Option 2: Docker Compose (Recommended for Deployment)

```bash
docker-compose up --build
```

Services:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option 3: Production Build

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

## 🧪 Testing the API

### Using curl:
```bash
# Health check
curl http://localhost:8000/health

# Get metrics
curl http://localhost:8000/api/metrics

# Start simulation
curl -X POST http://localhost:8000/api/simulate/start \
  -H "Content-Type: application/json" \
  -d '{
    "battery_capacity": 100,
    "current_battery": 20,
    "charger_power": 50,
    "ambient_temperature": 25
  }'
```

### Using the Web UI:
1. Open http://localhost:5173
2. Adjust the sliders for battery capacity, charger power, and temperature
3. Click "Start Simulation"
4. View results and real-time dashboard metrics

## 🔧 Configuration

### Frontend Configuration (`frontend/vite.config.js`)
- Port: 5173
- API Proxy configured to backend on port 8000
- React plugin enabled
- HMR enabled for development

### Backend Configuration (`backend/config.py`)
- Port: 8000
- CORS enabled for frontend
- Default efficiency: 90%
- Electricity cost: $0.15/kWh
- Thermal loss coefficient: 5%

### Customization Options:
Edit `.env` to change:
```env
VITE_API_BASE_URL=http://localhost:8000
PORT=8000
SECRET_KEY=your-secret-key
ELECTRICITY_COST_PER_KWH=0.15
DEFAULT_EFFICIENCY=0.90
```

## 📊 API Response Example

```json
{
  "charging_time_minutes": 127.5,
  "final_battery_percentage": 100.0,
  "battery_temperature_rise": 15.3,
  "efficiency_percentage": 92.5,
  "energy_loss_kwh": 3.2,
  "cost_estimate": 55.80,
  "status": "success"
}
```

## 🛠️ Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9

# Kill process on port 8000 (backend)
lsof -ti:8000 | xargs kill -9
```

### CORS Errors
- Ensure backend is running on http://localhost:8000
- Check `.env` has correct `VITE_API_BASE_URL`
- Backend CORS configuration in `backend/config.py` includes your frontend URL

### Module Not Found
```bash
# Backend
cd backend && pip install -r requirements.txt

# Frontend
cd frontend && npm install
```

## 📝 Next Steps

1. **Customize Simulation**: Edit `backend/simulator.py` for custom charging logic
2. **Enhance UI**: Add more charts/controls in `frontend/src/components/`
3. **Database Integration**: Add persistence layer to backend
4. **Authentication**: Implement JWT-based auth in FastAPI
5. **Testing**: Add pytest tests for backend, Jest for frontend
6. **Deployment**: Push to cloud (AWS, Azure, GCP, Heroku)

## 📚 Key Technologies

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 18.2.0 |
| Frontend Framework | Vite | 5.0.0 |
| Backend | FastAPI | 0.104.1 |
| Backend Server | Uvicorn | 0.24.0 |
| Data Validation | Pydantic | 2.5.0 |
| ML/Science | NumPy, SciPy | Latest |
| Containerization | Docker, Docker Compose | Latest |

## 💡 Features Implemented

✅ Real-time charging simulation with physics-based model
✅ Interactive UI with parameter sliders
✅ Live dashboard with trending charts
✅ CORS-enabled REST API
✅ Input validation & error handling
✅ Docker containerization
✅ Environment-based configuration
✅ Interactive API documentation
✅ Health checks & metrics endpoints
✅ Thermal dynamics calculation
✅ Efficiency estimation
✅ Cost estimation

## 🎯 Architecture Highlights

- **Separation of Concerns**: Frontend, backend, and model are decoupled
- **Scalability**: Ready for horizontal scaling with containers
- **Maintainability**: Clean code structure with proper routing and config
- **Security**: CORS configured, environment variables for secrets
- **Documentation**: Interactive API docs, comprehensive README
- **Development**: Hot reload for both frontend and backend

---

**You're all set!** 🎉 Your EV Charging Simulator is ready to go. Start with Option 1 for development or Option 2 for containerized deployment.
