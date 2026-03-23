// ─── Ambulance Dummy Data Generator ──────────────────────────────────────────
// Copied directly from ambulance/client/src/utils/dummyGenerator.js
// No changes needed — already uses ES module exports.

// Helper: Haversine distance between two lat/lng points (km)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

export const generateSingleAmbulance = (userLat, userLng, idOverride = null) => {
  const types = [
    { name: 'General Purpose', priceRange: [300, 600], features: ['Basic First Aid', 'Oxygen'] },
    { name: 'Basic Life Support (BLS)', priceRange: [600, 1000], features: ['Oxygen', 'Stretcher', 'Paramedic'] },
    { name: 'Mobile ICU', priceRange: [1000, 1500], features: ['Ventilator', 'Monitor', 'Defibrillator', 'Doctor'] },
    { name: 'Cardiac', priceRange: [1200, 1500], features: ['ACLS', 'Cardiac Monitor', 'Doctor'] }
  ];

  const angle = Math.random() * Math.PI * 2;
  const distanceKm = Math.random() * 11 + 1; // 1–12 km
  const degreeOffset = distanceKm / 111;

  const lat = userLat + degreeOffset * Math.cos(angle);
  const lng = userLng + degreeOffset * Math.sin(angle);

  const typeObj = types[Math.floor(Math.random() * types.length)];
  const price = Math.floor(Math.random() * (typeObj.priceRange[1] - typeObj.priceRange[0])) + typeObj.priceRange[0];
  const rating = (Math.random() * (4.9 - 4.2) + 4.2).toFixed(1);
  const eta = Math.round((distanceKm / 35) * 60);

  return {
    id: idOverride || `AMB_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: typeObj.name,
    features: typeObj.features,
    rating: parseFloat(rating),
    location: { lat, lng },
    distance: distanceKm.toFixed(1),
    eta,
    basePrice: price,
    availability: true,
    capacity: 1,
    isBookedActive: false,
    source: 'user_radius',
    hospitalName: null
  };
};

export const generateHospitalAmbulance = (userLat, userLng, hospitalCoords, hospitalName, idOverride) => {
  const types = [
    { name: 'General Purpose', priceRange: [300, 600], features: ['Basic First Aid', 'Oxygen'] },
    { name: 'Basic Life Support (BLS)', priceRange: [600, 1000], features: ['Oxygen', 'Stretcher', 'Paramedic'] },
    { name: 'Mobile ICU', priceRange: [1000, 1500], features: ['Ventilator', 'Monitor', 'Defibrillator', 'Doctor'] }
  ];

  const lat = hospitalCoords.lat + (Math.random() * 0.002 - 0.001);
  const lng = hospitalCoords.lng + (Math.random() * 0.002 - 0.001);

  const distanceKm = calculateDistance(userLat, userLng, lat, lng);
  const eta = Math.round((distanceKm / 35) * 60);

  const typeObj = types[Math.floor(Math.random() * types.length)];
  const price = Math.floor(Math.random() * (typeObj.priceRange[1] - typeObj.priceRange[0])) + typeObj.priceRange[0];
  const rating = (Math.random() * (4.9 - 4.5) + 4.5).toFixed(1);

  return {
    id: idOverride || `AMB_HOSP_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: typeObj.name,
    features: typeObj.features,
    rating: parseFloat(rating),
    location: { lat, lng },
    distance: distanceKm.toFixed(1),
    eta,
    basePrice: price,
    availability: true,
    capacity: 1,
    isBookedActive: false,
    source: 'hospital',
    hospitalName
  };
};

export const repositionAmbulance = (amb, userLat, userLng) => {
  const fresh = generateSingleAmbulance(userLat, userLng, amb.id);
  return {
    ...amb,
    location: fresh.location,
    distance: fresh.distance,
    eta: fresh.eta,
    availability: true,
    isBookedActive: false,
    source: 'user_radius',
    hospitalName: null
  };
};

export const generateDummyAmbulances = (userLat, userLng, hospitals = []) => {
  const ambulances = [];

  // 3–4 user-radius ambulances
  const numUserAmbs = Math.floor(Math.random() * 2) + 3;
  for (let i = 1; i <= numUserAmbs; i++) {
    const amb = generateSingleAmbulance(userLat, userLng, `AMB00${i}`);
    amb.availability = i > 1 ? Math.random() > 0.15 : true;
    ambulances.push(amb);
  }

  // 1–2 hospital ambulances per hospital
  let hospCounter = 1;
  hospitals.forEach(hospital => {
    const numHospAmbs = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < numHospAmbs; i++) {
      const amb = generateHospitalAmbulance(
        userLat, userLng,
        hospital.location,
        hospital.name,
        `AMB_HOSP_${hospCounter++}`
      );
      amb.availability = Math.random() > 0.10;
      ambulances.push(amb);
    }
  });

  return ambulances;
};

export const updateAmbulanceLocationsSimulated = (ambulances, userLat, userLng) => {
  return ambulances.map(amb => {
    if (!amb.availability && amb.isBookedActive) {
      const currentDist = calculateDistance(userLat, userLng, amb.location.lat, amb.location.lng);
      if (currentDist < 0.1) {
        return { ...amb, distance: 0, eta: 0 };
      }
      const newLat = amb.location.lat + (userLat - amb.location.lat) * 0.15;
      const newLng = amb.location.lng + (userLng - amb.location.lng) * 0.15;
      const newDistance = calculateDistance(userLat, userLng, newLat, newLng);
      const newEta = Math.round((newDistance / 35) * 60);
      return {
        ...amb,
        location: { lat: newLat, lng: newLng },
        distance: newDistance.toFixed(1),
        eta: newEta
      };
    }
    return amb;
  });
};
