import React, { useState } from 'react';
import { useSession } from '../hooks/useSession';
import { useWebSocket } from '../hooks/useWebSocket';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, ComposedChart } from 'recharts';

export default function Simulator() {
  const { startSession, sessionId } = useSession();
  const { latestMessage, messages } = useWebSocket(sessionId);

  const [config, setConfig] = useState({
    vehicle_make: 'Tata Nexon',
    battery_capacity: 40,
    battery_soc: 20,
    target_soc: 90,
    hour_of_day: 14,
    charger_type: 'Fast DC',
    mode: 'Smart RL',
    solar_pct: 0
  });

  const handleRun = () => {
    startSession(config);
  };

  const isRunning = sessionId && latestMessage && !latestMessage.done;

  return (
    <div style={{ display: 'flex', height: '100%', padding: '20px', gap: '20px' }}>
      
      {/* Left Panel - Config */}
      <div className="card" style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
        <h2 style={{ color: 'var(--teal)', borderBottom: '1px solid var(--panel-border)', paddingBottom: '10px' }}>SESSION SETUP</h2>
        
        <div>
          <label>Vehicle Make</label>
          <select value={config.vehicle_make} onChange={e => setConfig({...config, vehicle_make: e.target.value})} style={{width: '100%', marginTop: '5px'}}>
            <option>Tata Nexon</option>
            <option>MG ZS EV</option>
            <option>Hyundai Kona</option>
            <option>Ola S1</option>
          </select>
        </div>

        <div>
          <label>Battery Capacity (kWh): {config.battery_capacity}</label>
          <input type="range" min="30" max="100" step="5" value={config.battery_capacity} onChange={e => setConfig({...config, battery_capacity: parseInt(e.target.value)})} />
        </div>

        <div>
          <label>Initial SOC: {config.battery_soc}%</label>
          <input type="range" min="5" max="95" value={config.battery_soc} onChange={e => setConfig({...config, battery_soc: parseInt(e.target.value)})} />
        </div>

        <div>
          <label>Target SOC: {config.target_soc}%</label>
          <input type="range" min="50" max="100" value={config.target_soc} onChange={e => setConfig({...config, target_soc: parseInt(e.target.value)})} />
        </div>

        <div>
          <label>Start Hour: {config.hour_of_day}:00</label>
          <input type="range" min="0" max="23" value={config.hour_of_day} onChange={e => setConfig({...config, hour_of_day: parseInt(e.target.value)})} />
        </div>

        <div>
          <label>Mode</label>
          <select value={config.mode} onChange={e => setConfig({...config, mode: e.target.value})} style={{width: '100%', marginTop: '5px'}}>
            <option>Smart RL</option>
            <option>Immediate</option>
          </select>
        </div>

        <button className="primary" onClick={handleRun} disabled={isRunning} style={{ marginTop: '20px', padding: '12px' }}>
          {isRunning ? 'RUNNING...' : 'RUN SESSION'}
        </button>

        {latestMessage?.session_summary && (
          <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0, 229, 192, 0.1)', borderRadius: '8px', border: '1px solid var(--teal)' }}>
            <h4 style={{ color: 'var(--teal)', marginBottom: '10px' }}>Session Complete</h4>
            <div className="mono-text" style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div>Energy: {latestMessage.session_summary.total_energy_kwh} kWh</div>
              <div>Cost: ₹{latestMessage.session_summary.total_cost.toFixed(2)}</div>
              <div>Final SOC: {latestMessage.session_summary.final_soc.toFixed(1)}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Charts */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '20px' }}>
        
        {/* Chart 1: SOC over time */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ marginBottom: '10px', color: 'var(--text)' }}>SOC Progress (%)</h4>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={messages}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--panel-border)" />
                <XAxis dataKey="timestep" stroke="var(--text-muted)" />
                <YAxis domain={[0, 100]} stroke="var(--text-muted)" />
                <RechartsTooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--teal)' }} />
                <Line type="monotone" dataKey="soc" stroke="var(--teal)" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Power consumption */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ marginBottom: '10px', color: 'var(--text)' }}>Power (kW)</h4>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={messages}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--panel-border)" />
                <XAxis dataKey="timestep" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <RechartsTooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--blue)' }} />
                <Bar dataKey="power_kw" fill="var(--blue)" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Cumulative Cost */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ marginBottom: '10px', color: 'var(--text)' }}>Cumulative Cost (₹)</h4>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={messages}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--panel-border)" />
                <XAxis dataKey="timestep" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <RechartsTooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--amber)' }} />
                <Area type="monotone" dataKey="cumulative_cost" stroke="var(--amber)" fill="rgba(245, 158, 11, 0.2)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Grid vs Solar Load */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ marginBottom: '10px', color: 'var(--text)' }}>Grid Load vs Tariff</h4>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={messages}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--panel-border)" />
                <XAxis dataKey="timestep" stroke="var(--text-muted)" />
                <YAxis yAxisId="left" stroke="var(--text-muted)" />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" />
                <RechartsTooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--green)' }} />
                <Bar yAxisId="left" dataKey="grid_load" fill="rgba(34, 197, 94, 0.4)" isAnimationActive={false} />
                <Line yAxisId="right" type="stepAfter" dataKey="price" stroke="var(--red)" strokeWidth={2} dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
