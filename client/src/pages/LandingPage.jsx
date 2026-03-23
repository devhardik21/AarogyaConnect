import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, ArrowRight, HeartPulse, Sparkles } from 'lucide-react';

export default function LandingPage() {
    const navigate = useNavigate();

    const sections = [
        {
            title: "For Patients",
            subtitle: "Access your health records and consult with AI or human doctors.",
            icon: HeartPulse,
            color: "bg-green-600",
            hoverColor: "hover:bg-green-700",
            lightColor: "bg-green-50",
            textColor: "text-green-700",
            iconColor: "text-green-600",
            loginPath: "/login/patient",
            registerPath: "/register"
        },
        {
            title: "For Doctors",
            subtitle: "Manage your appointments and provide virtual care to patients.",
            icon: ShieldCheck,
            color: "bg-blue-600",
            hoverColor: "hover:bg-blue-700",
            lightColor: "bg-blue-50",
            textColor: "text-blue-700",
            iconColor: "text-blue-600",
            loginPath: "/login/doctor",
            registerPath: "/register/doctor"
        }
    ];

    return (
        <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-blue-50 overflow-y-auto">
            {/* Header / Logo */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10"
            >
                <div className="relative w-24 h-24 mx-auto mb-4">
                    <motion.img
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        src="/aarogya512.jpg"
                        alt="Aarogya Connect Logo"
                        className="w-full h-full object-cover rounded-3xl shadow-xl"
                    />
                    <motion.div
                        animate={{
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.1, 1.1, 1]
                        }}
                        transition={{ repeat: Infinity, duration: 4 }}
                        className="absolute -top-2 -right-2 bg-white p-1.5 rounded-full shadow-lg"
                    >
                        <Sparkles className="text-yellow-500 w-4 h-4" />
                    </motion.div>
                </div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                    Aarogya <span className="text-green-600">Connect</span>
                </h1>
                <p className="text-gray-500 mt-2 font-medium">Your Health, Our Priority</p>
            </motion.div>

            {/* Main Selection */}
            <div className="w-full max-w-sm md:max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map((section, idx) => (
                    <motion.div
                        key={section.title}
                        initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + idx * 0.1 }}
                        className="bg-white/80 backdrop-blur-md border border-white/50 rounded-[3rem] p-8 shadow-xl shadow-gray-200/50 flex flex-col"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`p-4 ${section.lightColor} rounded-2xl`}>
                                <section.icon className={section.iconColor} size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 leading-tight">{section.title}</h2>
                                <p className="text-sm text-gray-500 font-medium">{section.subtitle}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-auto">
                            <button
                                onClick={() => navigate(section.loginPath)}
                                className={`py-4 ${section.color} ${section.hoverColor} text-white rounded-[1.5rem] font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-gray-200`}
                            >
                                Login
                            </button>
                            <button
                                onClick={() => navigate(section.registerPath)}
                                className={`py-4 ${section.lightColor} ${section.textColor} border border-transparent rounded-[1.5rem] font-bold transition-all hover:bg-white active:scale-95 flex items-center justify-center gap-2`}
                            >
                                Register <ArrowRight size={16} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Footer */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-12 text-xs text-gray-400 font-medium"
            >
                © 2026 Aarogya Connect. All rights reserved.
            </motion.p>
        </div>
    );
}
