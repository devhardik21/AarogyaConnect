import BodySelector from '../components/BodySelector';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Plus, ChevronRight, Volume2, Sparkles, Thermometer, Zap, Wind, AlertCircle, Frown, MapPin, X, ScanLine } from 'lucide-react';
import { Local_API_URL } from '../api';
import useTTS from '../hooks/useTTS';

// Lightweight markdown renderer for AI responses
function FormattedMessage({ text }) {
    const lines = text.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        if (/^\d+\.\s/.test(line)) {
            const items = [];
            while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
                items.push(lines[i].replace(/^\d+\.\s/, ''));
                i++;
            }
            elements.push(
                <ol key={i} className="list-decimal list-inside space-y-1 my-1">
                    {items.map((item, j) => (
                        <li key={j} className="text-sm leading-relaxed">
                            <InlineMarkdown text={item} />
                        </li>
                    ))}
                </ol>
            );
            continue;
        }

        if (/^[-*]\s/.test(line)) {
            const items = [];
            while (i < lines.length && /^[-*]\s/.test(lines[i])) {
                items.push(lines[i].replace(/^[-*]\s/, ''));
                i++;
            }
            elements.push(
                <ul key={i} className="space-y-1 my-1">
                    {items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm leading-relaxed">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                            <InlineMarkdown text={item} />
                        </li>
                    ))}
                </ul>
            );
            continue;
        }

        if (line.trim() === '') {
            elements.push(<div key={i} className="h-1" />);
            i++;
            continue;
        }

        elements.push(
            <p key={i} className="text-sm leading-relaxed">
                <InlineMarkdown text={line} />
            </p>
        );
        i++;
    }

    return <div className="space-y-0.5">{elements}</div>;
}

function InlineMarkdown({ text }) {
    const parts = [];
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(<span key={lastIndex}>{text.slice(lastIndex, match.index)}</span>);
        }
        if (match[0].startsWith('**')) {
            parts.push(<strong key={match.index} className="font-semibold">{match[2]}</strong>);
        } else {
            parts.push(<em key={match.index} className="italic">{match[3]}</em>);
        }
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push(<span key={lastIndex}>{text.slice(lastIndex)}</span>);
    }

    return <>{parts}</>;
}

const SYMPTOMS = [
    { id: 'fever', label: 'Fever', Icon: Thermometer },
    { id: 'fatigue', label: 'Fatigue', Icon: Zap },
    { id: 'breath', label: 'Shortness of Breath', Icon: Wind },
    { id: 'rash', label: 'Skin Rash', Icon: AlertCircle },
    { id: 'nausea', label: 'Nausea', Icon: Frown },
];

/**
 * TTS Language Picker
 */
function TTSPicker({ message, onClose }) {
    const { speak, isSpeaking } = useTTS();

    const handleSpeak = async (lang) => {
        let text;
        let sarvamLang;
        if (lang === 'hi-IN') {
            text = message.reply_hindi || message.text;
            sarvamLang = 'hi-IN';
        } else {
            text = message.reply_chhattisgarhi || message.reply_hindi || message.text;
            sarvamLang = 'hi-IN';
        }
        onClose();
        await speak(text, sarvamLang);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute -right-2 -top-16 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl px-3 py-2 flex flex-col gap-1 min-w-[160px]"
        >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">सुनें / Listen</p>
            <button
                onClick={() => handleSpeak('hi-IN')}
                disabled={isSpeaking}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors text-left"
            >
                🇮🇳 <span>हिंदी</span>
            </button>
            <button
                onClick={() => handleSpeak('cg')}
                disabled={isSpeaking}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors text-left"
            >
                🌾 <span>छत्तीसगढ़ी</span>
            </button>
        </motion.div>
    );
}

export default function AIDoctorTab() {
    const { user } = useAuth();
    const [step, setStep] = useState('chat');
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [chatStarted, setChatStarted] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalysing, setIsAnalysing] = useState(false);

    // Multi-select body state
    const [selectedParts, setSelectedParts] = useState([]);   // string[]
    const [selectedZones, setSelectedZones] = useState({});    // { partId: string[] }

    const [activeTTSIndex, setActiveTTSIndex] = useState(null);
    const messagesEndRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const bodyCaptureDivRef = useRef(null); // ref to the body display div for html-to-image

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Close picker when clicking outside
    useEffect(() => {
        if (activeTTSIndex === null) return;
        const handler = (e) => {
            if (!e.target.closest('.tts-picker-anchor')) {
                setActiveTTSIndex(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [activeTTSIndex]);

    const pushMessage = (role, text, extra = {}) => {
        setMessages(prev => [...prev, { role, text, ...extra }]);
    };

    const handleSymptom = (s) => {
        if (!chatStarted) setChatStarted(true);
        handleSend(s.label);
        if (s.id === 'breath') {
            setTimeout(() => setStep('body'), 2000);
        }
    };

    const handleSend = async (overrideText = null) => {
        const text = overrideText || inputText;
        if (!text.trim()) return;

        if (!chatStarted) setChatStarted(true);
        setInputText('');
        pushMessage('user', text);
        setIsTyping(true);

        try {
            const res = await axios.post(`${Local_API_URL}/api/ai/chat`, {
                message: text,
                userContext: user?.profile
            });

            setIsTyping(false);
            const { reply, reply_hindi, reply_chhattisgarhi, isWomenCorner, womenCornerInsight } = res.data;
            pushMessage('ai', reply || res.data.reply, {
                reply_hindi,
                reply_chhattisgarhi,
                isWomenCorner,
                womenCornerInsight
            });
        } catch (error) {
            setIsTyping(false);
            pushMessage('ai', "Maafi chahte hain, network mein kuch dikkat hai. Kripya thodi der baad koshish karein.");
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64Audio = reader.result.split(',')[1];
                    setIsTyping(true);
                    try {
                        const res = await axios.post(`${Local_API_URL}/api/ai/stt`, {
                            audio_content: base64Audio,
                            language_code: 'hi-IN'
                        });
                        if (res.data.transcript) handleSend(res.data.transcript);
                    } catch (err) {
                        console.error("❌ STT failed", err);
                    } finally {
                        setIsTyping(false);
                    }
                };
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("❌ Error accessing microphone", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    // ─── Analyse body selection ───────────────────────────────────────────
    const handleAnalyseBody = async () => {
        if (selectedParts.length === 0) return;

        setIsAnalysing(true);

        // Capture the body model div as a base64 PNG
        let imageBase64 = null;
        if (bodyCaptureDivRef.current) {
            try {
                const dataUrl = await toPng(bodyCaptureDivRef.current, { quality: 0.85, pixelRatio: 1.5 });
                imageBase64 = dataUrl.split(',')[1]; // strip data:image/png;base64,
            } catch (err) {
                console.warn('⚠️ Body capture failed, proceeding without image:', err.message);
            }
        }

        // Build human-readable zone summary
        const partsSummary = selectedParts.map(partId => {
            const zones = selectedZones[partId];
            const allParts = [
                { id: 'head', label: 'Head' }, { id: 'neck', label: 'Neck' }, { id: 'chest', label: 'Chest' },
                { id: 'abdomen', label: 'Abdomen' }, { id: 'pelvis', label: 'Pelvis' },
                { id: 'leftArm', label: 'Left Arm' }, { id: 'rightArm', label: 'Right Arm' },
                { id: 'leftLeg', label: 'Left Leg' }, { id: 'rightLeg', label: 'Right Leg' },
                { id: 'upperBack', label: 'Upper Back' }, { id: 'midBack', label: 'Mid Back' },
                { id: 'lowerBack', label: 'Lower Back' }, { id: 'gluteal', label: 'Gluteal' },
            ];
            const label = allParts.find(p => p.id === partId)?.label || partId;
            return zones?.length ? `${label} (${zones.join(', ')})` : label;
        }).join(', ');

        // Go back to chat and show user message
        setStep('chat');
        if (!chatStarted) setChatStarted(true);

        pushMessage('user', `I have pain/issue in: ${partsSummary}`);
        setIsTyping(true);

        try {
            const res = await axios.post(`${Local_API_URL}/api/ai/body-analysis`, {
                bodyParts: selectedParts,
                zones: selectedZones,
                partsSummary,
                imageBase64,
                userContext: user?.profile
            });

            setIsTyping(false);
            const { analysis, recommendations, urgency, capturedImageBase64 } = res.data;

            pushMessage('ai', analysis, {
                isBodyCard: true,
                parts: selectedParts,
                zones: selectedZones,
                partsSummary,
                recommendations,
                urgency,
                capturedImageBase64: imageBase64, // show the captured image in chat
            });
        } catch (err) {
            console.error('❌ Body analysis failed:', err);
            setIsTyping(false);
            pushMessage('ai', `Body analysis ke liye Sorry! Network dikkat hai. Aap directly apni problem type kar sakte hain.`);
        } finally {
            setIsAnalysing(false);
            // Reset selections
            setSelectedParts([]);
            setSelectedZones({});
        }
    };

    const hasSelections = selectedParts.length > 0;

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden">

            {/* ─── Header ─────────────────────────────────── */}
            <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 pt-4 pb-3">
                <div className="flex items-center gap-3">
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
                                    Hi! {user?.name || 'there'} 👋<br />
                                    <span className="text-gray-700 font-semibold">I'm your smart assistant.</span><br />
                                    <span className="text-gray-400 font-normal text-lg">Ready when you are.</span>
                                </h2>
                            </div>

                            {/* Messages */}
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-4"
                                >
                                    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {/* ─── Body Analysis Card ─── */}
                                        {msg.isBodyCard ? (
                                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-4 max-w-[95%] w-full shadow-sm">
                                                {/* Header */}
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-lg">🩻</span>
                                                    <span className="text-xs font-black text-blue-700 uppercase tracking-widest">Body AI Analysis</span>
                                                    {msg.urgency && (
                                                        <span className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${msg.urgency === 'high'
                                                            ? 'bg-red-100 text-red-600' : msg.urgency === 'medium'
                                                                ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-700'}`}>
                                                            {msg.urgency} urgency
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Part badges + captured image side by side */}
                                                <div className="flex gap-3 mb-3">
                                                    {/* Image thumbnail */}
                                                    {msg.capturedImageBase64 && (
                                                        <div className="flex-shrink-0 w-20 h-24 rounded-xl overflow-hidden border border-blue-100 bg-white">
                                                            <img
                                                                src={`data:image/png;base64,${msg.capturedImageBase64}`}
                                                                alt="Selected body areas"
                                                                className="w-full h-full object-contain"
                                                            />
                                                        </div>
                                                    )}
                                                    {/* Parts summary */}
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1.5">Affected Areas</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {msg.partsSummary?.split(', ').map((p, idx) => (
                                                                <span key={idx} className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                                    📍 {p}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Analysis text */}
                                                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                                                    <FormattedMessage text={msg.text} />
                                                </p>

                                                {/* Recommendations */}
                                                {msg.recommendations?.length > 0 && (
                                                    <div className="bg-white/70 rounded-2xl p-3 border border-blue-50">
                                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">💡 Recommendations</p>
                                                        <ul className="space-y-1">
                                                            {msg.recommendations.map((r, idx) => (
                                                                <li key={idx} className="flex items-start gap-1.5 text-xs text-gray-600 font-medium">
                                                                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                                                                    {r}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2 max-w-[85%]">
                                                <div className={`px-4 py-3 rounded-3xl text-sm leading-relaxed shadow-sm relative group ${msg.role === 'user'
                                                    ? 'bg-green-500 text-white rounded-br-lg'
                                                    : 'bg-gray-100 text-gray-800 rounded-bl-lg'
                                                    }`}>
                                                    {msg.role === 'ai'
                                                        ? <FormattedMessage text={msg.text} />
                                                        : msg.text}

                                                    {/* TTS Button — only for AI messages */}
                                                    {msg.role === 'ai' && (
                                                        <div className="tts-picker-anchor absolute -right-10 top-1/2 -translate-y-1/2">
                                                            <button
                                                                onClick={() => setActiveTTSIndex(activeTTSIndex === i ? null : i)}
                                                                className={`p-2 rounded-full transition-all ${activeTTSIndex === i
                                                                    ? 'bg-green-500 text-white shadow-md'
                                                                    : 'bg-gray-50 text-gray-400 hover:text-green-600 opacity-0 group-hover:opacity-100'
                                                                    }`}
                                                            >
                                                                <Volume2 size={16} />
                                                            </button>

                                                            <AnimatePresence>
                                                                {activeTTSIndex === i && (
                                                                    <TTSPicker
                                                                        message={msg}
                                                                        onClose={() => setActiveTTSIndex(null)}
                                                                    />
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Women's Corner Insight */}
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

                            {/* ─── Symptom chips — only before chat starts ─── */}
                            {!chatStarted && (
                                <motion.div
                                    initial={{ opacity: 1 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="mb-4"
                                >
                                    <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Quick symptoms</p>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {SYMPTOMS.map((s) => {
                                            const Icon = s.Icon;
                                            return (
                                                <button
                                                    key={s.id}
                                                    onClick={() => handleSymptom(s)}
                                                    className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm hover:border-green-300 hover:shadow-md active:scale-95 transition-all"
                                                >
                                                    <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                                                        <Icon size={16} className="text-green-600" />
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-700 text-left leading-tight">{s.label}</span>
                                                </button>
                                            );
                                        })}

                                        {/* Locate pain CTA */}
                                        <button
                                            onClick={() => setStep('body')}
                                            className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 shadow-sm hover:bg-green-100 active:scale-95 transition-all col-span-2"
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                                                <MapPin size={16} className="text-green-700" />
                                            </div>
                                            <span className="text-xs font-semibold text-green-700">Locate Pain on Body</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* ─── Chat Input ──────── */}
                        <div className="flex-shrink-0 px-4 pb-4 pt-2 bg-white border-t border-gray-100">
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-3 gap-3">
                                <button
                                    className="text-gray-400 hover:text-green-600 flex-shrink-0 transition-colors"
                                    onClick={() => setStep('body')}
                                    title="Select body part"
                                >
                                    <MapPin size={20} />
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
                        <div className="flex-1 overflow-y-auto px-5 py-4 hide-scrollbar" ref={bodyCaptureDivRef}>
                            <button
                                onClick={() => setStep('chat')}
                                className="text-sm text-gray-400 mb-4 hover:text-gray-600 transition-colors flex items-center gap-1"
                            >
                                ← Back
                            </button>
                            <h2 className="text-xl font-bold text-gray-900 mb-1 leading-snug">
                                Where exactly is the<br />pain or issue?
                            </h2>
                            <p className="text-xs text-gray-400 mb-5 font-medium">Select one or more body areas</p>

                            <BodySelector
                                selectedParts={selectedParts}
                                setSelectedParts={setSelectedParts}
                                selectedZones={selectedZones}
                                setSelectedZones={setSelectedZones}
                                captureRef={bodyCaptureDivRef}
                            />
                        </div>

                        <div className="flex-shrink-0 px-5 pb-6 pt-2 bg-white border-t border-gray-100">
                            <button
                                onClick={handleAnalyseBody}
                                disabled={!hasSelections || isAnalysing}
                                className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 ${hasSelections && !isAnalysing
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-blue-200 active:scale-95'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {isAnalysing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Analysing...
                                    </>
                                ) : (
                                    <>
                                        <ScanLine size={20} />
                                        {hasSelections ? `Analyse ${selectedParts.length} area${selectedParts.length > 1 ? 's' : ''}` : 'Select areas first'}
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}
