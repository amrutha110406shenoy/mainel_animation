import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VehicleDetailsModal({ vehicle, onClose }) {
  if (!vehicle) return null;

  return (
    <AnimatePresence>
      {vehicle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            style={{
              width: '350px',
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--teal)',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={onClose}
              style={{
                position: 'absolute', right: '10px', top: '10px',
                background: 'transparent', border: 'none', color: 'var(--text)',
                cursor: 'pointer', fontSize: '1.2rem'
              }}
            >
              ✕
            </button>
            <h3 style={{ color: 'var(--teal)', borderBottom: '1px solid var(--panel-border)', paddingBottom: '10px', marginBottom: '15px' }}>
              VEHICLE DETAILS
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontFamily: 'var(--font-mono)' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Make</div>
                <div style={{ fontSize: '1.1rem' }}>{vehicle.make || 'Tata Nexon'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Battery Capacity</div>
                <div style={{ fontSize: '1.1rem' }}>{vehicle.capacity || 40} kWh</div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Current SOC</div>
                <div style={{ fontSize: '1.5rem', color: vehicle.soc >= vehicle.targetSoc ? 'var(--green)' : 'var(--amber)' }}>
                  {vehicle.soc ? vehicle.soc.toFixed(1) : 0}%
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Target SOC</div>
                <div style={{ fontSize: '1.1rem' }}>{vehicle.targetSoc || 90}%</div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Charger Type</div>
                <div style={{ fontSize: '1.1rem' }}>{vehicle.chargerType || 'Fast DC'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Current Power Draw</div>
                <div style={{ fontSize: '1.1rem', color: 'var(--blue)' }}>{vehicle.powerKw || 0} kW</div>
              </div>
              
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Active Protocol</div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                  <span style={{ background: '#1E2D4A', padding: '4px 10px', borderRadius: '4px', fontSize: '0.9rem' }}>
                    {vehicle.protocol || 'OCPP 2.0'}
                  </span>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <div style={{ height: '8px', background: 'var(--panel-border)', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, vehicle.soc || 0)}%` }}
                  style={{ height: '100%', background: 'var(--teal)' }}
                />
              </div>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
