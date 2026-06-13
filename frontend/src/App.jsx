import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

import Dashboard from './pages/Dashboard';
import Simulator from './pages/Simulator';
import Analytics from './pages/Analytics';
import StationMap from './pages/StationMap';

const Sidebar = () => {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'DASHBOARD', icon: '⚲' },
    { path: '/simulator', label: 'SIMULATOR', icon: '⚡' },
    { path: '/analytics', label: 'ANALYTICS', icon: '📊' },
    { path: '/map', label: 'STATION MAP', icon: '🗺️' }
  ];

  return (
    <div style={{
      width: '240px',
      background: '#0D1B2E',
      borderRight: '1px solid var(--panel-border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 0',
      zIndex: 100
    }}>
      <div style={{ padding: '0 20px', marginBottom: '40px' }}>
        <h2 style={{ color: 'var(--teal)', margin: 0, fontSize: '1.5rem', lineHeight: 1.2 }}>EV DYNAMIC</h2>
        <h3 style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>CHARGING SIMULATOR</h3>
      </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 10px' }}>
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              style={{ textDecoration: 'none' }}
            >
              <motion.div
                whileHover={{ x: 5, backgroundColor: 'rgba(0, 229, 192, 0.1)' }}
                style={{
                  padding: '12px 16px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: isActive ? 'var(--teal)' : 'var(--text-muted)',
                  backgroundColor: isActive ? 'rgba(0, 229, 192, 0.1)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--teal)' : '3px solid transparent',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  transition: 'background-color 0.2s, color 0.2s'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                {item.label}
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/map" element={<StationMap />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
