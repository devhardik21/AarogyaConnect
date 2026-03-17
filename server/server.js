import authRoutes from './routes/authRoutes.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pkg from 'agora-access-token';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import symptomRoutes from './routes/symptomRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import vitalRoutes from './routes/vitalRoutes.js';
const { RtcTokenBuilder, RtcRole } = pkg;
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: { origin: "*" }
});
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
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
app.use('/', (req, res) => {
    res.send('Hello World!');
});

// ─── AI & Socket Setup ───────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

io.on('connection', (socket) => {
    console.log('👤 New Client Connected:', socket.id);

    // Joint room for signaling
    socket.on('join-room', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their signaling room`);
    });

    // Notify doctor of incoming call
    socket.on('call-doctor', ({ doctorId, patientId, patientName, channelName }) => {
        io.to(doctorId).emit('incoming-call', { patientId, patientName, channelName });
    });

    socket.on('disconnect', () => {
        console.log('Client Disconnected');
    });
});

// ─── AI Chat with Context ─────────────────────────────────────────────────────
app.post('/api/ai/chat', async (req, res) => {
    const { message, userContext } = req.body;
    console.log(`🤖 AI Chat Request: "${message}" for user: ${userContext?.name || 'Unknown'}`);
    try {
        const systemPrompt = `
        You are Arogya AI, a helpful healthcare assistant for rural India.
        User Context: ${JSON.stringify(userContext || {})}
        
        Rules:
        1. Be empathetic and clear. Use Hindi/English (Hinglish).
        2. If the user is female and the query could be related to menstrual health, provide a "WOMEN_CORNER" insight.
        3. If there's a serious symptom, suggest visiting a doctor.
        4. Provide "Desi remedies" (Home remedies) where appropriate but keep them safe.
        
        Format your response as a JSON object:
        {
            "reply": "your text response here",
            "isWomenCorner": true/false,
            "womenCornerInsight": "Pink theme insight about cycle or remedies here (if applicable, otherwise null)"
        }
        `;

        const result = await model.generateContent([systemPrompt, message]);
        const responseText = result.response.text();
        console.log(`🤖 AI raw response: ${responseText}`);

        // Try to parse JSON from AI, or fallback
        try {
            const cleanJson = responseText.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            console.log(`✅ AI Response parsed successfully`);
            res.json(parsed);
        } catch (e) {
            console.warn(`⚠️ AI response was not valid JSON, sending as plain reply`);
            res.json({ reply: responseText, isWomenCorner: false });
        }
    } catch (error) {
        console.error(`❌ AI Chat Error:`, error.message);
        res.status(500).json({ error: error.message });
    }
});

// ─── Sarvam AI Proxy ──────────────────────────────────────────────────────────
app.post('/api/ai/tts', async (req, res) => {
    try {
        const response = await axios.post('https://api.sarvam.ai/text-to-speech', req.body, {
            headers: { 'api-subscription-key': process.env.SARVAM_API_KEY }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/ai/stt', async (req, res) => {
    console.log(`🎙️ STT Request received`);
    try {
        const response = await axios.post('https://api.sarvam.ai/speech-to-text', req.body, {
            headers: { 'api-subscription-key': process.env.SARVAM_API_KEY }
        });
        console.log(`🎙️ STT Transcription:`, response.data.transcript);
        res.json(response.data);
    } catch (error) {
        console.error(`❌ STT Error:`, error.response?.data || error.message);
        res.status(500).json({ error: error.message });
    }
});

// ─── Agora Token Generation ───────────────────────────────────────────────────
app.get('/api/agora/token', (req, res) => {
    const channelName = req.query.channelName;
    if (!channelName) return res.status(400).json({ error: 'channelName is required' });

    const uid = 0;
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
        process.env.AGORA_APP_ID || "PASTE_APP_ID",
        process.env.AGORA_APP_CERTIFICATE || "PASTE_CERTIFICATE",
        channelName,
        uid,
        role,
        privilegeExpiredTs
    );

    res.json({ token });
});

// ─── Start ──────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
    console.log(`🚀  ArogyaConnect server running → http://localhost:${PORT}`);
});
