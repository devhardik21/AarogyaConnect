import { Router } from 'express';
import SymptomLog from '../models/SymptomLog.js';

const router = Router();

// POST /api/symptoms — Save a new symptom log from the AI chat
router.post('/', async (req, res) => {
    try {
        const { userId, bodyPart, zone, symptoms, messages } = req.body;
        if (!bodyPart) return res.status(400).json({ error: 'bodyPart is required' });

        // Simple risk estimation — Connect Gemini here for real AI risk scoring
        let riskLevel = 'low';
        const highRiskSymptoms = ['breath', 'chest', 'heart'];
        if (symptoms && symptoms.some(s => highRiskSymptoms.includes(s))) riskLevel = 'high';
        else if (symptoms && symptoms.length > 2) riskLevel = 'medium';

        const log = await SymptomLog.create({ userId, bodyPart, zone, symptoms, messages, riskLevel });
        res.status(201).json({ success: true, log });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/symptoms — Latest 20 logs (for admin / history)
router.get('/', async (req, res) => {
    try {
        const logs = await SymptomLog.find().sort({ createdAt: -1 }).limit(20);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/symptoms/:id — Fetch a specific log
router.get('/:id', async (req, res) => {
    try {
        const log = await SymptomLog.findById(req.params.id);
        if (!log) return res.status(404).json({ error: 'Not found' });
        res.json(log);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
