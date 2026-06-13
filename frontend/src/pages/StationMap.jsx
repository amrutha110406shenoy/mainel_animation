import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Create custom colored markers
const createIcon = (color) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="background-color:${color}; width:16px; height:16px; border-radius:50%; border:2px solid white; box-shadow:0 0 10px ${color}"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const ICONS = {
  available: createIcon('var(--green)'),
  busy: createIcon('var(--amber)'),
  offline: createIcon('var(--red)')
};

// Hardcoded sample stations
const INITIAL_STATIONS = [
  { id: 1, name: 'Mumbai Central EV Hub', city: 'Mumbai', lat: 18.9750, lng: 72.8258, fast: 4, slow: 8, status: 'available', price: 18, protocols: ['OCPP', 'CCS2'] },
  { id: 2, name: 'Bandra Smart Charge', city: 'Mumbai', lat: 19.0596, lng: 72.8295, fast: 2, slow: 4, status: 'busy', price: 20, protocols: ['CCS2'] },
  { id: 3, name: 'Delhi Connaught Place', city: 'Delhi', lat: 28.6304, lng: 77.2177, fast: 6, slow: 10, status: 'available', price: 16, protocols: ['OCPP', 'ISO15118'] },
  { id: 4, name: 'Gurgaon Cyber City', city: 'Delhi', lat: 28.4595, lng: 77.0266, fast: 5, slow: 5, status: 'busy', price: 22, protocols: ['OCPP', 'CCS2'] },
  { id: 5, name: 'Bangalore Indiranagar', city: 'Bangalore', lat: 12.9784, lng: 77.6408, fast: 3, slow: 6, status: 'available', price: 19, protocols: ['CCS2'] },
  { id: 6, name: 'Bangalore Whitefield', city: 'Bangalore', lat: 12.9698, lng: 77.7499, fast: 8, slow: 12, status: 'offline', price: 19, protocols: ['OCPP', 'ISO15118', 'CCS2'] },
  { id: 7, name: 'Chennai OMR Plaza', city: 'Chennai', lat: 12.9675, lng: 80.2593, fast: 4, slow: 6, status: 'available', price: 15, protocols: ['OCPP'] },
  { id: 8, name: 'Chennai T Nagar', city: 'Chennai', lat: 13.0418, lng: 80.2341, fast: 2, slow: 4, status: 'busy', price: 17, protocols: ['CCS2'] },
  { id: 9, name: 'Hyderabad HITEC City', city: 'Hyderabad', lat: 17.4435, lng: 78.3772, fast: 5, slow: 8, status: 'available', price: 18, protocols: ['OCPP', 'CCS2'] },
  { id: 10, name: 'Pune Hinjewadi', city: 'Pune', lat: 18.5913, lng: 73.7389, fast: 3, slow: 6, status: 'available', price: 16, protocols: ['ISO15118', 'CCS2'] }
];

function ChangeView({ center, zoom }) {
  const map = useMap();
  map.flyTo(center, zoom);
  return null;
}

export default function StationMap() {
  const [stations, setStations] = useState(INITIAL_STATIONS);
  const [filterCity, setFilterCity] = useState('All');
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // India center
  const [mapZoom, setMapZoom] = useState(5);

  const filteredStations = filterCity === 'All' ? stations : stations.filter(s => s.city === filterCity);

  const flyToStation = (lat, lng) => {
    setMapCenter([lat, lng]);
    setMapZoom(13);
  };

  const refreshStatus = () => {
    setStations(stations.map(s => ({
      ...s,
      status: Math.random() > 0.7 ? 'busy' : (Math.random() > 0.9 ? 'offline' : 'available')
    })));
  };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      
      {/* Sidebar List */}
      <div className="card" style={{ width: '320px', borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none', display: 'flex', flexDirection: 'column', gap: '15px', zIndex: 10 }}>
        <h2 style={{ color: 'var(--teal)' }}>STATION MAP</h2>
        
        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
           <select value={filterCity} onChange={e => setFilterCity(e.target.value)} style={{flex: 1}}>
             <option value="All">All Cities</option>
             <option value="Mumbai">Mumbai</option>
             <option value="Delhi">Delhi</option>
             <option value="Bangalore">Bangalore</option>
             <option value="Chennai">Chennai</option>
             <option value="Hyderabad">Hyderabad</option>
             <option value="Pune">Pune</option>
           </select>
           <button onClick={refreshStatus} title="Refresh Status">🔄</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredStations.map(station => (
            <div 
              key={station.id} 
              style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', cursor: 'pointer', border: '1px solid transparent' }}
              onClick={() => flyToStation(station.lat, station.lng)}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--teal)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 style={{margin: 0, color: 'var(--text)'}}>{station.name}</h4>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: ICONS[station.status].options.html.match(/background-color:(.*?);/)[1] }} />
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                {station.city} • ₹{station.price}/kWh
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <span style={{ fontSize: '0.8rem', background: 'var(--panel)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>⚡ DC: {station.fast}</span>
                <span style={{ fontSize: '0.8rem', background: 'var(--panel)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>🔌 AC: {station.slow}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          style={{ height: '100%', width: '100%', background: '#0f172a' }}
        >
          <ChangeView center={mapCenter} zoom={mapZoom} />
          
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          />

          {filteredStations.map(station => (
            <Marker 
              key={station.id} 
              position={[station.lat, station.lng]}
              icon={ICONS[station.status]}
            >
              <Popup className="dark-popup">
                <div style={{ background: 'var(--panel)', color: 'var(--text)', padding: '5px', borderRadius: '4px' }}>
                  <h4 style={{ margin: '0 0 5px 0', color: 'var(--teal)' }}>{station.name}</h4>
                  <div>Status: <strong style={{color: ICONS[station.status].options.html.match(/background-color:(.*?);/)[1]}}>{station.status.toUpperCase()}</strong></div>
                  <div>Fast DC: {station.fast} | Slow AC: {station.slow}</div>
                  <div>Price: ₹{station.price}/kWh</div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {station.protocols.map(p => (
                       <span key={p} style={{ background: '#1E2D4A', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>{p}</span>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* CSS override for Leaflet popup to match dark theme */}
        <style dangerouslySetInnerHTML={{__html: `
          .leaflet-popup-content-wrapper, .leaflet-popup-tip {
            background: var(--panel);
            color: var(--text);
            border: 1px solid var(--panel-border);
          }
          .leaflet-popup-close-button {
            color: var(--text) !important;
          }
        `}} />
      </div>

    </div>
  );
}
