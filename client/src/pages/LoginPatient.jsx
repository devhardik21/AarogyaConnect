import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, ArrowRight, HeartPulse } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPatient() {
    const [email, setEmail] = useState('rajesh@patient.com');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await login(email, password);
        if (res.success) {
            navigate('/ai-doctor');
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="min-h-screen bg-green-50 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-xl border border-green-100"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-200">
                        <HeartPulse className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Patient Portal</h1>
                    <p className="text-gray-500 mt-2">Welcome to AarogyaConnect</p>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-medium">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="email"
                            placeholder="Email Address"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold flex justify-center items-center gap-2 hover:bg-green-700 shadow-lg shadow-green-200 transition-all active:scale-[0.98]">
                        Sign In <ArrowRight size={20} />
                    </button>
                </form>

                <div className="mt-8 text-center space-y-4">
                    <p className="text-gray-500 text-sm">
                        New here? <Link to="/register" className="text-green-600 font-bold hover:underline">Create Account</Link>
                    </p>
                    <p className="text-gray-500 text-sm">
                        Are you a doctor? <Link to="/login/doctor" className="text-green-600 font-bold hover:underline">Doctor Login</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
