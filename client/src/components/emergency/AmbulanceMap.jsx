// ─── Ambulance Map Component (Leaflet Version) ───────────────────────────────
// Replaced react-map-gl with react-leaflet to avoid Mapbox token issues.
// Uses CartoDB Voyager tiles which are free and don't require a token.

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Custom Icons ─────────────────────────────────────────────────────────────

// User Icon with ping animation
const userIcon = new L.DivIcon({
  className: 'user-location-marker',
  html: `
    <div class="relative flex items-center justify-center w-8 h-8">
      <div class="absolute w-4 h-4 bg-blue-500 rounded-full shadow-lg border-2 border-white z-10"></div>
      <div class="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-30"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Ambulance Icon with dynamic styling
const getAmbulanceIcon = (selected, availability, type) => {
  let filter = '';
  if (!availability) {
    filter = 'grayscale(1) opacity(0.5)';
  } else if (type === 'Mobile ICU') {
    filter = 'hue-rotate(180deg)';
  } else if (type === 'Basic Life Support (BLS)') {
    filter = 'hue-rotate(90deg)';
  }

  return new L.DivIcon({
    className: 'ambulance-marker',
    html: `
      <div class="transition-transform duration-500 ease-in-out ${selected ? 'scale-125 z-[1000]' : 'scale-100'}">
        <div class="flex items-center justify-center w-10 h-10 rounded-full shadow-lg bg-white border-2 border-gray-200 ${selected ? 'ring-4 ring-blue-400' : ''}">
          <img 
            src="https://img.icons8.com/color/96/ambulance.png" 
            style="width: 24px; height: 24px; filter: ${filter};" 
          />
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

// Hospital Icon with name label
const getHospitalIcon = (name) => {
  return new L.DivIcon({
    className: 'hospital-marker',
    html: `
      <div class="flex flex-col items-center justify-center">
        <div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg bg-red-50 border-2 border-red-500 z-10">
          <img src="https://img.icons8.com/color/96/hospital.png" class="w-5 h-5" />
        </div>
        <div class="bg-white/90 text-red-700 text-[9px] font-bold px-1.5 py-0.5 mt-0.5 rounded shadow-sm border border-red-100 backdrop-blur-sm whitespace-nowrap">
          ${name}
        </div>
      </div>
    `,
    iconSize: [100, 40],
    iconAnchor: [50, 20]
  });
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Component to handle map centering when user location changes
function RecenterMap({ location }) {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.setView([location.lat, location.lng], 14, { animate: true });
    }
  }, [location, map]);
  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

function AmbulanceMap({ userLocation, ambulances, hospitals = [], selectedAmbulance }) {
  const defaultCenter = [28.6139, 77.2090];
  const center = userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter;

  return (
    <div className="absolute inset-0 w-full h-[65%] md:h-[100%] z-0">
      <MapContainer
        center={center}
        zoom={14}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <RecenterMap location={userLocation} />

        {/* User Location Marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />
        )}

        {/* Ambulance Markers */}
        {ambulances.map(amb => (
          <Marker
            key={amb.id}
            position={[amb.location.lat, amb.location.lng]}
            icon={getAmbulanceIcon(selectedAmbulance === amb.id, amb.availability, amb.type)}
          />
        ))}

        {/* Hospital Markers */}
        {hospitals.map(hosp => (
          <Marker
            key={hosp.id}
            position={[hosp.location.lat, hosp.location.lng]}
            icon={getHospitalIcon(hosp.name)}
          />
        ))}
      </MapContainer>
    </div>
  );
}

export default AmbulanceMap;
