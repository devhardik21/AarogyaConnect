import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Plus, ChevronRight } from 'lucide-react';
import BodySelector from '../components/BodySelector';

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
    const [step, setStep] = useState('chat');   // 'chat' | 'body'
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [chatStarted, setChatStarted] = useState(false);
    const [selectedBodyPart, setSelectedBodyPart] = useState(null);
    const [bodyZone, setBodyZone] = useState(null);
    const messagesEndRef = useRef(null);

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

    const handleSend = () => {
        if (!inputText.trim()) return;
        if (!chatStarted) setChatStarted(true);
        const text = inputText;
        setInputText('');
        pushMessage('user', text);
        // Connect Gemini here for real AI response
        setTimeout(() => {
            pushMessage('ai', 'Samjha. Kripya aur detail mein batayein ya body ke us hisse ko select karein jahan dard hai. 👇');
        }, 700);
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
                                    transition={{ duration: 0.25 }}
                                    className={`flex mb-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
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
                                        <div className={`max-w-[80%] px-4 py-2.5 rounded-3xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                                ? 'bg-green-500 text-white rounded-br-lg'
                                                : 'bg-gray-100 text-gray-800 rounded-bl-lg'
                                            }`}>
                                            {msg.text}
                                        </div>
                                    )}
                                </motion.div>
                            ))}

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
                                <button className="text-gray-400 hover:text-green-500 flex-shrink-0 transition-colors">
                                    <Mic size={20} />
                                    {/* Connect speech-to-text API here */}
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
