// ─── Dummy Ambulance Data (in-memory) ────────────────────────────────────────
// Integrated from ambulance/server/data/dummyData.js — converted to ESM

export const dummyAmbulances = [
  {
    id: 'amb-1',
    type: 'General Purpose',
    description: 'For low-risk patients requiring basic monitoring',
    location: {
      lat: 28.6139 + 0.01,
      lng: 77.2090 + 0.01
    },
    availability: true,
    basePrice: 500,
    capacity: 1,
    eta: null
  },
  {
    id: 'amb-2',
    type: 'Basic Life Support (BLS)',
    description: 'Equipped with basic medical equipment and EMT',
    location: {
      lat: 28.6139 - 0.02,
      lng: 77.2090 + 0.015
    },
    availability: true,
    basePrice: 1500,
    capacity: 1,
    eta: null
  },
  {
    id: 'amb-3',
    type: 'Mobile ICU',
    description: 'For high-risk patients requiring advanced life support',
    location: {
      lat: 28.6139 + 0.005,
      lng: 77.2090 - 0.02
    },
    availability: true,
    basePrice: 4000,
    capacity: 1,
    eta: null
  },
  {
    id: 'amb-4',
    type: 'General Purpose',
    description: 'For low-risk patients requiring basic monitoring',
    location: {
      lat: 28.6139 - 0.01,
      lng: 77.2090 - 0.01
    },
    availability: false, // Currently booked
    basePrice: 500,
    capacity: 1,
    eta: null
  }
];

// Haversine formula — returns distance in km
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
