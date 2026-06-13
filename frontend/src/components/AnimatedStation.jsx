import React, { useState } from 'react';
import Vehicle from './Vehicle';
import VehicleDetailsModal from './VehicleDetailsModal';

export default function AnimatedStation({ bayState, activeVehicle, queueCount, onVehicleClick, selectedVehicle, setSelectedVehicle }) {

  return (
    <div style={{ 
      width: '100%', height: '100%', 
      position: 'relative', 
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      overflow: 'hidden' 
    }}>
      {/* Background Grid Pattern */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'linear-gradient(var(--panel-border) 1px, transparent 1px), linear-gradient(90deg, var(--panel-border) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: 0.3
      }} />

      {/* Charging Station Hub */}
      <div style={{
        position: 'relative',
        width: '500px',
        height: '350px',
        background: 'rgba(11, 20, 36, 0.8)',
        border: '2px solid var(--panel-border)',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px'
      }}>
        {/* Top Row: Fast DC Chargers */}
        <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
          {bayState.slice(0, 3).map((bay, i) => (
            <BaySlot key={bay.id} bay={bay} isTop={true} />
          ))}
        </div>

        {/* Central Hub Area */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '120px', height: '60px',
          background: 'var(--bg)',
          border: '1px solid var(--teal)',
          borderRadius: '10px',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          color: 'var(--teal)', fontFamily: 'var(--font-heading)', fontWeight: 'bold'
        }}>
          POWER HUB
        </div>

        {/* Bottom Row: Slow AC Chargers */}
        <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
          {bayState.slice(3, 6).map((bay, i) => (
            <BaySlot key={bay.id} bay={bay} isTop={false} />
          ))}
        </div>

        {/* Vehicles */}
        {activeVehicle && (
          <Vehicle 
            vehicle={activeVehicle} 
            status={activeVehicle.status} 
            bayIndex={activeVehicle.bayIndex}
            onClick={() => setSelectedVehicle(activeVehicle)}
          />
        )}

      </div>

      {/* Road Strip at bottom */}
      <div style={{
        position: 'absolute', bottom: 20, left: 0, right: 0,
        height: '60px', background: '#111827',
        borderTop: '2px dashed #4b5563', borderBottom: '2px dashed #4b5563'
      }}>
         {/* Render queued vehicles purely as visuals */}
         {Array.from({length: Math.min(queueCount, 5)}).map((_, i) => (
            <div key={i} style={{
              position: 'absolute', left: `${10 + i * 80}px`, top: '15px',
              width: '60px', height: '30px', background: '#475569', borderRadius: '5px',
              display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: '0.7rem'
            }}>
              WAITING
            </div>
         ))}
      </div>

      {/* Modal */}
      <VehicleDetailsModal vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />
    </div>
  );
}

function BaySlot({ bay, isTop }) {
  const color = bay.active ? 'var(--teal)' : 'var(--panel-border)';
  
  return (
    <div style={{
      width: '80px', height: '120px',
      border: `2px solid ${color}`,
      borderTop: isTop ? `8px solid ${color}` : `2px solid ${color}`,
      borderBottom: !isTop ? `8px solid ${color}` : `2px solid ${color}`,
      borderRadius: '8px',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: isTop ? 'flex-start' : 'flex-end',
      padding: '10px',
      background: bay.active ? 'rgba(0, 229, 192, 0.05)' : 'transparent',
      boxShadow: bay.active ? `0 0 15px rgba(0, 229, 192, 0.2)` : 'none',
      transition: 'all 0.3s'
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>BAY {bay.id}</div>
      <div style={{ color, fontSize: '0.9rem', fontWeight: 'bold' }}>{bay.type}</div>
    </div>
  );
}
