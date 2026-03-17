import React, { useState, useEffect } from 'react';
import { PhoneCall, Video, Search, MapPin, Star, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function VideoDoctorTab() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    // Mock data for demo
    const doctors = [
        {
            id: 'doc1',
            name: 'Dr. Sameer Khan',
            spec: 'General Physician',
            status: 'Online',
            exp: '12 Years',
            rating: 4.8,
            reviews: 124,
            fee: '₹500',
            color: 'blue'
        },
        {
            id: 'doc2',
            name: 'Dr. Priya Sharma',
            spec: 'Hematologist',
            status: 'Online',
            exp: '8 Years',
            rating: 4.9,
            reviews: 86,
            fee: '₹800',
            color: 'purple'
        },
        {
            id: 'doc3',
            name: 'Dr. Anita Verma',
            spec: 'Gynaecologist',
            status: 'Busy',
            exp: '10 Years',
            rating: 4.7,
            reviews: 210,
            fee: '₹600',
            color: 'green'
        }
    ];

    const filteredDoctors = doctors.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.spec.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const startCall = (doctorId) => {
        const randomChannel = `arogyacall-${Math.floor(Math.random() * 100000)}`;
        navigate(`/video-call/${randomChannel}`);
    };

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] overflow-y-auto pb-24">
            {/* Header section */}
            <div className="bg-white px-6 pt-12 pb-6 shadow-sm rounded-b-[2rem]">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 leading-tight">Video Consultation</h2>
                        <p className="text-gray-500 text-sm font-medium">Connect with top specialists instantly</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center border border-green-100">
                        <ShieldCheck className="text-green-600" size={24} />
                    </div>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or specialty..."
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-lg">Available Doctors</h3>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-wider">
                        {doctors.filter(d => d.status === 'Online').length} Online Now
                    </span>
                </div>

                <div className="space-y-4">
                    {filteredDoctors.map((doc, idx) => (
                        <motion.div
                            key={doc.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-all group"
                        >
                            <div className="flex gap-4 mb-5">
                                <div className={`relative w-16 h-16 rounded-2xl bg-${doc.color}-100 flex items-center justify-center shrink-0`}>
                                    <span className={`text-${doc.color}-600 font-black text-xl`}>{doc.name[4]}</span>
                                    {doc.status === 'Online' && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-extrabold text-gray-900 text-lg group-hover:text-green-600 transition-colors">{doc.name}</h4>
                                            <p className="text-green-600 font-bold text-sm">{doc.spec}</p>
                                        </div>
                                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100">
                                            <Star className="text-yellow-500 fill-yellow-500" size={14} />
                                            <span className="text-xs font-bold text-yellow-700">{doc.rating}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2 text-gray-500 text-xs font-semibold">
                                        <span className="flex items-center gap-1"><ShieldCheck size={14} /> {doc.exp}</span>
                                        <span className="flex items-center gap-1"><MapPin size={14} /> Durg, CG</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => doc.status === 'Online' && startCall(doc.id)}
                                    className={`flex-[2] py-4 rounded-2xl font-bold flex justify-center items-center gap-2 transition shadow-lg ${doc.status === 'Online'
                                            ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-100 active:scale-[0.98]'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                        }`}
                                >
                                    <Video size={18} fill="currentColor" />
                                    {doc.status === 'Online' ? 'Start Consultation' : 'Doctor Busy'}
                                </button>
                                <button className="flex-1 bg-gray-50 text-gray-700 py-4 rounded-2xl font-bold flex justify-center items-center gap-2 hover:bg-gray-100 transition border border-gray-100 active:scale-[0.98]">
                                    <PhoneCall size={18} />
                                </button>
                            </div>

                            <div className="mt-4 pt-4 border-t border-dashed border-gray-100 flex justify-between items-center">
                                <p className="text-xs text-gray-500 font-medium">Consultation Fee: <span className="text-gray-900 font-bold">{doc.fee}</span></p>
                                <p className="text-xs text-gray-500 font-medium">{doc.reviews} Verified Reviews</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
