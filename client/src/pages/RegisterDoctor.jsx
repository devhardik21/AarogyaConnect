import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Stethoscope, User, Mail, Lock, Briefcase, Award, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import config from '../config';

export default function RegisterDoctor() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        specialty: '',
        experience: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            console.log("📝 Registering doctor...", formData.email);
            const res = await axios.post(`${config.API_BASE_URL}/api/auth/register`, {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: 'doctor',
                profile: {
                    specialty: formData.specialty,
                    experience: formData.experience,
                    online: true
                }
            });
            console.log("✅ Doctor registered successfully");
            localStorage.setItem('user', JSON.stringify(res.data));
            localStorage.setItem('token', res.data.token);
            navigate('/video');
        } catch (err) {
            console.error("❌ Registration failed", err.response?.data || err.message);
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f0f9ff] flex items-center justify-center p-6 pb-24">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-xl border border-blue-100"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                        <Stethoscope className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Doctor Join</h1>
                    <p className="text-gray-500 mt-2">Start your digital practice today</p>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-medium">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            name="name"
                            placeholder="Full Name"
                            required
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            required
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="password"
                            name="password"
                            placeholder="Create Password"
                            required
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                name="specialty"
                                required
                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition appearance-none text-gray-500 text-sm"
                                value={formData.specialty}
                                onChange={handleChange}
                            >
                                <option value="">Specialty</option>
                                <option value="General Physician">General</option>
                                <option value="Hematologist">Hematology</option>
                                <option value="Gynaecologist">Gynaecology</option>
                                <option value="Pediatrician">Pediatrics</option>
                            </select>
                        </div>
                        <div className="relative">
                            <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                name="experience"
                                placeholder="Exp (e.g. 8 Yr)"
                                required
                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                                value={formData.experience}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex justify-center items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-[0.98] mt-4"
                    >
                        {loading ? 'Creating Account...' : 'Register as Doctor'} <ArrowRight size={20} />
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        Already have an account? <Link to="/login/doctor" className="text-blue-600 font-bold hover:underline">Login here</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
