import React from 'react';
import { motion } from 'framer-motion';

export default function Vehicle({ vehicle, onClick, isParked, bayIndex, status }) {
  if (!vehicle) return null;

  // Animation variants
  // 0-2 DC bays (top), 3-5 AC bays (bottom)
  const isTopRow = bayIndex < 3;
  
  const parkedY = isTopRow ? -60 : 60;
  const parkedX = (bayIndex % 3) * 140 - 140; // Center around 0

  const variants = {
    initial: { x: -400, y: 150, opacity: 0, rotate: 0 },
    driving: { x: 0, y: 150, opacity: 1, rotate: 0 },
    parking: { 
      x: parkedX, 
      y: parkedY, 
      rotate: isTopRow ? 0 : 180,
      opacity: 1
    },
    leaving: { x: 400, y: 150, opacity: 0, rotate: 0 }
  };

  let currentState = 'initial';
  if (status === 'driving_in') currentState = 'driving';
  if (status === 'parking' || status === 'parked') currentState = 'parking';
  if (status === 'leaving') currentState = 'leaving';

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate={currentState}
      transition={{ duration: 1.5, type: 'spring', bounce: 0.2 }}
      onClick={() => onClick(vehicle)}
      style={{
        position: 'absolute',
        width: '60px',
        height: '100px',
        cursor: 'pointer',
        zIndex: 10
      }}
    >
      {/* SoC Progress Bar above car */}
      <div style={{
        position: 'absolute',
        top: '-15px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '40px',
        height: '6px',
        background: 'var(--panel-border)',
        borderRadius: '3px',
        overflow: 'hidden',
        pointerEvents: 'none',
        opacity: status === 'parked' ? 1 : 0,
        transition: 'opacity 0.5s'
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, vehicle.soc || 0)}%`,
          background: (vehicle.soc >= (vehicle.targetSoc || 90)) ? 'var(--green)' : 'var(--teal)',
          transition: 'width 0.3s'
        }} />
      </div>

      {/* Car SVG Vector */}
      <svg viewBox="0 0 100 200" style={{ width: '100%', height: '100%', dropShadow: '0 10px 10px rgba(0,0,0,0.5)' }}>
        <rect x="15" y="10" width="70" height="180" rx="20" fill={vehicle.color || '#0ea5e9'} />
        <rect x="25" y="40" width="50" height="30" rx="5" fill="#050a14" /> {/* Windshield */}
        <rect x="25" y="130" width="50" height="30" rx="5" fill="#050a14" /> {/* Rear window */}
        {/* Lights */}
        <circle cx="25" cy="20" r="5" fill="#fff" opacity="0.8" />
        <circle cx="75" cy="20" r="5" fill="#fff" opacity="0.8" />
        <rect x="20" y="180" width="15" height="5" rx="2" fill="#ef4444" />
        <rect x="65" y="180" width="15" height="5" rx="2" fill="#ef4444" />
      </svg>
    </motion.div>
  );
}
