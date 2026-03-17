import { NavLink } from 'react-router-dom';
import { Bot, Video, Activity, Calendar, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const TABS = [
    { id: 'ai-doctor', path: '/ai-doctor', icon: Bot, label: 'AI Doctor' },
    { id: 'video', path: '/video', icon: Video, label: 'Consult' },
    { id: 'vitals', path: '/vitals', icon: Activity, label: 'Vitals' },
    { id: 'events', path: '/events', icon: Calendar, label: 'Events' },
    { id: 'emergency', path: '/emergency', icon: AlertTriangle, label: 'Emergency', danger: true },
];

export default function BottomNav() {
    return (
        <div className="bg-white border-t border-gray-100 px-6 py-2 pb-6 md:pb-4 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-3xl">
            {TABS.map((tab) => {
                const Icon = tab.icon;
                const isDanger = tab.danger;
                return (
                    <NavLink
                        key={tab.id}
                        to={tab.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-16 h-14 relative ${isActive ? (isDanger ? 'text-red-500' : 'text-green-600') : 'text-gray-400 hover:text-gray-600'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`relative z-10 flex flex-col items-center gap-1 transition-transform duration-200 ${isActive ? '-translate-y-1' : ''}`}>
                                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                    <span className={`text-[10px] font-medium transition-opacity ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                        {tab.label}
                                    </span>
                                </div>
                                {isActive && (
                                    <motion.div
                                        layoutId="bubble"
                                        className={`absolute inset-0 w-12 h-12 mx-auto rounded-full -top-1 blur-md opacity-20 ${isDanger ? 'bg-red-500' : 'bg-green-500'
                                            }`}
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </>
                        )}
                    </NavLink>
                );
            })}
        </div>
    );
}
