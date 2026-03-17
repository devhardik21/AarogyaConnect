import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, HeartPulse, ChevronRight, ChevronLeft, CheckCircle, Baby, Scale, Ruler, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const STEPS = [
    { id: 'account', title: 'Basic Info', icon: User },
    { id: 'physical', title: 'Vital Stats', icon: Scale },
    { id: 'health', title: 'Health Profile', icon: HeartPulse },
    { id: 'cycle', title: "Women's Health", icon: Sparkles, condition: (formData) => formData.gender === 'Female' },
    { id: 'finish', title: 'Done', icon: CheckCircle }
];

export default function InteractiveRegistration() {
    const navigate = useNavigate();
    const [stepIndex, setStepIndex] = useState(0);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        gender: 'Male',
        age: 25,
        height: 170,
        weight: 65,
        chronicConditions: [],
        lastPeriodDate: '',
        cycleLength: 28,
        isWorryingCycle: false
    });

    const activeSteps = STEPS.filter(s => !s.condition || s.condition(formData));
    const currentStep = activeSteps[stepIndex];

    const nextStep = () => {
        if (stepIndex < activeSteps.length - 1) setStepIndex(prev => prev + 1);
        else handleRegister();
    };

    const prevStep = () => {
        if (stepIndex > 0) setStepIndex(prev => prev - 1);
    };

    const handleCheck = (cond) => {
        setFormData(prev => ({
            ...prev,
            chronicConditions: prev.chronicConditions.includes(cond)
                ? prev.chronicConditions.filter(c => c !== cond)
                : [...prev.chronicConditions, cond]
        }));
    };

    const handleRegister = async () => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: 'patient',
                profile: {
                    age: formData.age,
                    gender: formData.gender,
                    healthProfile: {
                        height: formData.height,
                        weight: formData.weight,
                        chronicConditions: formData.chronicConditions
                    },
                    menstrualData: formData.gender === 'Female' ? {
                        lastPeriodDate: formData.lastPeriodDate,
                        cycleLength: formData.cycleLength,
                        isWorrying: formData.isWorryingCycle
                    } : null
                }
            });
            if (res.status === 201) {
                alert("Registration Successful!");
                navigate('/login/patient');
            }
        } catch (error) {
            alert(error.response?.data?.message || "Registration failed");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg bg-white rounded-[3rem] p-8 shadow-2xl border border-gray-100 relative overflow-hidden"
            >
                {/* Background Decoration */}
                <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 rounded-full ${formData.gender === 'Female' ? 'bg-pink-500' : 'bg-green-500'}`} />

                {/* Progress Bar */}
                <div className="flex justify-between mb-8 px-2">
                    {activeSteps.map((s, idx) => (
                        <div key={s.id} className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${idx <= stepIndex ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'
                                }`}>
                                {idx < stepIndex ? <CheckCircle size={16} /> : idx + 1}
                            </div>
                        </div>
                    ))}
                    <div className="absolute top-12 left-12 right-12 h-1 bg-gray-100 -z-10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(stepIndex / (activeSteps.length - 1)) * 100}%` }}
                            className="h-full bg-green-500"
                        />
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-100">
                                <currentStep.icon className="text-green-600" size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900">{currentStep.title}</h2>
                            <p className="text-gray-500 text-sm">Step {stepIndex + 1} of {activeSteps.length}</p>
                        </div>

                        {/* STEP CONTENT */}
                        {currentStep.id === 'account' && (
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-green-500 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-green-500 outline-none"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-green-500 outline-none"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                                <div className="flex gap-4">
                                    {['Male', 'Female'].map(g => (
                                        <button
                                            key={g}
                                            onClick={() => setFormData({ ...formData, gender: g })}
                                            className={`flex-1 py-4 rounded-2xl font-bold border-2 transition ${formData.gender === g ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-100 text-gray-400'
                                                }`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {currentStep.id === 'physical' && (
                            <div className="space-y-6">
                                <div className="p-4 bg-gray-50 rounded-3xl">
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-bold text-gray-700">Age: <span className="text-green-600">{formData.age} yrs</span></label>
                                    </div>
                                    <input type="range" min="1" max="100" className="w-full accent-green-600" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} />
                                </div>
                                <div className="p-4 bg-gray-50 rounded-3xl">
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-bold text-gray-700">Weight: <span className="text-green-600">{formData.weight} kg</span></label>
                                    </div>
                                    <input type="range" min="10" max="200" className="w-full accent-green-600" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} />
                                </div>
                                <div className="p-4 bg-gray-50 rounded-3xl">
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-bold text-gray-700">Height: <span className="text-green-600">{formData.height} cm</span></label>
                                    </div>
                                    <input type="range" min="50" max="250" className="w-full accent-green-600" value={formData.height} onChange={e => setFormData({ ...formData, height: e.target.value })} />
                                </div>
                            </div>
                        )}

                        {currentStep.id === 'health' && (
                            <div className="grid grid-cols-2 gap-3">
                                {['Sugar (Diabetes)', 'Blood Pressure', 'Thyroid', 'Asthma', 'PCOD/PCOS', 'Other'].map(cond => (
                                    <button
                                        key={cond}
                                        onClick={() => handleCheck(cond)}
                                        className={`p-4 rounded-2xl border-2 text-xs font-bold transition flex items-center gap-2 ${formData.chronicConditions.includes(cond) ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-100 text-gray-500'
                                            }`}
                                    >
                                        <CheckCircle size={16} className={formData.chronicConditions.includes(cond) ? 'opacity-100' : 'opacity-0'} />
                                        {cond}
                                    </button>
                                ))}
                            </div>
                        )}

                        {currentStep.id === 'cycle' && (
                            <div className="space-y-6">
                                <div className="p-6 bg-pink-50 rounded-[2rem] border border-pink-100">
                                    <h4 className="text-pink-600 font-black text-sm uppercase tracking-widest mb-4">Menstrual Health</h4>
                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold text-pink-400">Date of Last Period</label>
                                            <input
                                                type="date"
                                                className="w-full p-4 bg-white rounded-2xl border border-pink-200 outline-none text-pink-700"
                                                value={formData.lastPeriodDate}
                                                onChange={e => setFormData({ ...formData, lastPeriodDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold text-pink-400">Regular Cycle Length (Days)</label>
                                            <input
                                                type="number"
                                                className="w-full p-4 bg-white rounded-2xl border border-pink-200 outline-none text-pink-700"
                                                value={formData.cycleLength}
                                                onChange={e => setFormData({ ...formData, cycleLength: e.target.value })}
                                            />
                                        </div>
                                        <button
                                            onClick={() => setFormData({ ...formData, isWorryingCycle: !formData.isWorryingCycle })}
                                            className={`w-full p-4 rounded-2xl border-2 flex items-center justify-center gap-2 transition ${formData.isWorryingCycle ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-pink-200 text-pink-400'
                                                }`}
                                        >
                                            {formData.isWorryingCycle ? "⚠️ My cycle is irregular/worrisome" : "Regular Cycle"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep.id === 'finish' && (
                            <div className="text-center py-8">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                                >
                                    <CheckCircle size={48} className="text-green-600" />
                                </motion.div>
                                <h3 className="text-xl font-bold">All setup!</h3>
                                <p className="text-gray-500 mt-2">Ready to experience ArogyaConnect</p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* NAV BUTTONS */}
                <div className="flex gap-4 mt-8">
                    {stepIndex > 0 && (
                        <button
                            onClick={prevStep}
                            className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition"
                        >
                            <ChevronLeft size={20} /> Back
                        </button>
                    )}
                    <button
                        onClick={nextStep}
                        className="flex-[2] py-4 bg-green-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 shadow-lg shadow-green-100 transition active:scale-95"
                    >
                        {stepIndex === activeSteps.length - 1 ? 'Finish & Create Account' : 'Continue'} <ChevronRight size={20} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
