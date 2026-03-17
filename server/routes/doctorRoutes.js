import { Router } from 'express';
import User from '../models/User.js';

const router = Router();

// GET /api/doctors — List all available doctors
router.get('/', async (req, res) => {
    try {
        console.log("👨‍⚕️ Fetching doctor list...");
        const doctors = await User.find({ role: 'doctor' });

        // Map to format expected by frontend
        const mappedDoctors = doctors.map(doc => ({
            id: doc._id,
            name: doc.name,
            spec: doc.profile?.specialty || 'General Physician',
            status: 'Online', // Could be dynamic
            exp: doc.profile?.experience || '5 Years',
            rating: 4.8,
            reviews: 124,
            fee: '₹500',
            color: 'blue'
        }));

        console.log(`👨‍⚕️ Found ${mappedDoctors.length} doctors`);
        res.json(mappedDoctors);
    } catch (err) {
        console.error("❌ Error fetching doctors:", err.message);
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
