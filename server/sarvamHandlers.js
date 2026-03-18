import WebSocket from 'ws';

/**
 * Sarvam AI Saaras v3 Real-Time Transcription
 * --------------------------------------------------
 * Each browser connection gets its own WebSocket to Sarvam AI.
 * Audio flow:
 *   Browser mic (PCM Int16 16kHz) → base64 → socket.io → backend → Sarvam WS
 *   Sarvam WS → transcript JSON → socket.io → browser → input field
 */

export function registerSarvamHandlers(io) {
    const namespace = io.of('/transcribe');

    namespace.on('connection', (socket) => {
        console.log(`[Sarvam STT] Client connected: ${socket.id}`);

        let sarvamWs = null;
        let isConnected = false;

        /**
         * Start a transcription session.
         * Opens a WebSocket connection to Sarvam AI.
         */
        socket.on('start_transcription', () => {
            if (sarvamWs) {
                console.warn('[Sarvam STT] Session already active, ignoring start.');
                return;
            }

            const apiKey = process.env.SARVAM_API_KEY;
            if (!apiKey) {
                socket.emit('error', { message: 'SARVAM_API_KEY not configured on server' });
                return;
            }

            // unknown language-code triggers auto-detection
            const wsUrl = `wss://api.sarvam.ai/speech-to-text-translate/ws?model=saaras:v3&language_code=unknown&sample_rate=16000&input_audio_codec=pcm_s16le`;

            console.log(`[Sarvam STT] Connecting to Sarvam...`);

            sarvamWs = new WebSocket(wsUrl, {
                headers: {
                    'api-subscription-key': apiKey,
                },
            });

            sarvamWs.on('open', () => {
                isConnected = true;
                console.log('[Sarvam STT] WebSocket connected.');
                socket.emit('transcription_ready');
            });

            sarvamWs.on('message', (data) => {
                try {
                    const msg = JSON.parse(data.toString());
                    console.log('[Sarvam STT] Message:', JSON.stringify(msg));

                    // Saaras v3 sends: { type, data: { transcript, request_id, ... } }
                    if (msg?.data?.transcript) {
                        socket.emit('transcript', {
                            text: msg.data.transcript,
                            is_final: msg.type === 'TRANSCRIPT' || msg.type === 'transcript',
                        });
                    }
                } catch (err) {
                    console.error('[Sarvam STT] Error parsing message:', err);
                }
            });

            sarvamWs.on('error', (err) => {
                console.error('[Sarvam STT] WebSocket error:', err.message);
                socket.emit('error', { message: `Sarvam WS error: ${err.message}` });
            });

            sarvamWs.on('close', (code, reason) => {
                isConnected = false;
                console.log(`[Sarvam STT] WebSocket closed: ${code} ${reason}`);
                sarvamWs = null;
                socket.emit('transcription_ended');
            });
        });

        /**
         * Receive raw PCM audio chunk from browser (base64 encoded Int16 PCM 16kHz).
         * Forward it to Sarvam AI as a JSON message.
         */
        socket.on('audio_chunk', (base64Audio) => {
            if (!sarvamWs || !isConnected || sarvamWs.readyState !== WebSocket.OPEN) {
                return; // silently drop if not ready
            }

            const payload = JSON.stringify({
                audio: {
                    data: base64Audio,
                    encoding: 'audio/wav',
                    sample_rate: 16000,
                },
            });

            sarvamWs.send(payload);
        });

        /**
         * Stop the transcription session.
         * Send a flush signal to get the final transcript, then close.
         */
        socket.on('stop_transcription', () => {
            if (!sarvamWs) return;

            if (sarvamWs.readyState === WebSocket.OPEN) {
                try {
                    sarvamWs.send(JSON.stringify({ flush: true }));
                } catch (e) {
                    console.warn('[Sarvam STT] Could not send flush signal:', e.message);
                }
                setTimeout(() => {
                    if (sarvamWs) {
                        sarvamWs.close();
                        sarvamWs = null;
                    }
                }, 800);
            } else {
                sarvamWs.close();
                sarvamWs = null;
            }
        });

        // Clean up on client disconnect
        socket.on('disconnect', () => {
            console.log(`[Sarvam STT] Client disconnected: ${socket.id}`);
            if (sarvamWs) {
                sarvamWs.close();
                sarvamWs = null;
            }
        });
    });
}
