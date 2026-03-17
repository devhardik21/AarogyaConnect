import { Router } from 'express';
import Vital from '../models/Vital.js';

const router = Router();

// POST /api/vitals — Save a new vitals reading
router.post('/', async (req, res) => {
    try {
        const vital = await Vital.create(req.body);
        res.status(201).json(vital);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/vitals — Get last 10 readings for a userId
router.get('/', async (req, res) => {
    try {
        const { userId = 'anonymous' } = req.query;
        const vitals = await Vital.find({ userId }).sort({ recordedAt: -1 }).limit(10);
        res.json(vitals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
