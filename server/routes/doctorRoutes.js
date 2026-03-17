import { Router } from 'express';
import Doctor from '../models/Doctor.js';

const router = Router();

// GET /api/doctors — List all available doctors
router.get('/', async (req, res) => {
    try {
        const doctors = await Doctor.find({ available: true });
        res.json(doctors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/doctors — Seed/add a doctor
router.post('/', async (req, res) => {
    try {
        const doctor = await Doctor.create(req.body);
        res.status(201).json(doctor);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
