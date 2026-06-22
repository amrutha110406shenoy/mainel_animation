import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';

// Fix Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─────────────────────────────────────────────
//  Custom marker factory
// ─────────────────────────────────────────────
const createEVIcon = (status, type, isSelected = false) => {
  const colors = {
    available: '#22C55E',
    busy: '#F59E0B',
    offline: '#EF4444',
    unknown: '#8A9BB3',
  };
  const color = colors[status] || colors.unknown;
  const size = isSelected ? 36 : 28;
  const pulse = status === 'available' ? `
    <div style="
      position:absolute; top:50%; left:50%;
      transform:translate(-50%,-50%);
      width:${size + 16}px; height:${size + 16}px;
      border-radius:50%;
      border:2px solid ${color};
      animation:pulse-ring 1.8s ease-out infinite;
      opacity:0.6;
    "></div>` : '';

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative; width:${size}px; height:${size}px;">
        ${pulse}
        <div style="
          width:${size}px; height:${size}px;
          border-radius:50%;
          background: radial-gradient(circle at 35% 35%, ${color}cc, ${color}66);
          border: 2.5px solid ${color};
          box-shadow: 0 0 ${isSelected ? 20 : 12}px ${color}99, 0 2px 8px rgba(0,0,0,0.6);
          display:flex; align-items:center; justify-content:center;
          font-size:${size * 0.45}px;
          cursor:pointer;
          transition: transform 0.2s;
        ">⚡</div>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 5],
  });
};

// ─────────────────────────────────────────────
//  Comprehensive Bangalore EV Stations Dataset
// ─────────────────────────────────────────────
const BANGALORE_EV_STATIONS = [
  // Central Bangalore
  { id: 1,  name: 'Ather Grid – MG Road',           area: 'Central',    lat: 12.9747, lng: 77.6131, operator: 'Ather Energy',   dcFast: 2, acSlow: 4, status: 'available', price: 15, power: '7.4 kW / 30 kW', protocols: ['CCS2','AC Type 2'], address: 'MG Road, Brigade Rd, Bengaluru 560001',          amenities: ['Café','Parking','WiFi'] },
  { id: 2,  name: 'BESCOM EV Hub – Lalbagh',         area: 'Central',    lat: 12.9507, lng: 77.5848, operator: 'BESCOM',         dcFast: 3, acSlow: 6, status: 'available', price: 12, power: '15 kW / 60 kW', protocols: ['CCS2','CHAdeMO','AC Type 2'], address: 'Lalbagh Botanical Garden, Bengaluru 560004', amenities: ['Restroom','Parking'] },
  { id: 3,  name: 'Tata Power – UB City Mall',       area: 'Central',    lat: 12.9724, lng: 77.5965, operator: 'Tata Power',    dcFast: 4, acSlow: 8, status: 'busy',      price: 18, power: '7.4 kW / 50 kW', protocols: ['CCS2','AC Type 2'], address: 'UB City, Vittal Mallya Rd, Bengaluru 560001',    amenities: ['Mall','Parking','Café'] },
  { id: 4,  name: 'ChargeZone – Cubbon Park',        area: 'Central',    lat: 12.9797, lng: 77.5929, operator: 'ChargeZone',    dcFast: 2, acSlow: 4, status: 'available', price: 16, power: '7.4 kW / 40 kW', protocols: ['CCS2','AC Type 2'], address: 'Cubbon Park Rd, Bengaluru 560001',               amenities: ['Park','Restroom'] },
  { id: 5,  name: 'BWSSB Charging Point – Gandhi Nagar', area: 'Central', lat: 12.9815, lng: 77.5769, operator: 'BWSSB',      dcFast: 1, acSlow: 3, status: 'available', price: 10, power: '3.3 kW / 15 kW', protocols: ['AC Type 2'], address: 'Gandhi Nagar, Bengaluru 560009',                  amenities: ['Parking'] },

  // North Bangalore
  { id: 6,  name: 'Ather Grid – Hebbal',             area: 'North',      lat: 13.0358, lng: 77.5970, operator: 'Ather Energy',   dcFast: 3, acSlow: 5, status: 'available', price: 15, power: '7.4 kW / 30 kW', protocols: ['CCS2','AC Type 2'], address: 'Hebbal Flyover, Bengaluru 560024',               amenities: ['Petrol Station','Parking'] },
  { id: 7,  name: 'Tata Power – Manyata Tech Park',  area: 'North',      lat: 13.0456, lng: 77.6205, operator: 'Tata Power',    dcFast: 6, acSlow:10, status: 'busy',      price: 18, power: '7.4 kW / 50 kW', protocols: ['CCS2','CHAdeMO','AC Type 2'], address: 'Manyata Tech Park, Nagawara, Bengaluru 560045',  amenities: ['Office Park','Café','WiFi'] },
  { id: 8,  name: 'Zeon – Yelahanka',                area: 'North',      lat: 13.1012, lng: 77.5963, operator: 'Zeon Charging', dcFast: 2, acSlow: 4, status: 'available', price: 14, power: '7.4 kW / 25 kW', protocols: ['CCS2','AC Type 2'], address: 'Yelahanka New Town, Bengaluru 560064',           amenities: ['Shopping','Parking'] },
  { id: 9,  name: 'BMTC Bus Depot – Jalahalli',      area: 'North',      lat: 13.0284, lng: 77.5298, operator: 'BMTC',          dcFast: 4, acSlow: 8, status: 'available', price: 11, power: '15 kW / 60 kW', protocols: ['CCS2','AC Type 2'], address: 'Jalahalli Bus Depot, Bengaluru 560013',          amenities: ['Restroom'] },
  { id: 10, name: 'Fortum Charge & Drive – Devanahalli', area: 'North',  lat: 13.2377, lng: 77.7120, operator: 'Fortum',        dcFast: 4, acSlow: 4, status: 'available', price: 20, power: '22 kW / 100 kW', protocols: ['CCS2','CHAdeMO'], address: 'Devanahalli, near BIAL, Bengaluru 562110',      amenities: ['Airport Zone','Café','Parking'] },

  // South Bangalore
  { id: 11, name: 'Ather Grid – JP Nagar',           area: 'South',      lat: 12.9063, lng: 77.5937, operator: 'Ather Energy',   dcFast: 2, acSlow: 6, status: 'available', price: 15, power: '7.4 kW / 30 kW', protocols: ['CCS2','AC Type 2'], address: 'JP Nagar 6th Phase, Bengaluru 560078',          amenities: ['Supermarket','Parking'] },
  { id: 12, name: 'BESCOM – Jayanagar',              area: 'South',      lat: 12.9273, lng: 77.5850, operator: 'BESCOM',         dcFast: 3, acSlow: 6, status: 'offline',   price: 12, power: '15 kW / 60 kW', protocols: ['CCS2','AC Type 2'], address: 'Jayanagar 4th Block, Bengaluru 560041',         amenities: ['Restroom','Parking'] },
  { id: 13, name: 'Tata Power – Bannerghatta Road',  area: 'South',      lat: 12.8920, lng: 77.5975, operator: 'Tata Power',    dcFast: 3, acSlow: 6, status: 'busy',      price: 18, power: '7.4 kW / 50 kW', protocols: ['CCS2','AC Type 2'], address: 'Bannerghatta Rd, Bengaluru 560083',             amenities: ['Mall','Parking','Café'] },
  { id: 14, name: 'OLA Electric – BTM Layout',       area: 'South',      lat: 12.9166, lng: 77.6101, operator: 'OLA Electric',  dcFast: 5, acSlow: 8, status: 'available', price: 17, power: '7.4 kW / 50 kW', protocols: ['CCS2','AC Type 2'], address: 'BTM 2nd Stage, Bengaluru 560076',               amenities: ['Café','WiFi','Parking'] },
  { id: 15, name: 'ChargeZone – Mysore Road',        area: 'South',      lat: 12.9380, lng: 77.5209, operator: 'ChargeZone',    dcFast: 2, acSlow: 4, status: 'available', price: 16, power: '7.4 kW / 40 kW', protocols: ['CCS2','AC Type 2'], address: 'Mysore Road, Bengaluru 560026',                 amenities: ['Highway Stop','Restroom'] },

  // East Bangalore
  { id: 16, name: 'Tata Power – Indiranagar',        area: 'East',       lat: 12.9784, lng: 77.6408, operator: 'Tata Power',    dcFast: 3, acSlow: 6, status: 'available', price: 18, power: '7.4 kW / 50 kW', protocols: ['CCS2','AC Type 2'], address: '12th Main, Indiranagar, Bengaluru 560038',      amenities: ['Pub Street','Café','Parking'] },
  { id: 17, name: 'Ather Grid – Koramangala',        area: 'East',       lat: 12.9352, lng: 77.6245, operator: 'Ather Energy',   dcFast: 4, acSlow: 6, status: 'available', price: 15, power: '7.4 kW / 30 kW', protocols: ['CCS2','AC Type 2'], address: 'Koramangala 5th Block, Bengaluru 560095',       amenities: ['Restaurant','WiFi','Parking'] },
  { id: 18, name: 'BESCOM – HAL Airport Road',       area: 'East',       lat: 12.9593, lng: 77.6474, operator: 'BESCOM',         dcFast: 4, acSlow: 8, status: 'busy',      price: 12, power: '15 kW / 60 kW', protocols: ['CCS2','CHAdeMO','AC Type 2'], address: 'HAL 2nd Stage, Bengaluru 560008',               amenities: ['Restroom','Parking'] },
  { id: 19, name: 'MG Motor – Domlur',               area: 'East',       lat: 12.9613, lng: 77.6352, operator: 'MG Motor',      dcFast: 3, acSlow: 4, status: 'available', price: 19, power: '7.4 kW / 50 kW', protocols: ['CCS2','AC Type 2'], address: 'Domlur Layout, Bengaluru 560071',               amenities: ['Showroom','Café','Parking'] },
  { id: 20, name: 'ChargeZone – CV Raman Nagar',     area: 'East',       lat: 12.9840, lng: 77.6680, operator: 'ChargeZone',    dcFast: 2, acSlow: 4, status: 'offline',   price: 16, power: '7.4 kW / 40 kW', protocols: ['CCS2','AC Type 2'], address: 'C.V. Raman Nagar, Bengaluru 560093',           amenities: ['Restroom'] },

  // West Bangalore
  { id: 21, name: 'BESCOM – Rajajinagar',            area: 'West',       lat: 12.9976, lng: 77.5530, operator: 'BESCOM',         dcFast: 3, acSlow: 6, status: 'available', price: 12, power: '15 kW / 60 kW', protocols: ['CCS2','AC Type 2'], address: 'Rajajinagar 1st Block, Bengaluru 560010',       amenities: ['Market','Parking'] },
  { id: 22, name: 'Tata Power – Yeshwanthpur',       area: 'West',       lat: 13.0207, lng: 77.5541, operator: 'Tata Power',    dcFast: 4, acSlow: 6, status: 'busy',      price: 18, power: '7.4 kW / 50 kW', protocols: ['CCS2','AC Type 2'], address: 'Yeshwanthpur, Bengaluru 560022',                amenities: ['Mall','Café','Parking'] },
  { id: 23, name: 'OLA Hypercharger – Majestic',     area: 'West',       lat: 12.9768, lng: 77.5713, operator: 'OLA Electric',  dcFast: 8, acSlow:10, status: 'available', price: 17, power: '22 kW / 100 kW', protocols: ['CCS2','CHAdeMO','AC Type 2'], address: 'Majestic Bus Stand, Bengaluru 560009',          amenities: ['Bus Terminal','Restroom','Café'] },
  { id: 24, name: 'Zeon – Peenya Industrial',        area: 'West',       lat: 13.0279, lng: 77.5171, operator: 'Zeon Charging', dcFast: 3, acSlow: 6, status: 'available', price: 14, power: '7.4 kW / 25 kW', protocols: ['CCS2','AC Type 2'], address: 'Peenya Industrial Area, Bengaluru 560058',      amenities: ['Industrial Zone','Parking'] },

  // Whitefield / IT Corridor
  { id: 25, name: 'Tata Power – Whitefield ITPL',    area: 'Whitefield', lat: 12.9698, lng: 77.7499, operator: 'Tata Power',    dcFast: 8, acSlow:12, status: 'available', price: 18, power: '7.4 kW / 50 kW', protocols: ['CCS2','CHAdeMO','AC Type 2'], address: 'ITPL, Whitefield, Bengaluru 560066',            amenities: ['Tech Park','Café','WiFi','Parking'] },
  { id: 26, name: 'Ather Grid – Marathahalli',       area: 'Whitefield', lat: 12.9591, lng: 77.7004, operator: 'Ather Energy',   dcFast: 4, acSlow: 8, status: 'busy',      price: 15, power: '7.4 kW / 30 kW', protocols: ['CCS2','AC Type 2'], address: 'Marathahalli Bridge, Bengaluru 560037',         amenities: ['Mall','Café','Parking'] },
  { id: 27, name: 'BESCOM – Varthur',                area: 'Whitefield', lat: 12.9414, lng: 77.7480, operator: 'BESCOM',         dcFast: 3, acSlow: 6, status: 'available', price: 12, power: '15 kW / 60 kW', protocols: ['CCS2','AC Type 2'], address: 'Varthur Road, Bengaluru 560087',                amenities: ['Restroom','Parking'] },
  { id: 28, name: 'ChargeZone – Bellandur',          area: 'Whitefield', lat: 12.9256, lng: 77.6775, operator: 'ChargeZone',    dcFast: 3, acSlow: 6, status: 'available', price: 16, power: '7.4 kW / 40 kW', protocols: ['CCS2','AC Type 2'], address: 'Bellandur, Bengaluru 560103',                   amenities: ['Café','WiFi','Parking'] },
  { id: 29, name: 'OLA Electric – Sarjapur Road',    area: 'Whitefield', lat: 12.9073, lng: 77.6958, operator: 'OLA Electric',  dcFast: 4, acSlow: 6, status: 'available', price: 17, power: '7.4 kW / 50 kW', protocols: ['CCS2','AC Type 2'], address: 'Sarjapur Road, Bengaluru 560102',               amenities: ['Tech Park','Café','WiFi'] },
  { id: 30, name: 'Magenta ChargeGrid – Brookefields', area: 'Whitefield', lat: 12.9625, lng: 77.7367, operator: 'Magenta',    dcFast: 2, acSlow: 4, status: 'available', price: 15, power: '7.4 kW / 30 kW', protocols: ['CCS2','AC Type 2'], address: 'Brookefields Mall, Whitefield, Bengaluru 560066', amenities: ['Mall','Café','Parking'] },

  // Electronic City
  { id: 31, name: 'Tata Power – Electronic City Ph1', area: 'Electronic City', lat: 12.8452, lng: 77.6602, operator: 'Tata Power', dcFast: 6, acSlow:12, status: 'available', price: 18, power: '7.4 kW / 50 kW', protocols: ['CCS2','CHAdeMO','AC Type 2'], address: 'Electronic City Phase 1, Bengaluru 560100',      amenities: ['Tech Park','Café','WiFi'] },
  { id: 32, name: 'BESCOM – Electronic City Ph2',     area: 'Electronic City', lat: 12.8360, lng: 77.6703, operator: 'BESCOM',  dcFast: 4, acSlow: 8, status: 'busy',      price: 12, power: '15 kW / 60 kW', protocols: ['CCS2','AC Type 2'], address: 'Electronic City Phase 2, Bengaluru 560100',      amenities: ['Restroom','Parking'] },
  { id: 33, name: 'Ather Grid – Hosa Road',          area: 'Electronic City', lat: 12.8660, lng: 77.6520, operator: 'Ather Energy', dcFast: 3, acSlow: 6, status: 'available', price: 15, power: '7.4 kW / 30 kW', protocols: ['CCS2','AC Type 2'], address: 'Hosa Road Junction, Bengaluru 560100',          amenities: ['Parking','Restroom'] },

  // Airport Corridor
  { id: 34, name: 'BIAL EV Hub – Terminal 1',        area: 'Airport',    lat: 13.1986, lng: 77.7066, operator: 'BIAL',           dcFast: 8, acSlow:16, status: 'available', price: 22, power: '22 kW / 150 kW', protocols: ['CCS2','CHAdeMO','AC Type 2'], address: 'Kempegowda Intl Airport, Terminal 1, Bengaluru 560300', amenities: ['Airport','Café','WiFi','Restroom'] },
  { id: 35, name: 'Fortum – NH44 Corridor',          area: 'Airport',    lat: 13.1456, lng: 77.6680, operator: 'Fortum',        dcFast: 4, acSlow: 4, status: 'available', price: 20, power: '22 kW / 100 kW', protocols: ['CCS2','CHAdeMO'], address: 'NH 44, Ballari Road, Bengaluru 560064',         amenities: ['Highway Stop','Restroom','Parking'] },

  // HSR / Outer Ring Road
  { id: 36, name: 'Ather Grid – HSR Layout',         area: 'HSR/ORR',   lat: 12.9121, lng: 77.6446, operator: 'Ather Energy',   dcFast: 3, acSlow: 6, status: 'available', price: 15, power: '7.4 kW / 30 kW', protocols: ['CCS2','AC Type 2'], address: 'HSR Layout Sector 2, Bengaluru 560102',         amenities: ['Café','WiFi','Parking'] },
  { id: 37, name: 'Tata Power – Outer Ring Road',    area: 'HSR/ORR',   lat: 12.9439, lng: 77.6944, operator: 'Tata Power',    dcFast: 5, acSlow: 8, status: 'busy',      price: 18, power: '7.4 kW / 50 kW', protocols: ['CCS2','AC Type 2'], address: 'Outer Ring Road, Kadubeesanahalli, Bengaluru 560103', amenities: ['Tech Park','Café','Parking'] },
  { id: 38, name: 'ChargeZone – Agara Junction',     area: 'HSR/ORR',   lat: 12.9208, lng: 77.6388, operator: 'ChargeZone',    dcFast: 2, acSlow: 4, status: 'available', price: 16, power: '7.4 kW / 40 kW', protocols: ['CCS2','AC Type 2'], address: 'Agara Lake Road, HSR Layout, Bengaluru 560102',  amenities: ['Restroom','Parking'] },
];

// ─────────────────────────────────────────────
//  Helper: live Overpass API for extra OSM data
// ─────────────────────────────────────────────
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const BANGALORE_BBOX = '12.77,77.46,13.15,77.80';

async function fetchOsmStations() {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="charging_station"](${BANGALORE_BBOX});
      way["amenity"="charging_station"](${BANGALORE_BBOX});
    );
    out center;
  `;
  try {
    const res = await fetch(`${OVERPASS_URL}?data=${encodeURIComponent(query)}`);
    const data = await res.json();
    return (data.elements || []).map((el, i) => ({
      id: `osm_${el.id}`,
      name: el.tags?.name || `OSM EV Station #${i + 1}`,
      area: 'OSM Data',
      lat: el.lat ?? el.center?.lat,
      lng: el.lon ?? el.center?.lon,
      operator: el.tags?.operator || el.tags?.['network'] || 'Unknown',
      dcFast: parseInt(el.tags?.['capacity:car'] || el.tags?.capacity || '1'),
      acSlow: parseInt(el.tags?.['socket:type2'] || '0'),
      status: 'unknown',
      price: null,
      power: el.tags?.['maxpower'] || 'N/A',
      protocols: [el.tags?.['socket:ccs'] ? 'CCS2' : null, el.tags?.['socket:type2'] ? 'AC Type 2' : null].filter(Boolean),
      address: el.tags?.['addr:full'] || el.tags?.['addr:street'] || 'Bengaluru',
      amenities: [],
      fromOSM: true,
    })).filter(s => s.lat && s.lng);
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────
//  Map tile layers
// ─────────────────────────────────────────────
const TILE_LAYERS = {
  satellite: {
    label: '🛰️ Satellite (Earth)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN',
  },
  dark: {
    label: '🌑 Dark Mode',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© CartoDB',
  },
  street: {
    label: '🗺️ Street Map',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
  },
};

const AREAS = ['All', 'Central', 'North', 'South', 'East', 'West', 'Whitefield', 'Electronic City', 'Airport', 'HSR/ORR', 'OSM Data'];
const OPERATORS = ['All', 'Ather Energy', 'Tata Power', 'BESCOM', 'ChargeZone', 'OLA Electric', 'Zeon Charging', 'Fortum', 'MG Motor', 'Magenta', 'BMTC', 'BWSSB', 'BIAL'];
const STATUS_COLORS = { available: '#22C55E', busy: '#F59E0B', offline: '#EF4444', unknown: '#8A9BB3' };

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, zoom, { duration: 1.2 }); }, [center, zoom]);
  return null;
}

// ─────────────────────────────────────────────
//  Station Card in Sidebar
// ─────────────────────────────────────────────
function StationCard({ station, isSelected, onClick }) {
  const statusColor = STATUS_COLORS[station.status] || STATUS_COLORS.unknown;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={onClick}
      style={{
        padding: '12px',
        borderRadius: '8px',
        cursor: 'pointer',
        border: `1px solid ${isSelected ? 'var(--teal)' : 'rgba(255,255,255,0.08)'}`,
        background: isSelected ? 'rgba(0, 229, 192, 0.07)' : 'rgba(255,255,255,0.03)',
        transition: 'all 0.2s',
        boxShadow: isSelected ? '0 0 12px rgba(0,229,192,0.15)' : 'none',
      }}
      whileHover={{ borderColor: 'rgba(0,229,192,0.4)', backgroundColor: 'rgba(0,229,192,0.04)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div>
          <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.88rem', lineHeight: 1.3 }}>{station.name}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
            {station.area} • {station.operator}
          </div>
        </div>
        <div style={{
          flexShrink: 0,
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '0.7rem',
          fontWeight: 700,
          background: statusColor + '22',
          color: statusColor,
          border: `1px solid ${statusColor}44`,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>
          {station.status}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
        {station.dcFast > 0 && (
          <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '4px', background: 'rgba(0,229,192,0.1)', color: 'var(--teal)', border: '1px solid rgba(0,229,192,0.2)' }}>
            ⚡ DC ×{station.dcFast}
          </span>
        )}
        {station.acSlow > 0 && (
          <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '4px', background: 'rgba(14,165,233,0.1)', color: 'var(--blue)', border: '1px solid rgba(14,165,233,0.2)' }}>
            🔌 AC ×{station.acSlow}
          </span>
        )}
        {station.price && (
          <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '4px', background: 'rgba(245,158,11,0.1)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.2)' }}>
            ₹{station.price}/kWh
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
//  Rich Popup Content
// ─────────────────────────────────────────────
function StationPopup({ station }) {
  const statusColor = STATUS_COLORS[station.status] || STATUS_COLORS.unknown;
  return (
    <div style={{ width: '260px', fontFamily: 'var(--font-body)' }}>
      <div style={{
        background: `linear-gradient(135deg, rgba(0,229,192,0.15), rgba(14,165,233,0.08))`,
        borderRadius: '8px',
        padding: '12px',
        border: `1px solid rgba(0,229,192,0.2)`,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div>
            <div style={{ color: '#00E5C0', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.3 }}>{station.name}</div>
            <div style={{ color: '#8A9BB3', fontSize: '0.75rem', marginTop: '2px' }}>{station.operator}</div>
          </div>
          <span style={{
            padding: '3px 8px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 700,
            background: statusColor + '22', color: statusColor, border: `1px solid ${statusColor}44`,
            textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>{station.status}</span>
        </div>

        {/* Address */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', alignItems: 'flex-start' }}>
          <span style={{ color: '#8A9BB3', flexShrink: 0, marginTop: '1px' }}>📍</span>
          <span style={{ color: '#C8DFF5', fontSize: '0.75rem', lineHeight: 1.4 }}>{station.address}</span>
        </div>

        {/* Power & Connectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
          <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
            <div style={{ color: '#00E5C0', fontSize: '1.2rem', fontWeight: 700 }}>{station.dcFast}</div>
            <div style={{ color: '#8A9BB3', fontSize: '0.68rem' }}>DC Fast</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
            <div style={{ color: '#0EA5E9', fontSize: '1.2rem', fontWeight: 700 }}>{station.acSlow}</div>
            <div style={{ color: '#8A9BB3', fontSize: '0.68rem' }}>AC Slow</div>
          </div>
        </div>

        {/* Power rating */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: '#8A9BB3', fontSize: '0.75rem' }}>⚡ Power</span>
          <span style={{ color: '#C8DFF5', fontSize: '0.75rem' }}>{station.power}</span>
        </div>

        {station.price && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#8A9BB3', fontSize: '0.75rem' }}>💰 Rate</span>
            <span style={{ color: '#F59E0B', fontWeight: 600, fontSize: '0.75rem' }}>₹{station.price}/kWh</span>
          </div>
        )}

        {/* Protocols */}
        {station.protocols?.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ color: '#8A9BB3', fontSize: '0.68rem', marginBottom: '4px' }}>PROTOCOLS</div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {station.protocols.map(p => (
                <span key={p} style={{ background: '#1E2D4A', color: '#C8DFF5', padding: '1px 6px', borderRadius: '4px', fontSize: '0.68rem', border: '1px solid #2a3d5a' }}>{p}</span>
              ))}
            </div>
          </div>
        )}

        {/* Amenities */}
        {station.amenities?.length > 0 && (
          <div>
            <div style={{ color: '#8A9BB3', fontSize: '0.68rem', marginBottom: '4px' }}>NEARBY</div>
            <div style={{ color: '#C8DFF5', fontSize: '0.72rem' }}>{station.amenities.join(' · ')}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────
export default function StationMap() {
  const [stations, setStations]             = useState(BANGALORE_EV_STATIONS);
  const [osmStations, setOsmStations]       = useState([]);
  const [loadingOsm, setLoadingOsm]         = useState(false);
  const [filterArea, setFilterArea]         = useState('All');
  const [filterOp, setFilterOp]             = useState('All');
  const [filterStatus, setFilterStatus]     = useState('All');
  const [search, setSearch]                 = useState('');
  const [mapCenter, setMapCenter]           = useState([12.9716, 77.5946]);
  const [mapZoom, setMapZoom]               = useState(12);
  const [selectedId, setSelectedId]         = useState(null);
  const [tileKey, setTileKey]               = useState('satellite');
  const [showOsm, setShowOsm]               = useState(false);
  const [statsPanel, setStatsPanel]         = useState(true);

  // Fetch OSM stations on toggle
  useEffect(() => {
    if (showOsm && osmStations.length === 0) {
      setLoadingOsm(true);
      fetchOsmStations().then(data => {
        setOsmStations(data);
        setLoadingOsm(false);
      });
    }
  }, [showOsm]);

  const allStations = showOsm ? [...stations, ...osmStations] : stations;

  const filtered = allStations.filter(s => {
    if (filterArea !== 'All' && s.area !== filterArea) return false;
    if (filterOp !== 'All' && s.operator !== filterOp) return false;
    if (filterStatus !== 'All' && s.status !== filterStatus) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) &&
        !s.area.toLowerCase().includes(search.toLowerCase()) &&
        !s.operator.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectStation = (station) => {
    setSelectedId(station.id);
    setMapCenter([station.lat, station.lng]);
    setMapZoom(15);
  };

  // Stats
  const stats = {
    total:     filtered.length,
    available: filtered.filter(s => s.status === 'available').length,
    busy:      filtered.filter(s => s.status === 'busy').length,
    offline:   filtered.filter(s => s.status === 'offline').length,
    dcPorts:   filtered.reduce((a, s) => a + (s.dcFast || 0), 0),
    acPorts:   filtered.reduce((a, s) => a + (s.acSlow || 0), 0),
  };

  const currentTile = TILE_LAYERS[tileKey];

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', position: 'relative', overflow: 'hidden' }}>

      {/* ── Inline keyframes ── */}
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: translate(-50%,-50%) scale(0.8); opacity: 0.8; }
          100% { transform: translate(-50%,-50%) scale(1.6); opacity: 0; }
        }
        .leaflet-popup-content-wrapper, .leaflet-popup-tip {
          background: #0B1424 !important;
          color: #C8DFF5 !important;
          border: 1px solid rgba(0,229,192,0.3) !important;
          border-radius: 10px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(0,229,192,0.1) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-popup-close-button { color: #8A9BB3 !important; right: 10px !important; top: 10px !important; font-size: 20px !important; }
        .leaflet-control-layers { background: #0B1424 !important; border: 1px solid #1E2D4A !important; color: #C8DFF5 !important; }
        .leaflet-bar a { background: #0B1424 !important; color: #C8DFF5 !important; border-color: #1E2D4A !important; }
        .leaflet-bar a:hover { background: rgba(0,229,192,0.1) !important; }
        .station-list-item:hover { border-color: rgba(0,229,192,0.4) !important; }
        .map-overlay-btn { transition: all 0.2s; }
        .map-overlay-btn:hover { background: rgba(0,229,192,0.15) !important; border-color: var(--teal) !important; }
      `}</style>

      {/* ═══════════════════════════════════════
           LEFT SIDEBAR
          ═══════════════════════════════════════ */}
      <div style={{
        width: '320px',
        background: '#0A1628',
        borderRight: '1px solid #1E2D4A',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        flexShrink: 0,
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 16px 12px',
          borderBottom: '1px solid #1E2D4A',
          background: 'linear-gradient(180deg, rgba(0,229,192,0.06) 0%, transparent 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ fontSize: '1.6rem' }}>🔋</div>
            <div>
              <h2 style={{ color: 'var(--teal)', margin: 0, fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>BENGALURU EV MAP</h2>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', letterSpacing: '0.8px' }}>CHARGING STATION FINDER</div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <AnimatePresence>
          {statsPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                padding: '12px 14px',
                borderBottom: '1px solid #1E2D4A',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
              }}>
                {[
                  { label: 'STATIONS', value: stats.total, color: 'var(--teal)' },
                  { label: 'AVAILABLE', value: stats.available, color: '#22C55E' },
                  { label: 'BUSY', value: stats.busy, color: '#F59E0B' },
                  { label: 'OFFLINE', value: stats.offline, color: '#EF4444' },
                  { label: 'DC PORTS', value: stats.dcPorts, color: 'var(--teal)' },
                  { label: 'AC PORTS', value: stats.acPorts, color: 'var(--blue)' },
                ].map(item => (
                  <div key={item.label} style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '6px',
                    padding: '7px',
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ color: item.color, fontWeight: 700, fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>{item.value}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', letterSpacing: '0.5px' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #1E2D4A', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>🔍</span>
            <input
              type="text"
              placeholder="Search stations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid #1E2D4A',
                color: 'var(--text)',
                borderRadius: '6px',
                padding: '7px 10px 7px 30px',
                fontSize: '0.82rem',
                outline: 'none',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>
          {/* Area & Status filters */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <select value={filterArea} onChange={e => setFilterArea(e.target.value)} style={{ fontSize: '0.78rem', padding: '6px 8px' }}>
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ fontSize: '0.78rem', padding: '6px 8px' }}>
              {['All', 'available', 'busy', 'offline', 'unknown'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <select value={filterOp} onChange={e => setFilterOp(e.target.value)} style={{ fontSize: '0.78rem', padding: '6px 8px' }}>
            {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          {/* OSM Toggle + Stats toggle */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setShowOsm(!showOsm)}
              style={{
                flex: 1, fontSize: '0.72rem', padding: '5px',
                background: showOsm ? 'rgba(0,229,192,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${showOsm ? 'var(--teal)' : '#1E2D4A'}`,
                color: showOsm ? 'var(--teal)' : 'var(--text-muted)',
                borderRadius: '6px',
              }}>
              {loadingOsm ? '⏳ Loading OSM...' : `🌐 OSM Data ${showOsm ? '(ON)' : '(OFF)'}`}
            </button>
            <button
              onClick={() => setStatsPanel(!statsPanel)}
              style={{
                fontSize: '0.72rem', padding: '5px 10px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid #1E2D4A',
                color: 'var(--text-muted)', borderRadius: '6px',
              }}>
              📊
            </button>
            <button
              onClick={() => { setMapCenter([12.9716, 77.5946]); setMapZoom(12); }}
              style={{
                fontSize: '0.72rem', padding: '5px 10px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid #1E2D4A',
                color: 'var(--text-muted)', borderRadius: '6px',
              }}
              title="Reset to Bangalore view">
              🎯
            </button>
          </div>
        </div>

        {/* Station List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '7px',
        }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', letterSpacing: '0.6px', marginBottom: '4px' }}>
            SHOWING {filtered.length} STATIONS
          </div>
          <AnimatePresence mode="popLayout">
            {filtered.map(station => (
              <StationCard
                key={station.id}
                station={station}
                isSelected={selectedId === station.id}
                onClick={() => selectStation(station)}
              />
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px', fontSize: '0.85rem' }}>
              🔍 No stations found.<br />Try adjusting your filters.
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid #1E2D4A',
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
        }}>
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}` }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'capitalize' }}>{status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════
           MAP AREA
          ═══════════════════════════════════════ */}
      <div style={{ flex: 1, position: 'relative' }}>

        {/* Map tile switcher overlay */}
        <div style={{
          position: 'absolute', top: '12px', right: '12px', zIndex: 1000,
          display: 'flex', gap: '6px', flexDirection: 'column', alignItems: 'flex-end',
        }}>
          {Object.entries(TILE_LAYERS).map(([key, layer]) => (
            <button
              key={key}
              className="map-overlay-btn"
              onClick={() => setTileKey(key)}
              style={{
                fontSize: '0.72rem',
                padding: '6px 12px',
                background: tileKey === key ? 'rgba(0,229,192,0.2)' : 'rgba(10,22,40,0.85)',
                border: `1px solid ${tileKey === key ? 'var(--teal)' : '#1E2D4A'}`,
                color: tileKey === key ? 'var(--teal)' : 'var(--text-muted)',
                borderRadius: '6px',
                backdropFilter: 'blur(8px)',
                cursor: 'pointer',
              }}
            >
              {layer.label}
            </button>
          ))}

          {/* Quick fly buttons */}
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { label: '🏙️ City Center', lat: 12.9716, lng: 77.5946, zoom: 13 },
              { label: '💻 Whitefield', lat: 12.9698, lng: 77.7499, zoom: 14 },
              { label: '🏭 Elec City',  lat: 12.8452, lng: 77.6602, zoom: 14 },
              { label: '✈️ Airport',    lat: 13.1986, lng: 77.7066, zoom: 13 },
            ].map(btn => (
              <button
                key={btn.label}
                className="map-overlay-btn"
                onClick={() => { setMapCenter([btn.lat, btn.lng]); setMapZoom(btn.zoom); }}
                style={{
                  fontSize: '0.68rem',
                  padding: '5px 10px',
                  background: 'rgba(10,22,40,0.85)',
                  border: '1px solid #1E2D4A',
                  color: 'var(--text-muted)',
                  borderRadius: '5px',
                  backdropFilter: 'blur(8px)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Station count badge */}
        <div style={{
          position: 'absolute', bottom: '20px', left: '12px', zIndex: 1000,
          background: 'rgba(10,22,40,0.9)',
          border: '1px solid rgba(0,229,192,0.3)',
          borderRadius: '8px',
          padding: '8px 14px',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ color: 'var(--teal)', fontWeight: 700, fontSize: '1rem' }}>{filtered.length}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>EV stations on map</span>
          <span style={{ color: '#1E2D4A', margin: '0 4px' }}>|</span>
          <span style={{ color: '#22C55E', fontWeight: 600, fontSize: '0.8rem' }}>{stats.available} available</span>
        </div>

        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          preferCanvas={false}
        >
          <ChangeView center={mapCenter} zoom={mapZoom} />

          <TileLayer
            key={tileKey}
            url={currentTile.url}
            attribution={currentTile.attribution}
            maxZoom={19}
          />

          {/* Satellite label overlay when on satellite view */}
          {tileKey === 'satellite' && (
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
              attribution="© CartoDB"
              opacity={0.85}
            />
          )}

          {filtered.map(station => (
            <Marker
              key={station.id}
              position={[station.lat, station.lng]}
              icon={createEVIcon(station.status, 'ev', selectedId === station.id)}
              eventHandlers={{
                click: () => setSelectedId(station.id),
              }}
            >
              <Popup minWidth={270} maxWidth={280}>
                <StationPopup station={station} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
