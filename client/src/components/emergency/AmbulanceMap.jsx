// ─── Ambulance Map Component ──────────────────────────────────────────────────
// Integrated from ambulance/client/src/components/Map.jsx
// Placed in a dedicated /emergency subfolder to avoid naming collisions
// with any future Map component in the main app.

import React, { useEffect, useState } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

// Using Carto's free vector tile style — no Mapbox billing required.
// The token below is only needed to satisfy the react-map-gl API;
// actual map tiles are served by Carto without quota restrictions.
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function AmbulanceMap({ userLocation, ambulances, hospitals = [], selectedAmbulance }) {
  const [viewState, setViewState] = useState({
    longitude: 77.2090,
    latitude: 28.6139,
    zoom: 14,
    pitch: 45
  });

  // Centre map when the user's location becomes available
  useEffect(() => {
    if (userLocation) {
      setViewState(prev => ({
        ...prev,
        longitude: userLocation.lng,
        latitude: userLocation.lat
      }));
    }
  }, [userLocation]);

  return (
    <div className="absolute inset-0 w-full h-[65%] md:h-[100%] z-0">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        {/* User Location Marker */}
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="bottom">
            <div className="relative flex items-center justify-center w-8 h-8">
              <div className="absolute w-4 h-4 bg-blue-500 rounded-full shadow-lg border-2 border-white z-10"></div>
              <div className="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-30"></div>
            </div>
          </Marker>
        )}

        {/* Ambulance Markers */}
        {ambulances.map(amb => (
          <Marker
            key={amb.id}
            longitude={amb.location.lng}
            latitude={amb.location.lat}
            anchor="bottom"
          >
            <div className={`transition-transform duration-500 ease-in-out ${selectedAmbulance === amb.id ? 'scale-125 z-20' : 'scale-100'
              }`}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full shadow-lg bg-white border-2 border-gray-200 ${selectedAmbulance === amb.id ? 'ring-4 ring-blue-400' : ''
                }`}>
                <img
                  src="https://img.icons8.com/color/96/ambulance.png"
                  alt="Ambulance"
                  className={`w-6 h-6 ${!amb.availability
                      ? 'grayscale opacity-50'
                      : amb.type === 'Mobile ICU'
                        ? 'hue-rotate-180'
                        : amb.type === 'Basic Life Support (BLS)'
                          ? 'hue-rotate-90'
                          : ''
                    }`}
                />
              </div>
            </div>
          </Marker>
        ))}

        {/* Hospital Markers */}
        {hospitals.map(hosp => (
          <Marker
            key={hosp.id}
            longitude={hosp.location.lng}
            latitude={hosp.location.lat}
            anchor="bottom"
          >
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full shadow-lg bg-red-50 border-2 border-red-500 z-10">
                <img
                  src="https://img.icons8.com/color/96/hospital.png"
                  alt="Hospital"
                  className="w-5 h-5"
                />
              </div>
              <div className="bg-white/90 text-red-700 text-[9px] font-bold px-1.5 py-0.5 mt-0.5 rounded shadow-sm border border-red-100 backdrop-blur-sm whitespace-nowrap">
                {hosp.name}
              </div>
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
}

export default AmbulanceMap;
