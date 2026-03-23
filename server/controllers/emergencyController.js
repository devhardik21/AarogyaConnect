// ─── Emergency (Ambulance) Controller ────────────────────────────────────────
// Integrated from ambulance/server/controllers/ambulanceController.js
// Converted from CommonJS to ESM to match the main server's module format.

import { dummyAmbulances, calculateDistance } from '../data/dummyData.js';

// In-memory ambulance state (resets on server restart — same behaviour as standalone)
let ambulances = [...dummyAmbulances];
let ambulancesInitialized = false;

const AVG_SPEED_KMH = 30;

// GET /api/emergency/ambulances/nearby?lat=&lng=
export const getNearbyAmbulances = (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required.' });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    // Scatter ambulances around the user's location on first call
    if (!ambulancesInitialized) {
      ambulances = dummyAmbulances.map(amb => {
        const latOffset = (Math.random() - 0.5) * 0.1;
        const lngOffset = (Math.random() - 0.5) * 0.1;
        return {
          ...amb,
          location: {
            lat: userLat + latOffset,
            lng: userLng + lngOffset
          }
        };
      });
      ambulancesInitialized = true;
    }

    const nearbyAmbulances = ambulances
      .filter(amb => amb.availability)
      .map(amb => {
        const distance = calculateDistance(userLat, userLng, amb.location.lat, amb.location.lng);
        const etaMinutes = Math.round((distance / AVG_SPEED_KMH) * 60);
        return {
          ...amb,
          distance: distance.toFixed(2),
          eta: etaMinutes
        };
      })
      .sort((a, b) => a.distance - b.distance);

    res.status(200).json({ success: true, data: nearbyAmbulances });
  } catch (error) {
    console.error('Error in getNearbyAmbulances:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// POST /api/emergency/ambulance/book
export const bookAmbulance = (req, res) => {
  try {
    const { ambulanceId } = req.body;

    if (!ambulanceId) {
      return res.status(400).json({ success: false, message: 'Ambulance ID is required.' });
    }

    const idx = ambulances.findIndex(amb => amb.id === ambulanceId);

    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Ambulance not found.' });
    }

    if (!ambulances[idx].availability) {
      return res.status(400).json({ success: false, message: 'Ambulance is no longer available.' });
    }

    ambulances[idx].availability = false;

    // Broadcast via the shared Socket.io instance
    const io = req.app.get('io');
    io.emit('ambulance_booked', { id: ambulanceId });

    res.status(200).json({
      success: true,
      message: 'Ambulance booked successfully.',
      data: ambulances[idx]
    });
  } catch (error) {
    console.error('Error in bookAmbulance:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// POST /api/emergency/ambulance/update-location
export const updateAmbulanceLocation = (req, res) => {
  try {
    const { id, lat, lng } = req.body;

    if (!id || !lat || !lng) {
      return res.status(400).json({ success: false, message: 'id, lat and lng are required.' });
    }

    const idx = ambulances.findIndex(amb => amb.id === id);

    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Ambulance not found.' });
    }

    ambulances[idx].location.lat = parseFloat(lat);
    ambulances[idx].location.lng = parseFloat(lng);

    const io = req.app.get('io');
    io.emit('location_update', { id, location: { lat, lng } });

    res.status(200).json({ success: true, message: 'Location updated via socket.' });
  } catch (error) {
    console.error('Error in updateAmbulanceLocation:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
