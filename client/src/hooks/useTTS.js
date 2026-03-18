import { useState, useRef, useCallback } from 'react';
import { Local_API_URL } from '../api';

/**
 * useTTS — Sarvam Bulbul v3 Text-to-Speech hook
 *
 * Usage:
 *   const { speak, stop, isSpeaking } = useTTS();
 *   speak("Hello world", 'hi-IN');   // fetches audio from backend, plays it
 *   stop();                           // stops current playback
 */
const useTTS = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioRef = useRef(null);
    const requestVersionRef = useRef(0);

    const stop = useCallback(() => {
        requestVersionRef.current += 1; // abort any pending async steps
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        setIsSpeaking(false);
    }, []);

    /**
     * @param {string} text - Text to speak
     * @param {string} language - BCP-47 code e.g. 'hi-IN' or 'hi-IN' (Chhattisgarhi maps to hi-IN for now)
     * @param {string} speaker - Sarvam speaker name, default 'shreya'
     */
    const speak = useCallback(async (text, language = 'hi-IN', speaker = 'shreya') => {
        if (!text?.trim()) return;

        // Toggle off if already speaking
        if (isSpeaking) {
            stop();
            return;
        }

        const currentVersion = ++requestVersionRef.current;
        setIsSpeaking(true);

        try {
            const response = await fetch(`${Local_API_URL}/api/ai/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, language, speaker }),
            });

            if (currentVersion !== requestVersionRef.current) return;
            if (!response.ok) throw new Error(`TTS request failed: ${response.status}`);

            const data = await response.json();
            const audioBase64 = data.audio;
            if (!audioBase64) throw new Error('No audio data received');

            // Decode base64 WAV → Blob → Object URL → Audio element
            const byteCharacters = atob(audioBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'audio/wav' });

            if (currentVersion !== requestVersionRef.current) return;

            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audioRef.current = audio;

            audio.onended = () => {
                URL.revokeObjectURL(url);
                if (audioRef.current === audio) {
                    audioRef.current = null;
                    setIsSpeaking(false);
                }
            };

            audio.onerror = () => {
                URL.revokeObjectURL(url);
                if (audioRef.current === audio) {
                    audioRef.current = null;
                    setIsSpeaking(false);
                }
            };

            await audio.play();
        } catch (error) {
            console.error('[TTS] Error:', error);
            if (currentVersion === requestVersionRef.current) {
                setIsSpeaking(false);
            }
        }
    }, [isSpeaking, stop]);

    return { speak, stop, isSpeaking };
};

export default useTTS;
