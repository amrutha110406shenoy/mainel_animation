"""
CSV dataset loader – loads both EV charging datasets at startup.
DataFrames are cached in app.state by FastAPI's startup event.
"""
import pandas as pd
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent.parent.parent / "data"


def load_session_reports(path: str | None = None) -> pd.DataFrame:
    """Load ev_charging_reports.csv and return a clean DataFrame."""
    csv_path = Path(path) if path else DATA_DIR / "ev_charging_reports.csv"
    try:
        df = pd.read_csv(csv_path, parse_dates=["plugin_time", "plugout_time"])
        df["hour_of_day"] = pd.to_datetime(df["plugin_time"]).dt.hour
        logger.info(f"Loaded session reports: {len(df)} rows from {csv_path}")
        return df
    except FileNotFoundError:
        logger.error(f"Session reports CSV not found at {csv_path}")
        return pd.DataFrame()


def load_hourly_loads(path: str | None = None) -> pd.DataFrame:
    """Load ev_hourly_loads.csv and return a clean DataFrame."""
    csv_path = Path(path) if path else DATA_DIR / "ev_hourly_loads.csv"
    try:
        df = pd.read_csv(csv_path)
        logger.info(f"Loaded hourly loads: {len(df)} rows from {csv_path}")
        return df
    except FileNotFoundError:
        logger.error(f"Hourly loads CSV not found at {csv_path}")
        return pd.DataFrame()


def get_session_sample(df: pd.DataFrame) -> dict:
    """Draw a random session row and return as dict."""
    if df.empty:
        return {
            "duration_hours": 4.0,
            "energy_kwh": 20.0,
            "user_type": "Private",
            "plugin_category": 4,
        }
    row = df.sample(1).iloc[0]
    return row.to_dict()
