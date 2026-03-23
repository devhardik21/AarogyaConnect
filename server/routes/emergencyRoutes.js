// ─── Emergency (Ambulance) Routes ────────────────────────────────────────────
// Mounted at /api/emergency in server.js
// Integrated from ambulance/server/routes/ambulanceRoutes.js — converted to ESM

import express from 'express';
import {
  getNearbyAmbulances,
  bookAmbulance,
  updateAmbulanceLocation
} from '../controllers/emergencyController.js';

const router = express.Router();

// GET  /api/emergency/ambulances/nearby?lat=&lng=
router.get('/ambulances/nearby', getNearbyAmbulances);

// POST /api/emergency/ambulance/book
router.post('/ambulance/book', bookAmbulance);

// POST /api/emergency/ambulance/update-location  (internal/admin use)
router.post('/ambulance/update-location', updateAmbulanceLocation);

export default router;
