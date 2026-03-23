import authRoutes from './routes/authRoutes.js';
import { registerSarvamHandlers } from './sarvamHandlers.js';
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
import emergencyRoutes from './routes/emergencyRoutes.js';
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
app.use('/api/emergency', emergencyRoutes);

// ─── AI & Socket Setup ───────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

// ─── In-Memory Call Queue ────────────────────────────────────────────────────
// Maps doctorId → array of pending call objects
const callQueue = new Map();

const addToQueue = (doctorId, callData) => {
    const queue = callQueue.get(doctorId) || [];
    // Avoid duplicates for the same channel
    if (!queue.find(c => c.channelName === callData.channelName)) {
        queue.push({ ...callData, timestamp: Date.now() });
        callQueue.set(doctorId, queue);
        console.log(`📋 Queued call for doctor ${doctorId} | queue size: ${queue.length}`);
    }
};

const removeFromQueue = (channelName) => {
    for (const [doctorId, queue] of callQueue.entries()) {
        const filtered = queue.filter(c => c.channelName !== channelName);
        if (filtered.length !== queue.length) {
            callQueue.set(doctorId, filtered);
            console.log(`✅ Removed call ${channelName} from queue for doctor ${doctorId}`);
        }
    }
};

io.on('connection', (socket) => {
    console.log('👤 New Client Connected:', socket.id);

    // Join personal signaling room — and replay any queued calls for this doctor
    socket.on('join-room', (userId) => {
        // Force string to prevent ObjectId object being used as room key
        const roomId = String(userId);
        socket.join(roomId);
        console.log(`✅ User [${roomId}] joined signaling room (socket: ${socket.id})`);

        // Replay any calls that were queued while doctor was offline
        const pending = callQueue.get(roomId);
        if (pending && pending.length > 0) {
            console.log(`🔁 Replaying ${pending.length} queued call(s) to doctor ${roomId}`);
            pending.forEach(callData => {
                socket.emit('incoming-call', callData);
            });
        } else {
            console.log(`📭 No pending calls in queue for ${roomId}`);
        }
    });

    // Fallback: patient can still emit directly via socket for immediate delivery
    socket.on('call-doctor', ({ doctorId, patientId, patientName, channelName }) => {
        console.log(`📡 Socket signal from patient ${patientId} to doctor ${doctorId}`);
        io.to(doctorId).emit('incoming-call', { patientId, patientName, channelName });
    });

    // Patient shares their profile data to doctor during call
    socket.on('share-patient-data', ({ doctorId, patientData }) => {
        console.log(`📋 Patient sharing data to doctor ${doctorId}`);
        io.to(doctorId).emit('patient-data', patientData);
    });

    socket.on('disconnect', () => {
        console.log(`Client Disconnected: ${socket.id}`);
    });
});

// ─── Call Queue REST Endpoints ────────────────────────────────────────────────

// Patient calls this to enqueue a call request
app.post('/api/calls/queue', (req, res) => {
    let { doctorId, patientId, patientName, channelName } = req.body;
    if (!doctorId || !channelName) {
        return res.status(400).json({ error: 'doctorId and channelName are required' });
    }
    // Force string — doctorId from frontend might be a JSON-serialised ObjectId
    doctorId = String(doctorId);
    const callData = { patientId: String(patientId || ''), patientName, channelName };

    // Add to persistent queue
    addToQueue(doctorId, callData);

    // Check how many sockets are currently in the doctor's room
    const totalSockets = io.engine.clientsCount;
    const roomSockets = io.sockets.adapter.rooms.get(doctorId);
    const socketsInRoom = roomSockets ? roomSockets.size : 0;
    console.log(`📞 Call queued for doctor=${doctorId} | total server sockets: ${totalSockets} | sockets in doctor room: ${socketsInRoom} | ch=${channelName}`);

    // Emit to any connected doctor sockets
    io.to(doctorId).emit('incoming-call', callData);

    res.json({ success: true, message: 'Call queued and signal sent', socketsInRoom, totalSockets });
});

// Doctor (or patient) calls this to remove a call from the queue after accept/decline
app.delete('/api/calls/queue/:channelName', (req, res) => {
    const { channelName } = req.params;
    removeFromQueue(channelName);
    res.json({ success: true });
});

// Register Sarvam real-time STT namespace
registerSarvamHandlers(io);

// ─── AI Chat with Context ─────────────────────────────────────────────────────
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message, userContext } = req.body;
        console.log('generate fn called');
        console.log(`prompt is : ${message}`);

        if (!message) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        const systemPrompt = `
        You are Arogya AI, a helpful healthcare assistant for rural India.
        User Context: ${JSON.stringify(userContext || {})}

        Rules:
        1. Be empathetic and clear.
        2. If the user is female and the query could be related to menstrual health, provide a "WOMEN_CORNER" insight.
        3. If there's a serious symptom, suggest visiting a doctor.
        4. Provide "Desi remedies" (Home remedies) where appropriate but keep them safe.

        IMPORTANT – You must respond in THREE languages:
        - reply: Plain English response
        - reply_hindi: The same response translated to Hindi (Devanagari script)
        - reply_chhattisgarhi: The same response translated to Chhattisgarhi dialect (Devanagari script, Chhattisgarhi words like "tola", "mohar", "tor", "ka hoe", etc.)

        Format your response STRICTLY as a JSON object with no markdown:
        {
            "reply": "English response here",
            "reply_hindi": "हिंदी में जवाब यहाँ",
            "reply_chhattisgarhi": "छत्तीसगढ़ी में जवाब इहाँ",
            "isWomenCorner": true/false,
            "womenCornerInsight": "Pink theme insight about cycle or remedies here (if applicable, otherwise null)"
        }
        `;

        const result = await model.generateContent([systemPrompt, message]);
        const responseText = result.response.text();
        console.log("Gemini Response:", responseText);

        // Try to parse JSON from AI, or fallback
        try {
            const cleanJson = responseText.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            console.log(`✅ AI Response parsed successfully`);
            res.json(parsed);
        } catch (e) {
            console.warn(`⚠️ AI response was not valid JSON, sending as plain reply`);
            res.json({ reply: responseText, reply_hindi: responseText, reply_chhattisgarhi: responseText, isWomenCorner: false });
        }
    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ error: "Text generation failed: " + error.message });
    }
});

// ─── Sarvam Bulbul v3 TTS ────────────────────────────────────────────────────
// POST /api/ai/tts
// body: { text, language?, speaker? }
// Returns: { audio: <base64 WAV string> }
app.post('/api/ai/tts', async (req, res) => {
    try {
        const { text, language = 'hi-IN', speaker = 'shreya' } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'text is required' });
        }

        const apiKey = process.env.SARVAM_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'SARVAM_API_KEY not configured' });
        }

        // Strip markdown so TTS reads clean prose
        const cleanText = text
            .replace(/#{1,6}\s/g, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`{1,3}[^`]*`{1,3}/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/^[-*+]\s/gm, '')
            .replace(/\n{2,}/g, '. ')
            .trim();

        // Bulbul v3: each input string max 500 chars
        const chunks = [];
        for (let i = 0; i < cleanText.length; i += 500) {
            chunks.push(cleanText.slice(i, i + 500));
        }

        const response = await axios.post(
            'https://api.sarvam.ai/text-to-speech',
            {
                inputs: chunks,
                target_language_code: language,
                speaker: speaker,
                model: 'bulbul:v3',
                enable_preprocessing: true,
                pace: 1.0,
            },
            {
                headers: {
                    'api-subscription-key': apiKey,
                    'Content-Type': 'application/json',
                },
            }
        );

        const audios = response.data?.audios;
        if (!audios || audios.length === 0) {
            return res.status(500).json({ error: 'No audio returned from Sarvam' });
        }

        // Concatenate WAV chunks – keep first header, strip subsequent ones
        let combinedBuffer;
        if (audios.length === 1) {
            combinedBuffer = Buffer.from(audios[0], 'base64');
        } else {
            const buffers = audios.map(a => Buffer.from(a, 'base64'));
            combinedBuffer = buffers[0];
            for (let i = 1; i < buffers.length; i++) {
                if (buffers[i].length > 44) {
                    combinedBuffer = Buffer.concat([combinedBuffer, buffers[i].slice(44)]);
                }
            }
            // Update WAV header sizes
            if (combinedBuffer.length > 44) {
                const dataSize = combinedBuffer.length - 44;
                combinedBuffer.writeUInt32LE(dataSize + 36, 4);
                combinedBuffer.writeUInt32LE(dataSize, 40);
            }
        }

        return res.status(200).json({ audio: combinedBuffer.toString('base64') });
    } catch (error) {
        console.error('TTS Error:', error.response?.data || error.message);
        return res.status(500).json({ error: `TTS failed: ${error.message}` });
    }
});

// ─── Body Visual Analysis (Gemini Vision) ───────────────────────────────────
// POST /api/ai/body-analysis
// body: { bodyParts, zones, partsSummary, imageBase64?, userContext? }
app.post('/api/ai/body-analysis', async (req, res) => {
    try {
        const { bodyParts, zones, partsSummary, imageBase64, userContext } = req.body;

        if (!bodyParts || bodyParts.length === 0) {
            return res.status(400).json({ error: 'bodyParts is required' });
        }

        console.log(`🩻 Body analysis requested for: ${partsSummary}`);

        const systemPrompt = `
You are Arogya AI, a rural healthcare assistant for India.
A patient has selected the following body areas where they have pain or symptoms: ${partsSummary}.
User health context: ${JSON.stringify(userContext || {})}.

Analyse these regions from both the visual body diagram (if provided) and the named areas.
Provide a compassionate, practical response in English.

Respond STRICTLY as a JSON object with no markdown:
{
  "analysis": "2-3 sentences explaining what might be causing pain in these specific areas, written simply for a rural patient",
  "recommendations": ["3-4 short actionable recommendations as an array of strings"],
  "urgency": "low | medium | high",
  "desi_remedy": "One simple home remedy relevant for these body areas (optional)"
}
`;

        let parts;
        if (imageBase64) {
            // Use vision: send the body diagram image + text prompt
            parts = [
                {
                    inlineData: {
                        mimeType: 'image/png',
                        data: imageBase64
                    }
                },
                { text: systemPrompt }
            ];
        } else {
            parts = [systemPrompt];
        }

        const result = await model.generateContent(parts);
        const responseText = result.response.text();
        console.log('🩻 Body Analysis Response:', responseText);

        try {
            const cleanJson = responseText.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            console.log('✅ Body analysis parsed successfully');
            res.json(parsed);
        } catch (e) {
            console.warn('⚠️ Body analysis response was not valid JSON');
            res.json({ analysis: responseText, recommendations: [], urgency: 'medium' });
        }
    } catch (error) {
        console.error('Body Analysis Error:', error);
        res.status(500).json({ error: 'Body analysis failed: ' + error.message });
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
app.use('/', (req, res) => {
    res.send('Hello World!');
});

// ─── Start ──────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
    console.log(`🚀  ArogyaConnect server running → http://localhost:${PORT}`);
});
