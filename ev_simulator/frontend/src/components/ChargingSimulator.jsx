import { useState } from 'react'
import axios from 'axios'
import { Play, Pause, RotateCcw } from 'lucide-react'
import './ChargingSimulator.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function ChargingSimulator() {
  const [isSimulating, setIsSimulating] = useState(false)
  const [batteryCapacity, setBatteryCapacity] = useState(100)
  const [chargerPower, setChargerPower] = useState(50)
  const [ambientTemp, setAmbientTemp] = useState(25)
  const [currentBattery, setCurrentBattery] = useState(20)
  const [simulationResult, setSimulationResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStartSimulation = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.post(`${API_BASE_URL}/api/simulate/start`, {
        battery_capacity: batteryCapacity,
        current_battery: currentBattery,
        charger_power: chargerPower,
        ambient_temperature: ambientTemp,
      })
      setSimulationResult(response.data)
      setIsSimulating(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start simulation')
      console.error('Simulation error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStop = () => {
    setIsSimulating(false)
  }

  const handleReset = () => {
    setIsSimulating(false)
    setCurrentBattery(20)
    setSimulationResult(null)
    setError('')
  }

  return (
    <div className="charging-simulator">
      <h2>🔋 Charging Simulator</h2>
      
      <div className="controls-section">
        <div className="control-group">
          <label htmlFor="battery-capacity">Battery Capacity (kWh)</label>
          <input
            id="battery-capacity"
            type="range"
            min="10"
            max="200"
            value={batteryCapacity}
            onChange={(e) => setBatteryCapacity(parseFloat(e.target.value))}
            disabled={isSimulating}
          />
          <span className="value-display">{batteryCapacity.toFixed(1)} kWh</span>
        </div>

        <div className="control-group">
          <label htmlFor="charger-power">Charger Power (kW)</label>
          <input
            id="charger-power"
            type="range"
            min="7"
            max="350"
            step="5"
            value={chargerPower}
            onChange={(e) => setChargerPower(parseFloat(e.target.value))}
            disabled={isSimulating}
          />
          <span className="value-display">{chargerPower.toFixed(1)} kW</span>
        </div>

        <div className="control-group">
          <label htmlFor="ambient-temp">Ambient Temperature (°C)</label>
          <input
            id="ambient-temp"
            type="range"
            min="-20"
            max="50"
            value={ambientTemp}
            onChange={(e) => setAmbientTemp(parseFloat(e.target.value))}
            disabled={isSimulating}
          />
          <span className="value-display">{ambientTemp.toFixed(1)}°C</span>
        </div>

        <div className="control-group">
          <label htmlFor="current-battery">Current Battery Level (%)</label>
          <input
            id="current-battery"
            type="range"
            min="0"
            max="100"
            value={currentBattery}
            onChange={(e) => setCurrentBattery(parseFloat(e.target.value))}
            disabled={isSimulating}
          />
          <span className="value-display">{currentBattery.toFixed(1)}%</span>
        </div>
      </div>

      <div className="buttons-group">
        <button
          className="btn btn-primary"
          onClick={handleStartSimulation}
          disabled={isSimulating || loading}
        >
          <Play size={18} />
          {loading ? 'Starting...' : 'Start Simulation'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleStop}
          disabled={!isSimulating}
        >
          <Pause size={18} />
          Pause
        </button>
        <button
          className="btn btn-reset"
          onClick={handleReset}
        >
          <RotateCcw size={18} />
          Reset
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {simulationResult && (
        <div className="simulation-result">
          <h3>📊 Simulation Results</h3>
          <div className="result-grid">
            <div className="result-item">
              <span className="result-label">Charging Time</span>
              <span className="result-value">{simulationResult.charging_time_minutes?.toFixed(1) || 'N/A'} min</span>
            </div>
            <div className="result-item">
              <span className="result-label">Final Battery %</span>
              <span className="result-value">{simulationResult.final_battery_percentage?.toFixed(1) || 'N/A'}%</span>
            </div>
            <div className="result-item">
              <span className="result-label">Battery Temp Rise</span>
              <span className="result-value">{simulationResult.battery_temperature_rise?.toFixed(1) || 'N/A'}°C</span>
            </div>
            <div className="result-item">
              <span className="result-label">Efficiency</span>
              <span className="result-value">{simulationResult.efficiency_percentage?.toFixed(1) || 'N/A'}%</span>
            </div>
            <div className="result-item">
              <span className="result-label">Energy Loss</span>
              <span className="result-value">{simulationResult.energy_loss_kwh?.toFixed(2) || 'N/A'} kWh</span>
            </div>
            <div className="result-item">
              <span className="result-label">Cost Estimate</span>
              <span className="result-value">${simulationResult.cost_estimate?.toFixed(2) || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChargingSimulator
