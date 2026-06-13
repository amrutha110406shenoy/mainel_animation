import os
from dotenv import load_dotenv

load_dotenv()

# API Configuration
API_TITLE = "EV Charging Simulator API"
API_VERSION = "1.0.0"
API_DESCRIPTION = "Real-time EV dynamic charging simulation engine"

# Server
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

# Model
MODEL_PATH = os.getenv("MODEL_PATH", "./model/charging_model.pkl")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")

# CORS
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_CREDENTIALS = True
CORS_METHODS = ["*"]
CORS_HEADERS = ["*"]

# Simulation defaults
DEFAULT_EFFICIENCY = 0.90
DEFAULT_AMBIENT_TEMP = 25
THERMAL_LOSS_COEFFICIENT = 0.05
ELECTRICITY_COST_PER_KWH = 0.15
