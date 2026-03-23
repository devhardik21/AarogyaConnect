import { HeartPulse, Droplet } from 'lucide-react';

export default function VitalsTab() {
    return (
        <div className="flex flex-col h-full bg-white p-6 pb-24 max-w-4xl mx-auto w-full transition-all duration-300 overflow-y-auto">
            <h2 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">Scan Vitals</h2>

            <div className="bg-red-50 border border-red-100 rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-center gap-8 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-100 rounded-full blur-[80px] -mr-32 -mt-32 opacity-30"></div>
                <div className="w-32 h-32 bg-red-500 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl animate-pulse shadow-red-500/40 relative z-10">
                    <HeartPulse size={56} />
                </div>
                <div className="text-center md:text-left z-10 flex-1">
                    <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">Place finger over camera</h3>
                    <p className="text-sm text-gray-500 max-w-md font-medium leading-relaxed">We will use the flashlight to measure your Heart Rate and SpO2 levels. Keep your finger steady for 15 seconds.</p>
                    <button className="mt-8 w-full md:w-auto px-10 bg-red-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-100 hover:bg-red-600 active:scale-95 transition-all text-sm uppercase tracking-widest">
                        Start Scan
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="p-6 rounded-[2rem] bg-gray-50 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                        <HeartPulse className="text-red-500" size={20} />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Last Heart Rate</p>
                    <p className="text-3xl font-black text-gray-900 tracking-tight">78 <span className="text-sm text-gray-400 font-bold uppercase ml-1">bpm</span></p>
                </div>
                <div className="p-6 rounded-[2rem] bg-blue-50 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                        <Droplet className="text-blue-500" size={20} />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Last SpO2</p>
                    <p className="text-3xl font-black text-gray-900 tracking-tight">98 <span className="text-sm text-gray-400 font-bold uppercase ml-1">%</span></p>
                </div>
            </div>
        </div>
    );
}
