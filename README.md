# EV Dynamic Charging Simulator

A full-stack, AI-powered web application that creates a live, animated digital-twin visualization of an EV charging station. Uses a Reinforcement Learning (RL) model to optimize charging decisions based on dynamic TOU tariffs, battery SoC, wait times, and solar energy availability.

## Architecture

- **Backend**: Python 3.11, FastAPI, Uvicorn, OpenAI Gymnasium, Stable-Baselines3
- **Frontend**: React 18, Vite, Recharts, Framer Motion, React-Leaflet
- **Deployment**: Docker Compose, Nginx

## Running Locally (Development)

1. Start the Backend:
   ```bash
   cd backend
   python -m venv venv
   # activate venv
   pip install -r requirements.txt
   # Generate synthetic data if not already present
   python data/generate_datasets.py
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. Start the Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Running with Docker (Production)

```bash
docker-compose up --build
```
Access the application at `http://localhost:3000`.
