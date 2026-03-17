import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import symptomRoutes from './routes/symptomRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import vitalRoutes from './routes/vitalRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// ─── Database Connection ───────────────────────────────────────────────────────
mongoose
    .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/arogyaconnect')
    .then(() => console.log(`✅  MongoDB connected → ${process.env.MONGO_URI}`))
    .catch(err => console.error('❌  MongoDB error:', err.message));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'ArogyaConnect API v1.0' }));

app.use('/api/symptoms', symptomRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/vitals', vitalRoutes);
app.use('/api/auth', authRoutes);

// ─── Gemini AI Proxy (stub — wire the Gemini SDK here) ────────────────────────
// Connect Gemini here
app.post('/api/ai/chat', async (req, res) => {
    const { message, context } = req.body;
    // TODO: const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // TODO: const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    // TODO: const result = await model.generateContent(message);
    res.json({ reply: `AI response for: "${message}" (Gemini not wired yet)` });
});

// ─── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀  ArogyaConnect server running → http://localhost:${PORT}`);
});
