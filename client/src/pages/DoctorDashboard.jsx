import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Stethoscope, Video, PhoneCall, Users, Clock, Star,
    Power, LogOut, Bell, CheckCircle, XCircle, Activity,
    ChevronRight, Calendar, TrendingUp, User
} from 'lucide-react';
import config from '../config';

const socket = io(config.SOCKET_URL);

export default function DoctorDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isOnline, setIsOnline] = useState(true);
    const [incomingCall, setIncomingCall] = useState(null);
    const [ringCount, setRingCount] = useState(0);

    // ─── Socket setup ─────────────────────────────────────────────────────
    useEffect(() => {
        if (user?._id) {
            socket.emit('join-room', user._id);
            console.log(`🔌 Doctor ${user.name} joined signaling room: ${user._id}`);
        }

        socket.on('incoming-call', (data) => {
            console.log('🔔 Incoming call signal received:', data.channelName);
            setIncomingCall(prev => {
                if (!prev || prev.channelName !== data.channelName) {
                    setRingCount(c => c + 1);
                    return data;
                }
                return prev;
            });
        });

        return () => {
            socket.off('incoming-call');
        };
    }, [user]);

    const acceptCall = () => {
        if (incomingCall?.channelName) {
            navigate(`/video-call/${incomingCall.channelName}`);
            setIncomingCall(null);
        }
    };

    const declineCall = () => {
        setIncomingCall(null);
    };

    const handleLogout = () => {
        logout();
        navigate('/login/doctor');
    };

    // Mock queue data
    const queue = [
        { id: 1, name: 'Ramesh Kumar', time: '10:30 AM', village: 'Durg', issue: 'Chest pain', status: 'waiting' },
        { id: 2, name: 'Priya Sahu', time: '11:00 AM', village: 'Bhilai', issue: 'Fever & headache', status: 'waiting' },
        { id: 3, name: 'Mohan Lal', time: '11:30 AM', village: 'Raipur', issue: 'Back pain', status: 'scheduled' },
    ];

    const stats = [
        { label: "Today's Patients", value: 12, icon: Users, color: 'blue' },
        { label: 'Avg Rating', value: '4.8★', icon: Star, color: 'yellow' },
        { label: 'Consultations', value: 248, icon: Activity, color: 'green' },
        { label: 'Response Time', value: '2 min', icon: Clock, color: 'purple' },
    ];

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-[#0f172a] to-[#1e293b] overflow-y-auto pb-6">

            {/* ─── Header ────────────────────────────────── */}
            <div className="px-6 pt-12 pb-6">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                            <Stethoscope className="text-blue-400" size={24} />
                        </div>
                        <div>
                            <h1 className="text-white font-black text-lg leading-tight">Dr. {user?.name}</h1>
                            <p className="text-blue-400 text-xs font-bold">{user?.profile?.specialty || 'General Physician'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Online toggle */}
                        <button
                            onClick={() => setIsOnline(o => !o)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-black border transition-all ${isOnline
                                ? 'bg-green-500/20 border-green-500/30 text-green-400'
                                : 'bg-gray-700 border-gray-600 text-gray-400'}`}
                        >
                            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                            {isOnline ? 'Online' : 'Offline'}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>

                {/* Notification count */}
                {ringCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-3 flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-2xl px-4 py-2"
                    >
                        <Bell size={14} className="text-blue-400" />
                        <span className="text-xs text-blue-300 font-bold">{ringCount} call{ringCount > 1 ? 's' : ''} today</span>
                    </motion.div>
                )}
            </div>

            {/* ─── Stats Grid ────────────────────────────── */}
            <div className="px-6 mb-6">
                <div className="grid grid-cols-2 gap-3">
                    {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        const colorMap = {
                            blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/10 text-blue-400',
                            yellow: 'from-yellow-500/10 to-yellow-600/5 border-yellow-500/10 text-yellow-400',
                            green: 'from-green-500/10 to-green-600/5 border-green-500/10 text-green-400',
                            purple: 'from-purple-500/10 to-purple-600/5 border-purple-500/10 text-purple-400',
                        }[stat.color];
                        return (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className={`bg-gradient-to-br ${colorMap} rounded-3xl p-4 border`}
                            >
                                <Icon size={18} className="mb-2 opacity-80" />
                                <div className="text-2xl font-black text-white">{stat.value}</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{stat.label}</div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* ─── Today's Queue ─────────────────────────── */}
            <div className="px-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-black text-base flex items-center gap-2">
                        <Calendar size={18} className="text-blue-400" />
                        Today's Queue
                    </h2>
                    <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                        {queue.length} patients
                    </span>
                </div>

                <div className="space-y-3">
                    {queue.map((patient, i) => (
                        <motion.div
                            key={patient.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + i * 0.07 }}
                            className="bg-white/5 rounded-3xl p-4 border border-white/5 flex items-center gap-4"
                        >
                            <div className="w-11 h-11 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/20 flex-shrink-0">
                                <User size={18} className="text-blue-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-white font-bold text-sm truncate">{patient.name}</h4>
                                    <span className="text-gray-400 text-[10px] font-bold">{patient.time}</span>
                                </div>
                                <p className="text-gray-400 text-xs font-medium truncate">
                                    {patient.village} • {patient.issue}
                                </p>
                            </div>
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${patient.status === 'waiting' ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* ─── Quick Actions ─────────────────────────── */}
            <div className="px-6 mt-6">
                <h2 className="text-white font-black text-base mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-blue-400" />
                    Quick Actions
                </h2>
                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/video')}
                        className="w-full bg-blue-600/20 border border-blue-500/30 rounded-2xl p-4 flex items-center justify-between text-left hover:bg-blue-600/30 transition-all active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-3">
                            <Video size={20} className="text-blue-400" />
                            <div>
                                <p className="text-white font-bold text-sm">Browse Patients</p>
                                <p className="text-gray-400 text-xs">See patient list</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-gray-500" />
                    </button>
                </div>
            </div>

            {/* ─── Incoming Call Overlay ─────────────────── */}
            <AnimatePresence>
                {incomingCall && (
                    <motion.div
                        initial={{ opacity: 0, y: 80 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 80 }}
                        className="fixed bottom-6 inset-x-4 z-50 bg-[#1e293b] rounded-[2.5rem] p-6 shadow-2xl border-2 border-green-500/60 flex flex-col items-center text-center"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.12, 1] }}
                            transition={{ repeat: Infinity, duration: 1.2 }}
                            className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4 border-2 border-green-500/40"
                        >
                            <PhoneCall className="text-green-400" size={32} />
                        </motion.div>
                        <h3 className="text-xl font-black text-white">Incoming Patient Call</h3>
                        <p className="text-gray-400 font-bold mt-1 mb-6">
                            <span className="text-green-400">{incomingCall.patientName}</span> is calling you...
                        </p>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={declineCall}
                                className="flex-1 py-4 bg-white/5 border border-white/10 text-gray-300 rounded-2xl font-bold hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all flex items-center justify-center gap-2"
                            >
                                <XCircle size={18} /> Decline
                            </button>
                            <button
                                onClick={acceptCall}
                                className="flex-[2] py-4 bg-green-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 shadow-lg shadow-green-900/40 transition-all active:scale-95"
                            >
                                <Video size={18} fill="currentColor" /> Accept Call
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
