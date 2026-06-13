import { useState, useEffect } from 'react'
import ChargingSimulator from './components/ChargingSimulator'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [apiStatus, setApiStatus] = useState('checking')

  useEffect(() => {
    checkApiHealth()
  }, [])

  const checkApiHealth = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/health`)
      setApiStatus(response.ok ? 'connected' : 'error')
    } catch (error) {
      console.error('API connection error:', error)
      setApiStatus('error')
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>⚡ EV Dynamic Charging Simulator</h1>
        <div className="status-badge">
          <span className={`status-dot ${apiStatus}`}></span>
          API {apiStatus === 'connected' ? 'Connected' : apiStatus === 'checking' ? 'Checking...' : 'Disconnected'}
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <ChargingSimulator />
          <Dashboard />
        </div>
      </main>

      <footer className="app-footer">
        <p>EV Charging Simulator v1.0 | Powered by React + FastAPI</p>
      </footer>
    </div>
  )
}

export default App
