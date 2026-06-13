import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '../hooks/useSession';
import { useWebSocket } from '../hooks/useWebSocket';
import AnimatedStation from '../components/AnimatedStation';

const ActivityLog = ({ messages }) => (
  <div className="card mono-text" style={{height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px'}}>
    {messages.map((m,i) => (
      <div key={i} style={{ borderBottom: '1px solid var(--panel-border)', paddingBottom: '5px' }}>
        <span style={{color: 'var(--teal)'}}>T={m.timestep}</span>: {m.action_name} <br/>
        <span style={{color: 'var(--text-muted)', fontSize: '0.8rem'}}>SoC: {m.soc.toFixed(1)}% | Power: {m.power_kw}kW</span>
      </div>
    ))}
  </div>
);

export default function Dashboard() {
  const { startSession, sessionId } = useSession();
  const { latestMessage, isConnected, messages } = useWebSocket(sessionId);

  const [config, setConfig] = useState({
    battery_soc: 20,
    vehicles_waiting: 2,
    solar_pct: 0,
    hour_of_day: 9,
    charger_type: 'Mixed',
    mode: 'Smart RL'
  });

  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Derived state from latest message
  const isRunning = isConnected && latestMessage && !latestMessage.done;
  
  // Dummy bay state based on latest message
  const bayState = Array(6).fill(null).map((_, i) => ({
    id: i + 1,
    type: i < 3 ? 'DC' : 'AC',
    active: i === 0 && isRunning
  }));

  // Construct active vehicle state from the session and websocket
  let activeVehicle = null;
  if (sessionId) {
    activeVehicle = {
      make: 'Tata Nexon', // In a full version, this comes from config
      capacity: 40,
      soc: latestMessage ? latestMessage.soc : config.battery_soc,
      targetSoc: 90,
      powerKw: latestMessage ? latestMessage.power_kw : 0,
      chargerType: 'Fast DC',
      protocol: 'OCPP 2.0',
      status: isRunning ? 'parked' : (latestMessage?.done ? 'leaving' : 'driving_in'),
      bayIndex: 0 // Always parking in Bay 1 for this visualization
    };
  }

  const handleStart = () => {
    startSession(config);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px', gap: '20px' }}>
      {/* Top Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px' }}>
        <h1 style={{ margin: 0, color: 'var(--teal)' }}>EV DYNAMIC CHARGING SIMULATOR</h1>
        <div style={{ display: 'flex', gap: '20px', fontSize: '1.2rem', fontFamily: 'var(--font-mono)' }}>
          <div>Grid Load: {latestMessage?.grid_load || 0} kW</div>
          <div>Queue: {config.vehicles_waiting}</div>
          <div>Solar: {config.solar_pct}%</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: isRunning ? 'var(--green)' : 'var(--amber)' }} />
            {isRunning ? 'RUNNING' : 'PAUSED'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '20px', overflow: 'hidden' }}>
        {/* Left Controls Panel */}
        <div className="card" style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
          <h3 style={{ color: 'var(--teal)', borderBottom: '1px solid var(--panel-border)', paddingBottom: '10px' }}>SIMULATION PARAMS</h3>
          
          <div>
            <label>Battery SOC: {config.battery_soc}%</label>
            <input type="range" min="5" max="95" value={config.battery_soc} onChange={e => setConfig({...config, battery_soc: parseInt(e.target.value)})} />
          </div>

          <div>
            <label>Vehicles Waiting: {config.vehicles_waiting}</label>
            <input type="range" min="0" max="10" value={config.vehicles_waiting} onChange={e => setConfig({...config, vehicles_waiting: parseInt(e.target.value)})} />
          </div>

          <div>
            <label>Solar %: {config.solar_pct}%</label>
            <input type="range" min="0" max="100" value={config.solar_pct} onChange={e => setConfig({...config, solar_pct: parseInt(e.target.value)})} />
          </div>

          <div>
            <label>Hour of Day: {config.hour_of_day}:00</label>
            <input type="range" min="0" max="23" value={config.hour_of_day} onChange={e => setConfig({...config, hour_of_day: parseInt(e.target.value)})} />
          </div>

          <div>
            <label>Charger Type</label>
            <select value={config.charger_type} onChange={e => setConfig({...config, charger_type: e.target.value})} style={{width: '100%', marginTop: '5px'}}>
              <option>Mixed</option>
              <option>Fast DC</option>
              <option>Slow AC</option>
            </select>
          </div>

          <div>
            <label>Mode</label>
            <select value={config.mode} onChange={e => setConfig({...config, mode: e.target.value})} style={{width: '100%', marginTop: '5px'}}>
              <option>Smart RL</option>
              <option>Immediate</option>
              <option>Off-Peak</option>
              <option>V2G</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '10px' }}>
            <span style={{background: '#1E2D4A', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem'}}>OCPP 2.0</span>
            <span style={{background: '#1E2D4A', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem'}}>ISO 15118</span>
            <span style={{background: '#1E2D4A', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem'}}>CCS2</span>
          </div>

          <button className="primary" onClick={handleStart} style={{ marginTop: 'auto', padding: '12px' }} disabled={isRunning}>
            {isRunning ? 'SIMULATION RUNNING...' : 'START SIMULATION'}
          </button>
        </div>

        {/* Center Station Canvas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
           <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', border: '1px solid var(--panel-border)' }}>
              <AnimatedStation 
                bayState={bayState} 
                activeVehicle={activeVehicle}
                queueCount={config.vehicles_waiting}
                selectedVehicle={selectedVehicle}
                setSelectedVehicle={setSelectedVehicle}
              />
           </div>

           {/* Bottom Metrics Strip */}
           <div style={{ display: 'flex', gap: '15px', marginTop: '20px', height: '100px' }}>
              <div className="card" style={{flex: 1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
                <span style={{color: 'var(--text-muted)', fontSize:'0.9rem'}}>Power Consumption</span>
                <span className="mono-text" style={{fontSize: '1.5rem', color: 'var(--teal)'}}>{latestMessage?.power_kw || 0} kW</span>
              </div>
              <div className="card" style={{flex: 1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
                <span style={{color: 'var(--text-muted)', fontSize:'0.9rem'}}>Dynamic Price</span>
                <span className="mono-text" style={{fontSize: '1.5rem', color: 'var(--amber)'}}>₹{latestMessage?.price || 0}/kWh</span>
              </div>
              <div className="card" style={{flex: 1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
                <span style={{color: 'var(--text-muted)', fontSize:'0.9rem'}}>Avg Wait Time</span>
                <span className="mono-text" style={{fontSize: '1.5rem', color: 'var(--blue)'}}>{latestMessage?.wait_time || 0} min</span>
              </div>
           </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ flex: 1 }}>
            <h4 style={{marginBottom: '10px', color: 'var(--teal)'}}>Activity Log</h4>
            <ActivityLog messages={messages.slice(-15)} />
          </div>
        </div>

      </div>
    </div>
  );
}
