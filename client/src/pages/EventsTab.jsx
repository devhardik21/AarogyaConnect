import { useState } from 'react';
import { Calendar, MapPin, Plus, X } from 'lucide-react';

export default function EventsTab() {
    const [camps, setCamps] = useState([
        { title: "Eye Checkup Camp", date: "Tomorrow, 10 AM", loc: "Panchayat Bhavan, Durg" },
        { title: "Blood Donation", date: "Sunday, 9 AM", loc: "Main Market Square" }
    ]);

    const [isAdding, setIsAdding] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', date: '', loc: '' });

    const handleCreateEvent = () => {
        if (!newEvent.title || !newEvent.date || !newEvent.loc) return;
        setCamps([newEvent, ...camps]);
        setNewEvent({ title: '', date: '', loc: '' });
        setIsAdding(false);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 p-4 pb-24 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Nearby Health Camps</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-2.5 bg-orange-600 text-white rounded-2xl shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95"
                >
                    {isAdding ? <X size={20} /> : <Plus size={20} />}
                </button>
            </div>

            {isAdding && (
                <div className="bg-white p-5 rounded-3xl shadow-md border border-orange-100 mb-6 animate-in slide-in-from-top duration-300">
                    <h3 className="font-bold text-gray-800 mb-4">Create New Event</h3>
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="Event Title (e.g., Dental Checkup)"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Date & Time (e.g., Monday, 2 PM)"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                            value={newEvent.date}
                            onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Location"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                            value={newEvent.loc}
                            onChange={(e) => setNewEvent({ ...newEvent, loc: e.target.value })}
                        />
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleCreateEvent}
                                className="flex-1 bg-orange-600 text-white font-bold py-3 rounded-xl hover:bg-orange-700 transition"
                            >
                                Save Event
                            </button>
                            <button
                                onClick={() => setIsAdding(false)}
                                className="px-6 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {camps.map((camp, i) => (
                    <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
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
