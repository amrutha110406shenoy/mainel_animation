import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { API_BASE } from '../hooks/useSession';

export default function Analytics() {
  const [data, setData] = useState({
    summary: null,
    loadProfile: null,
    pluginDist: null,
    policyMetrics: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [sumRes, loadRes, plugRes, polRes] = await Promise.all([
          axios.get(`${API_BASE}/analytics/summary`),
          axios.get(`${API_BASE}/analytics/load-profile`),
          axios.get(`${API_BASE}/analytics/plugin-distribution`),
          axios.get(`${API_BASE}/analytics/policy-metrics`)
        ]);

        setData({
          summary: sumRes.data,
          loadProfile: loadRes.data,
          pluginDist: plugRes.data,
          policyMetrics: polRes.data
        });
      } catch (e) {
        console.error('Failed to fetch analytics', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading || !data.summary) {
    return <div style={{padding: '40px', color: 'var(--teal)'}}>Loading Analytics...</div>;
  }

  // Format Plugin Dist for Recharts
  const pluginChartData = data.pluginDist.hours.map((h, i) => ({
    hour: h,
    count: data.pluginDist.counts[i]
  }));

  // Format Load Profile for Recharts
  const loadChartData = data.loadProfile.hours.map((h, i) => ({
    hour: h,
    uncontrolled_3_6: data.loadProfile.uncontrolled_3_6kw[i],
    uncontrolled_7_2: data.loadProfile.uncontrolled_7_2kw[i],
    flexible_3_6: data.loadProfile.flexible_3_6kw[i],
    flexible_7_2: data.loadProfile.flexible_7_2kw[i]
  }));

  // Pie chart data
  const actionData = [
    { name: 'Slow Charge', value: data.policyMetrics.action_distribution.slow, color: 'var(--teal)' },
    { name: 'Fast Charge', value: data.policyMetrics.action_distribution.fast, color: 'var(--blue)' },
    { name: 'Pause/Idle', value: data.policyMetrics.action_distribution.pause, color: 'var(--panel-border)' },
    { name: 'V2G', value: data.policyMetrics.action_distribution.v2g, color: 'var(--amber)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px', gap: '20px', overflowY: 'auto' }}>
      <h2 style={{ color: 'var(--teal)' }}>DATASET & RL PERFORMANCE ANALYTICS</h2>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
        <div className="card" style={{textAlign: 'center'}}>
          <div style={{color: 'var(--text-muted)'}}>Total Sessions</div>
          <div className="mono-text" style={{fontSize: '2rem', color: 'var(--blue)'}}>{data.summary.total_sessions}</div>
        </div>
        <div className="card" style={{textAlign: 'center'}}>
          <div style={{color: 'var(--text-muted)'}}>Avg Duration</div>
          <div className="mono-text" style={{fontSize: '2rem', color: 'var(--amber)'}}>{data.summary.avg_duration_hours} h</div>
        </div>
        <div className="card" style={{textAlign: 'center'}}>
          <div style={{color: 'var(--text-muted)'}}>Avg Energy</div>
          <div className="mono-text" style={{fontSize: '2rem', color: 'var(--teal)'}}>{data.summary.avg_energy_kwh} kWh</div>
        </div>
        <div className="card" style={{textAlign: 'center'}}>
          <div style={{color: 'var(--text-muted)'}}>Peak Plugin Hour</div>
          <div className="mono-text" style={{fontSize: '2rem', color: 'var(--red)'}}>{data.summary.peak_plugin_hour}:00</div>
        </div>
        <div className="card" style={{textAlign: 'center'}}>
          <div style={{color: 'var(--text-muted)'}}>Private Users</div>
          <div className="mono-text" style={{fontSize: '2rem', color: 'var(--green)'}}>{data.summary.private_pct}%</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flex: 1, minHeight: '300px' }}>
        
        {/* Plugin Distribution */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h4 style={{marginBottom: '10px', color: 'var(--text)'}}>Session Plugin Distribution (Coincident Peak)</h4>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pluginChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--panel-border)" />
                <XAxis dataKey="hour" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{background: 'var(--panel)'}} />
                <Bar dataKey="count">
                  {pluginChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.hour >= 15 && entry.hour <= 18 ? 'var(--amber)' : 'var(--blue)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Load Profile */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h4 style={{marginBottom: '10px', color: 'var(--text)'}}>Hourly Load Profiles (kW)</h4>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={loadChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--panel-border)" />
                <XAxis dataKey="hour" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{background: 'var(--panel)'}} />
                <Area type="monotone" dataKey="uncontrolled_7_2" stroke="var(--red)" fill="none" />
                <Area type="monotone" dataKey="flexible_7_2" stroke="var(--blue)" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Policy Metrics */}
      <h3 style={{ color: 'var(--teal)', marginTop: '10px' }}>RL Policy Performance vs Baseline</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
         <div className="card" style={{textAlign: 'center'}}>
           <div style={{color: 'var(--text-muted)'}}>Cost Reduction</div>
           <div className="mono-text" style={{fontSize: '2rem', color: 'var(--green)'}}>{data.policyMetrics.cost_reduction_pct}%</div>
         </div>
         <div className="card" style={{textAlign: 'center'}}>
           <div style={{color: 'var(--text-muted)'}}>Peak Demand Reduction</div>
           <div className="mono-text" style={{fontSize: '2rem', color: 'var(--amber)'}}>{data.policyMetrics.peak_demand_reduction_pct}%</div>
         </div>
         <div className="card" style={{textAlign: 'center'}}>
           <div style={{color: 'var(--text-muted)'}}>SOC Target Fulfilled</div>
           <div className="mono-text" style={{fontSize: '1.2rem', color: 'var(--teal)', marginTop: '10px'}}>RL: {data.policyMetrics.soc_fulfilment_rate}%</div>
           <div className="mono-text" style={{fontSize: '1.2rem', color: 'var(--text-muted)'}}>Base: {data.policyMetrics.baseline_soc_rate}%</div>
         </div>
         <div className="card" style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
           <div style={{color: 'var(--text-muted)', marginBottom: '5px'}}>Action Distribution</div>
           <div style={{width:'100%', height:'80px'}}>
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={actionData} dataKey="value" cx="50%" cy="50%" outerRadius={30} stroke="none">
                    {actionData.map((e,i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
             </ResponsiveContainer>
           </div>
         </div>
      </div>
    </div>
  );
}
