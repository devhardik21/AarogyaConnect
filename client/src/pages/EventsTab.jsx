import { Calendar, MapPin } from 'lucide-react';

export default function EventsTab() {
    const camps = [
        { title: "Eye Checkup Camp", date: "Tomorrow, 10 AM", loc: "Panchayat Bhavan, Durg" },
        { title: "Blood Donation", date: "Sunday, 9 AM", loc: "Main Market Square" }
    ];

    return (
        <div className="flex flex-col h-full bg-gray-50 p-4 pb-24 overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Nearby Health Camps</h2>

            <div className="space-y-4">
                {camps.map((camp, i) => (
                    <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-4">
                            <Calendar size={24} />
                        </div>
                        <h3 className="font-bold text-lg text-gray-800 mb-2">{camp.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Calendar size={14} className="text-gray-400" /> {camp.date}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin size={14} className="text-gray-400" /> {camp.loc}
                        </div>
                        <button className="mt-4 w-full bg-orange-50 text-orange-600 font-bold py-2.5 rounded-xl hover:bg-orange-100 transition">
                            Register Free
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
