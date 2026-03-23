import AgoraRTC from 'agora-rtc-sdk-ng';
import io from 'socket.io-client';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    AgoraRTCProvider,
    useRTCClient,
    useLocalCameraTrack,
    useLocalMicrophoneTrack,
    useRemoteUsers,
    useJoin,
    usePublish,
    RemoteUser,
    LocalVideoTrack
} from "agora-rtc-react";
import { motion, AnimatePresence } from 'framer-motion';
import {
    Languages, ShieldCheck, Star, Heart, Activity, MessageSquare,
    PhoneCall, Video, Mic, MicOff, Camera, CameraOff, Send,
    FileText, X, User, VideoOff, PhoneOff, Share2, ClipboardList,
    MapPin, TrendingUp, Thermometer
} from 'lucide-react';
import config from '../config';
const socket = io(config.SOCKET_URL);

// --- AGORA SETUP ---
const APP_ID = import.meta.env.VITE_AGORA_APP_ID || "PASTE_YOUR_APP_ID_HERE";

const VideoCallWrapper = () => {
    // Create the client once and keep it stable across re-renders
    const client = useRTCClient(useMemo(() => AgoraRTC.createClient({ codec: "vp8", mode: "rtc" }), []));

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
    const location = useLocation();
    // doctorId passed via navigation state from VideoDoctorTab
    // We save it to sessionStorage to survive refreshes during the call
    const [targetDoctorId, setTargetDoctorId] = useState(() => {
        const idFromState = location.state?.doctorId;
        if (idFromState) {
            sessionStorage.setItem('activeDoctorId', idFromState);
            return idFromState;
        }
        return sessionStorage.getItem('activeDoctorId');
    });

    const [muted, setMuted] = useState(false);
    const [videoOff, setVideoOff] = useState(false);
    const [lang, setLang] = useState('en');
    const [sidebarOpen, setSidebarOpen] = useState(user?.role === 'doctor');
    const [reportModal, setReportModal] = useState(false);
    const [sharedData, setSharedData] = useState(null);
    const [agoraToken, setAgoraToken] = useState(null);
    const [isConnecting, setIsConnecting] = useState(true);

    // Consistent Integer UID for Agora (must be < 4294967295)
    // The error message specifically mentioned [0, 65535], 
    // so we use the last 4 hex characters of the MongoDB ID.
    const uid = useMemo(() => {
        if (user?._id) {
            return parseInt(user._id.slice(-4), 16) || Math.floor(Math.random() * 10000) + 1;
        }
        return Math.floor(Math.random() * 10000) + 1;
    }, [user?._id]);

    // Agora Hooks
    const { localMicrophoneTrack } = useLocalMicrophoneTrack(!muted);
    const { localCameraTrack } = useLocalCameraTrack(!videoOff);
    const remoteUsers = useRemoteUsers();
    const client = useRTCClient();

    console.log("🎥 Channel State:", {
        channelId,
        hasToken: !!agoraToken,
        remoteUsersCount: remoteUsers.length,
        hasLocalMic: !!localMicrophoneTrack,
        hasLocalCam: !!localCameraTrack
    });

    // Diagnostics: Log Agora events
    useEffect(() => {
        if (!client) return;
        const events = ['user-joined', 'user-published', 'user-left', 'exception'];
        events.forEach(en => {
            client.on(en, (arg) => {
                console.log(`📡 Agora Event [${en}]:`, arg);
                if (en === 'user-published') {
                    console.log(`🎥 User ${arg.uid} published ${arg.mediaType}`);
                }
            });
        });
        return () => {
            events.forEach(en => client.off(en));
        };
    }, [client]);

    // Track camera track errors
    useEffect(() => {
        if (!videoOff && !localCameraTrack) {
            console.warn("⚠️ Camera track is still null. Check browser permissions or if another app is using it.");
        }
    }, [localCameraTrack, videoOff]);

    useEffect(() => {
        if (remoteUsers.length > 0) {
            const rUser = remoteUsers[0];
            console.log("👤 Remote User State:", {
                uid: rUser.uid,
                hasVideo: !!rUser.videoTrack,
                hasAudio: !!rUser.audioTrack,
                videoMuted: rUser.videoMuted,
                audioMuted: rUser.audioMuted
            });
        }
    }, [remoteUsers]);

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const res = await axios.get(`${config.API_BASE_URL}/api/agora/token?channelName=${channelId}`);
                console.log("🎟️ Agora Token received");
                setAgoraToken(res.data.token);
            } catch (e) {
                console.error("❌ Token fetch failed", e);
            } finally {
                setIsConnecting(false);
            }
        };

        if (channelId) {
            fetchToken();
        }
    }, [channelId]);

    // --- Signaling Heartbeat ---
    // Moved to separate effect to avoid stale remoteUsers state
    useEffect(() => {
        if (!channelId || !user || user.role !== 'patient' || !targetDoctorId) return;
        if (remoteUsers.length > 0) return;

        console.log(`📡 Starting call heartbeat to doctor: ${targetDoctorId}`);

        const callPayload = {
            doctorId: String(targetDoctorId),
            patientId: user._id,
            patientName: user.name,
            channelName: channelId
        };

        // Initial queueing
        axios.post(`${config.API_BASE_URL}/api/calls/queue`, callPayload)
            .then(() => console.log('📋 Call heartbeat: Queued on server'))
            .catch(err => console.error('❌ Call heartbeat error:', err.message));

        const signalingInterval = setInterval(() => {
            if (remoteUsers.length === 0) {
                socket.emit('call-doctor', callPayload);
                console.log('📡 Heartbeat: socket ping sent');
            }
        }, 3000);

        return () => {
            console.log('📡 Stopping call heartbeat');
            clearInterval(signalingInterval);
        };
    }, [channelId, user?._id, targetDoctorId, remoteUsers.length]);

    // Join/Room socket handlers
    useEffect(() => {
        if (!user?._id) return;

        const joinRoom = () => {
            socket.emit('join-room', user._id);
            console.log(`🔌 Local user joined signaling room: ${user._id} (socket: ${socket.id})`);
        };

        // If already connected (race condition fix), join immediately
        if (socket.connected) {
            joinRoom();
        }
        // Also listen for future (re)connects
        socket.on('connect', joinRoom);

        // Doctor listens for data
        const dataHandler = (patientData) => {
            console.log('📋 Received patient data via socket:', patientData);
            setSharedData(patientData);
        };
        socket.on('patient-data', dataHandler);

        return () => {
            socket.off('connect', joinRoom);
            socket.off('patient-data', dataHandler);
        };
    }, [user?._id]);

    // Join the channel with our stable UID
    useJoin({
        appid: APP_ID,
        channel: channelId,
        token: agoraToken,
        uid: uid
    }, !!agoraToken);

    // Filter out null tracks to avoid "INVALID_PARAMS" error in SDK
    const tracksToPublish = [localMicrophoneTrack, localCameraTrack].filter(track => !!track);
    usePublish(tracksToPublish, !!agoraToken && tracksToPublish.length > 0);

    const handleEndCall = () => {
        navigate('/video');
    };

    const toggleLang = () => setLang(l => l === 'en' ? 'hi' : 'en');

    const shareReport = () => {
        if (user.role === 'patient') {
            // Share patient profile to the doctor via socket
            socket.emit('share-patient-data', {
                doctorId: targetDoctorId,
                patientData: user.profile
            });
            setSharedData(user.profile);
            alert("Report Shared with Doctor! 📋");
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

                {/* --- Temporary Diagnostic Info --- */}
                <div className="absolute top-20 right-6 z-50 bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-[9px] font-mono space-y-1">
                    <p className={agoraToken ? "text-green-400" : "text-red-400"}>Token: {agoraToken ? "✅ OK" : "❌ Missing"}</p>
                    <p className={localCameraTrack ? "text-green-400" : "text-yellow-400"}>
                        Cam: {localCameraTrack ? "✅ OK" : (!videoOff ? "⏳ Requesting/Blocked" : "🌑 Off")}
                    </p>
                    <p className={remoteUsers.length > 0 ? "text-green-400" : "text-blue-400"}>Remote Users: {remoteUsers.length}</p>
                    <p className="text-gray-400 text-[8px]">UID: {client?.uid || "N/A"}</p>
                </div>

                {/* Video Grid */}
                <div className="flex-1 relative bg-gray-900 group">
                    {/* Remote User */}
                    {remoteUsers.length > 0 ? (
                        <div className="w-full h-full relative">
                            <RemoteUser
                                user={remoteUsers[0]}
                                playVideo={true}
                                playAudio={true}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            {!remoteUsers[0].videoTrack && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50 backdrop-blur-sm">
                                    <p className="text-xs font-bold text-gray-400">Remote user camera off</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#1e293b]">
                            <div className="text-center p-8">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{ repeat: Infinity, duration: 3 }}
                                    className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30 relative"
                                >
                                    <div className="absolute inset-0 rounded-full border border-blue-500/40 animate-ping opacity-20" />
                                    <User size={40} className="text-blue-400" />
                                </motion.div>
                                <h3 className="text-xl font-black mb-2 tracking-tight">
                                    Waiting for {user.role === 'patient' ? 'Doctor' : 'Patient'}
                                </h3>
                                <div className="flex flex-col gap-2 items-center">
                                    <p className="text-blue-400/60 font-bold text-[10px] uppercase tracking-[0.2em] animate-pulse">
                                        Establishing Secure Link...
                                    </p>
                                    <div className="flex gap-1.5 mt-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${agoraToken ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`} title="Token Status" />
                                        <div className={`w-1.5 h-1.5 rounded-full ${localCameraTrack ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} title="Camera Status" />
                                        <div className={`w-1.5 h-1.5 rounded-full ${localMicrophoneTrack ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} title="Microphone Status" />
                                    </div>
                                    {!localCameraTrack && (
                                        <p className="text-[9px] text-red-400/80 font-medium mt-2 max-w-[200px]">
                                            ⚠️ Camera conflict detected. Ensure no other apps or browser tabs are using your camera.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Local User Preview (PIP) */}
                    <div className="absolute bottom-24 right-6 w-32 h-44 bg-black rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-20 md:bottom-28">
                        {!videoOff && localCameraTrack ? (
                            <LocalVideoTrack
                                track={localCameraTrack}
                                play={true}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
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
                            {videoOff ? <VideoOff size={20} /> : <Video size={20} />}
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
