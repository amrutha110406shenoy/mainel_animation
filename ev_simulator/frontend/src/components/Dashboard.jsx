import { useState, useEffect } from 'react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './Dashboard.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function Dashboard() {
  const [metrics, setMetrics] = useState(null)
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const interval = setInterval(fetchMetrics, 2000)
    return () => clearInterval(interval)
  }, [])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/api/metrics`)
      setMetrics(response.data)
      
      // Update chart data (keep last 10 data points)
      setChartData(prev => {
        const newData = [...prev, {
          time: new Date().toLocaleTimeString(),
          temperature: response.data.current_temperature,
          efficiency: response.data.average_efficiency,
        }]
        return newData.slice(-10)
      })
    } catch (err) {
      console.error('Failed to fetch metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard">
      <h2>📈 Real-time Dashboard</h2>
      
      {metrics ? (
        <>
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Current Temperature</h3>
              <div className="metric-value">
                {metrics.current_temperature?.toFixed(1) || 'N/A'}°C
              </div>
              <p className="metric-status">System Temperature</p>
            </div>

            <div className="metric-card">
              <h3>Average Efficiency</h3>
              <div className="metric-value">
                {metrics.average_efficiency?.toFixed(1) || 'N/A'}%
              </div>
              <p className="metric-status">Charging Efficiency</p>
            </div>

            <div className="metric-card">
              <h3>Total Sessions</h3>
              <div className="metric-value">
                {metrics.total_sessions || 0}
              </div>
              <p className="metric-status">Completed Simulations</p>
            </div>

            <div className="metric-card">
              <h3>Avg Charge Time</h3>
              <div className="metric-value">
                {metrics.average_charge_time?.toFixed(1) || 'N/A'}
              </div>
              <p className="metric-status">Minutes</p>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="chart-container">
              <h3>Temperature & Efficiency Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    height={80}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="temperature"
                    stroke="#ef4444"
                    dot={false}
                    name="Temp (°C)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="efficiency"
                    stroke="#667eea"
                    dot={false}
                    name="Efficiency (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : (
        <div className="loading-state">
          <p>Loading dashboard metrics...</p>
        </div>
      )}
    </div>
  )
}

export default Dashboard
