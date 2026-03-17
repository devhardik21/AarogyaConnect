import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff,
    MessageSquare, Share2, ClipboardList, Activity,
    User, MapPin, TrendingUp, Thermometer, ShieldCheck,
    Languages, X, Star, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    AgoraRTCProvider,
    useRTCClient,
    useLocalMicrophoneTrack,
    useLocalCameraTrack,
    useRemoteUsers,
    LocalVideoTrack,
    RemoteUser,
    useJoin
} from 'agora-rtc-react';
import AgoraRTC from 'agora-rtc-sdk-ng';

// --- AGORA SETUP ---
const APP_ID = import.meta.env.VITE_AGORA_APP_ID || "PASTE_YOUR_APP_ID_HERE";

const VideoCallWrapper = () => {
    const client = useRTCClient(AgoraRTC.createClient({ codec: "vp8", mode: "rtc" }));
    return (
        <AgoraRTCProvider client={client}>
            <VideoCallContent />
        </AgoraRTCProvider>
    );
};

const VideoCallContent = () => {
    const { channelId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [muted, setMuted] = useState(false);
    const [videoOff, setVideoOff] = useState(false);
    const [lang, setLang] = useState('en');
    const [sidebarOpen, setSidebarOpen] = useState(user?.role === 'doctor');
    const [reportModal, setReportModal] = useState(false);
    const [sharedData, setSharedData] = useState(null);

    // Agora Hooks
    const { localMicrophoneTrack } = useLocalMicrophoneTrack(!muted);
    const { localCameraTrack } = useLocalCameraTrack(!videoOff);
    const remoteUsers = useRemoteUsers();

    useJoin({ appid: APP_ID, channel: channelId, token: null });

    const handleEndCall = () => {
        navigate('/video');
    };

    const toggleLang = () => setLang(l => l === 'en' ? 'hi' : 'en');

    const shareReport = () => {
        // In a real app, this would send a message over RTM or Socket
        // Here we simulate local state change that affects the UI
        if (user.role === 'patient') {
            setSharedData(user.profile);
            alert("Report Shared with Doctor!");
        }
    };

    const t = {
        en: {
            details: "Patient Details",
            risk: "Risk Assessment",
            summary: "AI Scan Summary",
            meds: "Medicines",
            vitals: "Live Vitals",
            share: "Share AI Report",
            end: "End Call",
            online: "Live",
            fullReport: "View Full AI Report",
            high: "High Risk",
            mod: "Moderate",
            norm: "Normal"
        },
        hi: {
            details: "मरीज का विवरण",
            risk: "जोखिम मूल्यांकन",
            summary: "AI स्कैन सारांश",
            meds: "दवाएं",
            vitals: "लाइव वाइटल्स",
            share: "AI रिपोर्ट साझा करें",
            end: "कॉल समाप्त करें",
            online: "लाइव",
            fullReport: "पूरी AI रिपोर्ट देखें",
            high: "उच्च जोखिम",
            mod: "मध्यम",
            norm: "सामान्य"
        }
    }[lang];

    const displayData = user.role === 'doctor' ? (sharedData || {
        name: "Rajesh Kumar",
        age: 45,
        gender: "Male",
        village: "Durg, CG",
        lastAiScan: {
            riskScores: { sickleCell: 87, anemia: "Moderate" },
            bodyParts: ["Lower Back", "Left Knee"],
            summary: "Significant markers for Sickle Cell Gene detected. Immediate consultation advised."
        },
        meds: [{ name: "Hydroxyurea", dosage: "500mg daily" }],
        vitals: { spo2: 96 }
    }) : user.profile;

    return (
        <div className="fixed inset-0 bg-[#0f172a] flex flex-col md:flex-row overflow-hidden text-white">

            {/* Main Video Area */}
            <div className={`relative flex-1 flex flex-col transition-all duration-500 ${sidebarOpen && user.role === 'doctor' ? 'md:mr-80' : ''}`}>

                {/* Header Overlay */}
                <div className="absolute top-0 inset-x-0 p-6 z-20 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div> {t.online}
                        </div>
                        <h2 className="font-bold text-sm tracking-wide">ID: {channelId}</h2>
                    </div>
                    <button
                        onClick={toggleLang}
                        className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-xs font-bold flex items-center gap-2 hover:bg-white/20 transition"
                    >
                        <Languages size={14} /> {lang === 'en' ? 'हिंदी' : 'English'}
                    </button>
                </div>

                {/* Video Grid */}
                <div className="flex-1 relative bg-gray-900 group">
                    {/* Remote User */}
                    {remoteUsers.length > 0 ? (
                        <RemoteUser user={remoteUsers[0]} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#1e293b]">
                            <div className="text-center">
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30"
                                >
                                    <User size={40} className="text-blue-400" />
                                </motion.div>
                                <p className="text-gray-400 font-medium animate-pulse">Waiting for {user.role === 'patient' ? 'Doctor' : 'Patient'}...</p>
                            </div>
                        </div>
                    )}

                    {/* Local User Preview (PIP) */}
                    <div className="absolute bottom-24 right-6 w-32 h-44 bg-black rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-20 md:bottom-28">
                        {!videoOff ? (
                            <LocalVideoTrack track={localCameraTrack} play className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                <VideoOff size={24} className="text-gray-600" />
                            </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold">You</div>
                    </div>
                </div>

                {/* Controls Bar */}
                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-30 pb-10 md:pb-6">
                    <div className="flex items-center justify-center gap-4 max-w-lg mx-auto">
                        <button
                            onClick={() => setMuted(!muted)}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition shadow-lg ${muted ? 'bg-red-500 shadow-red-500/20' : 'bg-white/10 hover:bg-white/20 border border-white/10'}`}
                        >
                            {muted ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                        <button
                            onClick={() => setVideoOff(!videoOff)}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition shadow-lg ${videoOff ? 'bg-red-500 shadow-red-500/20' : 'bg-white/10 hover:bg-white/20 border border-white/10'}`}
                        >
                            {videoOff ? <VideoOff size={20} /> : <VideoIcon size={20} />}
                        </button>
                        <button
                            onClick={handleEndCall}
                            className="w-16 h-12 rounded-2xl bg-red-600 flex items-center justify-center shadow-xl shadow-red-600/30 hover:bg-red-700 active:scale-95 transition"
                            title={t.end}
                        >
                            <PhoneOff size={22} fill="currentColor" />
                        </button>
                        <button className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition">
                            <MessageSquare size={20} />
                        </button>
                        {user.role === 'patient' && (
                            <button
                                onClick={shareReport}
                                className="w-12 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 flex items-center justify-center transition border border-blue-400/30 group"
                                title={t.share}
                            >
                                <Share2 size={20} className="group-hover:scale-110 transition" />
                            </button>
                        )}
                        {user.role === 'doctor' && (
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition ${sidebarOpen ? 'bg-blue-600 border-blue-400/30 shadow-lg' : 'bg-white/10 border border-white/10'}`}
                            >
                                <ClipboardList size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Doctor's Sidebar */}
            <AnimatePresence>
                {sidebarOpen && user.role === 'doctor' && (
                    <motion.div
                        initial={{ x: 320 }}
                        animate={{ x: 0 }}
                        exit={{ x: 320 }}
                        className="fixed right-0 top-0 bottom-0 w-80 bg-[#1e293b] border-l border-white/10 z-40 shadow-2xl flex flex-col p-6 overflow-y-auto custom-scrollbar"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black flex items-center gap-2">
                                <Activity className="text-blue-400" size={24} /> {t.details}
                            </h3>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-xl transition md:hidden"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Patient Basic Info */}
                        <div className="bg-white/5 rounded-3xl p-5 border border-white/5 mb-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">{displayData.name}</h4>
                                    <div className="flex gap-2 text-[10px] font-black uppercase text-gray-500">
                                        <span>{displayData.age} yr</span>
                                        <span>•</span>
                                        <span>{displayData.gender}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                <MapPin size={12} className="text-red-400" /> {displayData.village || "Durg, CG"}
                            </div>
                        </div>

                        {/* Vitals */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-3xl p-4 border border-red-500/10">
                                <div className="flex items-center gap-2 text-red-400 mb-1">
                                    <TrendingUp size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">SpO2</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black">{displayData.vitals?.spo2 || 96}</span>
                                    <span className="text-[10px] text-red-400/60 font-black">%</span>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-3xl p-4 border border-blue-500/10">
                                <div className="flex items-center gap-2 text-blue-400 mb-1">
                                    <Thermometer size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Anemia</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-black">{displayData.lastAiScan?.riskScores?.anemia || "Mod"}</span>
                                </div>
                            </div>
                        </div>

                        {/* AI Risk Scores */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-500">{t.risk}</h5>
                                <ShieldCheck size={14} className="text-green-400" />
                            </div>
                            <div className="bg-white/5 rounded-3xl p-5 border border-white/5 space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span>Sickle Cell Risk</span>
                                        <span className="text-red-400">{displayData.lastAiScan?.riskScores?.sickleCell}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${displayData.lastAiScan?.riskScores?.sickleCell}%` }}
                                            className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <span className="bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-black px-2 py-1 rounded-lg uppercase">{t.high}</span>
                                    {displayData.lastAiScan?.bodyParts?.map(part => (
                                        <span key={part} className="bg-blue-500/10 text-blue-300 border border-blue-500/10 text-[10px] font-black px-2 py-1 rounded-lg">📍 {part}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Summary & Meds */}
                        <div className="space-y-4 mb-6">
                            <div className="bg-blue-500/5 rounded-3xl p-5 border border-blue-500/10">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">{t.summary}</h5>
                                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                                    {displayData.lastAiScan?.summary}
                                </p>
                            </div>

                            <div className="bg-white/5 rounded-3xl p-5 border border-white/5">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">{t.meds}</h5>
                                <div className="space-y-3">
                                    {displayData.meds?.map((m, i) => (
                                        <div key={i} className="flex justify-between items-center group">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                                <span className="text-xs font-bold text-gray-200">{m.name}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-gray-500 bg-white/5 px-2 py-0.5 rounded-md">{m.dosage}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Full Report Button */}
                        <button
                            onClick={() => setReportModal(true)}
                            className="w-full bg-white text-[#1e293b] py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/90 transition shadow-xl shadow-black/20 mt-auto"
                        >
                            <FileText size={16} /> {t.fullReport}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal for Full Report */}
            {reportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white w-full max-w-2xl rounded-[3rem] p-8 md:p-12 text-gray-900 shadow-2xl relative max-h-[90vh] overflow-y-auto"
                    >
                        <button
                            onClick={() => setReportModal(false)}
                            className="absolute top-8 right-8 p-3 hover:bg-gray-100 rounded-2xl transition"
                        >
                            <X className="text-gray-400" />
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 bg-green-100 rounded-[1.5rem] flex items-center justify-center text-green-600">
                                <ShieldCheck size={32} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black tracking-tight">AI Health Assessment</h2>
                                <p className="text-gray-500 font-bold">Comprehensive Analysis • Phase 2</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 rounded-[2rem] p-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Genetic Risk Card</h4>
                                    <div className="flex items-center gap-2 text-2xl font-black text-red-600 mb-2">
                                        <TrendingUp /> 87% Probability
                                    </div>
                                    <p className="text-sm font-bold text-gray-600 leading-tight">Secondary markers detected in blood scan analysis.</p>
                                </div>
                                <div className="bg-gray-50 rounded-[2rem] p-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Body Scan Analysis</h4>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-2 text-sm font-bold"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Joints: Mild inflammation</li>
                                        <li className="flex items-center gap-2 text-sm font-bold"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Thorax: Normal breathing pattern</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="p-8 border-4 border-dashed border-gray-100 rounded-[2.5rem]">
                                <h4 className="font-black text-lg mb-4 flex items-center gap-2 underline decoration-green-500 decoration-4">AI Recommendation</h4>
                                <p className="text-gray-600 font-medium leading-relaxed italic">
                                    "Based on the concurrent SpO2 levels of 96% and the reported localized pain in {displayData.lastAiScan?.bodyParts?.join(' & ')}, the system suggests a potential vaso-occlusive crisis. Please maintain hydration and monitor for fever."
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <button className="flex-1 bg-green-600 text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-lg shadow-green-100 hover:bg-green-700 transition">Save for Offline</button>
                                <button className="flex-1 bg-gray-100 text-gray-900 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition">Print PDF</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default VideoCallWrapper;
