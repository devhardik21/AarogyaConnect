import { AlertTriangle, Siren } from 'lucide-react';

export default function EmergencyTab() {
    return (
        <div className="flex flex-col h-full bg-red-50 p-6 pb-24 items-center justify-center relative overflow-y-auto">
            <div className="w-full max-w-sm relative z-10 text-center">
                <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-6 animate-pulse">
                    <AlertTriangle size={48} />
                </div>

                <h2 className="text-3xl font-black text-red-600 mb-2">Emergency</h2>
                <p className="text-red-700/80 mb-8 font-medium">Click instantly to call 108 Ambulance to your exact location.</p>

                <button className="w-full bg-red-600 text-white font-black text-xl py-5 rounded-3xl shadow-[0_10px_0_rgb(185,28,28)] active:shadow-none active:translate-y-2 transition-all flex justify-center items-center gap-2 mb-6">
                    <Siren size={28} /> CALL AMBULANCE
                </button>

                <button className="w-full bg-white text-red-600 font-bold text-lg py-4 rounded-xl shadow-sm border border-red-200">
                    Call ASHA Worker
                </button>
            </div>

            {/* Decorative pulse rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-red-200 rounded-full animate-[ping_3s_infinite] opacity-50"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-red-300 rounded-full animate-[ping_2s_infinite] opacity-70"></div>
        </div>
    );
}
