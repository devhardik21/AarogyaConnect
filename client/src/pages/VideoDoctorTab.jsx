import { PhoneCall, Video } from 'lucide-react';

export default function VideoDoctorTab() {
    const doctors = [
        { name: 'Dr. Ramesh Sharma', spec: 'General Physician', status: 'Available', exp: '15 Yrs' },
        { name: 'Dr. Anita Verma', spec: 'Gynaecologist', status: 'Busy', exp: '8 Yrs' }
    ];

    return (
        <div className="flex flex-col h-full bg-gray-50 p-4 pb-24">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Expert Doctors</h2>

            <div className="space-y-4">
                {doctors.map((doc, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xl">
                                    {doc.name[4]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{doc.name}</h3>
                                    <p className="text-sm text-gray-500">{doc.spec} • {doc.exp}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${doc.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        • {doc.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex-1 bg-green-600 text-white py-2.5 rounded-2xl font-medium flex justify-center items-center gap-2 hover:bg-green-700 transition">
                                <Video size={18} /> Video Call
                            </button>
                            <button className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-2xl font-medium flex justify-center items-center gap-2 hover:bg-gray-200 transition">
                                <PhoneCall size={18} /> Audio
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
