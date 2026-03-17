import { HeartPulse, Droplet } from 'lucide-react';

export default function VitalsTab() {
    return (
        <div className="flex flex-col h-full bg-white p-6 pb-24">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Scan Vitals</h2>

            <div className="bg-red-50 border border-red-100 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full blur-2xl -mr-16 -mt-16 opacity-50"></div>
                <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse shadow-red-500/30">
                    <HeartPulse size={40} />
                </div>
                <div className="text-center z-10">
                    <h3 className="font-bold text-gray-800 mb-1">Place finger over camera</h3>
                    <p className="text-sm text-gray-500 max-w-[250px]">We will use the flashlight to measure your Heart Rate and SpO2 levels.</p>
                </div>
                <button className="mt-4 w-full bg-red-500 text-white font-bold py-3 pt-3.5 pb-3.5 rounded-2xl shadow-md hover:bg-red-600 active:scale-95 transition-transform">
                    Start Scan
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-3xl bg-gray-50 border border-gray-100">
                    <HeartPulse className="text-red-500 mb-2" />
                    <p className="text-xs text-gray-500 mb-1">Last Heart Rate</p>
                    <p className="text-xl font-bold">78 <span className="text-xs text-gray-400 font-normal">bpm</span></p>
                </div>
                <div className="p-4 rounded-3xl bg-blue-50 border border-blue-100">
                    <Droplet className="text-blue-500 mb-2" />
                    <p className="text-xs text-gray-500 mb-1">Last SpO2</p>
                    <p className="text-xl font-bold">98 <span className="text-xs text-gray-400 font-normal">%</span></p>
                </div>
            </div>
        </div>
    );
}
