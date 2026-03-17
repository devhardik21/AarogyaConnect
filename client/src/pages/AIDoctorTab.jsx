import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Plus, ChevronRight, Volume2, Sparkles, MessageCircle } from 'lucide-react';
import BodySelector from '../components/BodySelector';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import config from '../config';

// Quick symptom chip data
const SYMPTOMS = [
    { id: 'fever', label: 'Fever', emoji: '🤒' },
    { id: 'fatigue', label: 'Fatigue', emoji: '😴' },
    { id: 'breath', label: 'Shortness of Breath', emoji: '😮‍💨' },
    { id: 'rash', label: 'Skin Rash', emoji: '🔴' },
    { id: 'nausea', label: 'Nausea', emoji: '🤢' },
];

// AI responses per symptom — Connect Gemini here for real responses
const AI_RESPONSES = {
    fever: 'Theek hai. Bukhar kitne din se hai? Kya aapne paracetamol li? 💊',
    fatigue: 'Aap thaka hua mehsoos kar rahe hain. Kya pani pina kam ho gaya hai? Please aur batayen.',
    breath: 'Sans lene mein takleef ho rahi hai — yeh serious ho sakta hai. Kripya body part select karein.',
    rash: 'Skin pe daane ya lali aa rahi hai? Kitne dino se? Kya koi nayi cheez khaayi thi?',
    nausea: 'Pet ka dard ya ulti ka mann? Ulti hui hai kya? Aur kuch symptoms hain?',
};

export default function AIDoctorTab() {
    const { user } = useAuth();
    const [step, setStep] = useState('chat');   // 'chat' | 'body'
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [chatStarted, setChatStarted] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [selectedBodyPart, setSelectedBodyPart] = useState(null);
    const [bodyZone, setBodyZone] = useState(null);
    const messagesEndRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const pushMessage = (role, text, extra = {}) => {
        setMessages(prev => [...prev, { role, text, ...extra }]);
    };

    const handleSymptom = (s) => {
        if (!chatStarted) setChatStarted(true);
        pushMessage('user', s.label);
        setTimeout(() => {
            pushMessage('ai', AI_RESPONSES[s.id] || 'Aur kuch batayen apni takleef ke baare mein.');
            // After a symptom that involves breathing, auto suggest body selector
            if (s.id === 'breath') {
                setTimeout(() => setStep('body'), 1500);
            }
        }, 600);
    };

    const handleSend = async (overrideText = null) => {
        const text = overrideText || inputText;
        if (!text.trim()) return;

        if (!chatStarted) setChatStarted(true);
        setInputText('');
        pushMessage('user', text);
        setIsTyping(true);

        try {
            console.log(`📡 Sending chat message: "${text}"`);
            const res = await axios.post(`${config.API_BASE_URL}/api/ai/chat`, {
                message: text,
                userContext: user?.profile
            });

            setIsTyping(false);
            const { reply, isWomenCorner, womenCornerInsight } = res.data;
            pushMessage('ai', reply, { isWomenCorner, womenCornerInsight });
        } catch (error) {
            setIsTyping(false);
            pushMessage('ai', "Maafi chahte hain, network mein kuch dikkat hai. Kripya thodi der baad koshish karein.");
        }
    };

    const handleTTS = async (text) => {
        try {
            console.log(`🔊 Starting TTS for: "${text.substring(0, 30)}..."`);
            const res = await axios.post(`${config.API_BASE_URL}/api/ai/tts`, {
                text,
                voice: 'bulbul:v3',
                language_code: 'hi-IN'
            });
            const audio = new Audio(`data:audio/mp3;base64,${res.data.audio_content}`);
            audio.play();
        } catch (e) {
            console.error("❌ TTS failed", e);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64Audio = reader.result.split(',')[1];
                    setIsTyping(true);
                    try {
                        console.log("🎤 Sending audio for STT...");
                        const res = await axios.post(`${config.API_BASE_URL}/api/ai/stt`, {
                            audio_content: base64Audio,
                            language_code: 'hi-IN' // or 'en-IN' or 'unknown'
                        });
                        console.log("🎤 STT Result:", res.data.transcript);
                        if (res.data.transcript) {
                            handleSend(res.data.transcript);
                        }
                    } catch (err) {
                        console.error("❌ STT failed", err);
                    } finally {
                        setIsTyping(false);
                    }
                };
            };

            mediaRecorder.start();
            setIsRecording(true);
            console.log("🎤 Recording started...");
        } catch (err) {
            console.error("❌ Error accessing microphone", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            console.log("🎤 Recording stopped");
        }
    };

    const handleContinueBody = () => {
        if (!bodyZone) return;
        setStep('chat');
        pushMessage('ai', `${selectedBodyPart} ke ${bodyZone} mein problem hai. AI analysis ho rahi hai... ⏳`, { isCard: true, part: selectedBodyPart, zone: bodyZone });
    };

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden">

            {/* ─── Header ─────────────────────────────────── */}
            <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 pt-4 pb-3">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center shadow-md flex-shrink-0">
                        <span className="text-white text-lg font-bold">A</span>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-bold text-gray-900 text-sm leading-tight">Arogya AI</h1>
                        <p className="text-xs text-gray-400 truncate">Describe feel, AI will guide you step-by-step</p>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                        ✕
                    </button>
                </div>
            </div>

            {/* ─── Body / Step Switcher ─────────────────── */}
            <AnimatePresence mode="wait">

                {step === 'chat' && (
                    <motion.div
                        key="chat-view"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                        className="flex-1 flex flex-col overflow-hidden"
                    >
                        {/* ─── Scrollable Chat Area ─── */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 hide-scrollbar">

                            {/* Welcome block */}
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 leading-snug">
                                    Hi! Rahul 👋<br />
                                    <span className="text-gray-700 font-semibold">I'm your smart assistant.</span><br />
                                    <span className="text-gray-400 font-normal text-lg">Ready when you are.</span>
                                </h2>
                            </div>

                            {/* AI messages that appear after chat starts */}
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-4"
                                >
                                    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {msg.isCard ? (
                                            <div className="bg-gradient-to-br from-green-50 to-teal-50 border border-green-100 rounded-3xl p-4 max-w-[90%] w-full card-shadow">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-lg">🧠</span>
                                                    <span className="text-xs font-bold text-green-700 uppercase tracking-wide">AI Analysis</span>
                                                </div>
                                                <p className="text-sm text-gray-700 leading-relaxed">{msg.text}</p>
                                                {msg.part && (
                                                    <div className="flex gap-2 mt-3">
                                                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">{msg.part}</span>
                                                        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">{msg.zone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2 max-w-[85%]">
                                                <div className={`px-4 py-3 rounded-3xl text-sm leading-relaxed shadow-sm relative group ${msg.role === 'user'
                                                    ? 'bg-green-500 text-white rounded-br-lg'
                                                    : 'bg-gray-100 text-gray-800 rounded-bl-lg'
                                                    }`}>
                                                    {msg.text}
                                                    {msg.role === 'ai' && (
                                                        <button
                                                            onClick={() => handleTTS(msg.text)}
                                                            className="absolute -right-10 top-1/2 -translate-y-1/2 p-2 bg-gray-50 text-gray-400 rounded-full hover:text-green-600 transition opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Volume2 size={16} />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Women's Corner Insight Bubble */}
                                                {msg.isWomenCorner && msg.womenCornerInsight && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100 rounded-[2rem] p-5 shadow-sm mt-1"
                                                    >
                                                        <div className="flex items-center gap-2 mb-2 text-pink-600">
                                                            <Sparkles size={18} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Women's Corner Insight</span>
                                                        </div>
                                                        <p className="text-xs text-pink-700 font-medium leading-relaxed italic">
                                                            "{msg.womenCornerInsight}"
                                                        </p>
                                                        <div className="mt-3 flex gap-2">
                                                            <span className="bg-pink-100 text-pink-600 text-[10px] font-bold px-3 py-1 rounded-full">Desi Remedy ✨</span>
                                                            <span className="bg-pink-100 text-pink-600 text-[10px] font-bold px-3 py-1 rounded-full">Cycle Tips 📅</span>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start mb-4">
                                    <div className="bg-gray-100 px-4 py-3 rounded-2xl flex gap-1 items-center">
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                    </div>
                                </div>
                            )}

                            {/* Symptom Quick-chips: always visible as the "suggestion tray" */}
                            <div className="mb-4">
                                {!chatStarted && (
                                    <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Quick symptoms</p>
                                )}
                                <div className="grid grid-cols-2 gap-2.5">
                                    {SYMPTOMS.map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => handleSymptom(s)}
                                            className="flex flex-col items-center justify-center gap-2 bg-white border border-gray-100 rounded-3xl p-4 shadow-sm hover:border-green-300 hover:shadow-md active:scale-95 transition-all"
                                        >
                                            <span className="text-3xl">{s.emoji}</span>
                                            <span className="text-xs font-semibold text-gray-700">{s.label}</span>
                                        </button>
                                    ))}

                                    {/* Show body selector CTA card */}
                                    <button
                                        onClick={() => setStep('body')}
                                        className="flex flex-col items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-3xl p-4 shadow-sm hover:bg-green-100 active:scale-95 transition-all col-span-2"
                                    >
                                        <span className="text-2xl">📍</span>
                                        <span className="text-xs font-semibold text-green-700">Locate Pain on Body</span>
                                    </button>
                                </div>
                            </div>

                            <div ref={messagesEndRef} />
                        </div>

                        {/* ─── Chat Input ──────── */}
                        <div className="flex-shrink-0 px-4 pb-4 pt-2 bg-white border-t border-gray-100">
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-3 gap-3">
                                <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                                    <Plus size={20} />
                                </button>
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    placeholder="e.g. Headache, stomach pain"
                                    className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                                />
                                <button
                                    onMouseDown={startRecording}
                                    onMouseUp={stopRecording}
                                    onTouchStart={startRecording}
                                    onTouchEnd={stopRecording}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-green-500'}`}
                                >
                                    <Mic size={20} />
                                </button>
                                <button
                                    onClick={handleSend}
                                    className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 hover:bg-green-600 transition-colors"
                                >
                                    <ChevronRight size={16} className="text-white" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 'body' && (
                    <motion.div
                        key="body-view"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.25 }}
                        className="flex-1 flex flex-col overflow-hidden"
                    >
                        <div className="flex-1 overflow-y-auto px-5 py-4 hide-scrollbar">
                            <button
                                onClick={() => setStep('chat')}
                                className="text-sm text-gray-400 mb-4 hover:text-gray-600 transition-colors flex items-center gap-1"
                            >
                                ← Back
                            </button>
                            <h2 className="text-xl font-bold text-gray-900 mb-6 leading-snug">
                                Where exactly is the<br />pain or issue located?
                            </h2>
                            <BodySelector
                                selectedPart={selectedBodyPart}
                                setSelectedPart={setSelectedBodyPart}
                                bodyZone={bodyZone}
                                setBodyZone={setBodyZone}
                            />
                        </div>

                        {/* Continue button */}
                        <div className="flex-shrink-0 px-5 pb-6 pt-2 bg-white">
                            <button
                                onClick={handleContinueBody}
                                disabled={!bodyZone}
                                className={`w-full py-4 rounded-2xl font-bold text-white text-base transition-all ${bodyZone
                                    ? 'bg-blue-600 btn-shadow hover:bg-blue-700 active:scale-95'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                Continue
                            </button>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}
