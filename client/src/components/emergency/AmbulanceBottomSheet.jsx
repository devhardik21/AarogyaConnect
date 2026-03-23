// ─── Ambulance Bottom Sheet Component ────────────────────────────────────────
// Integrated from ambulance/client/src/components/BottomSheet.jsx
// No logic changes needed — placed in /emergency subfolder to avoid collisions.

import React, { useState, useMemo } from 'react';
import { Clock, Users, ShieldAlert, BellRing, Star, Zap, CheckCircle2, PhoneCall } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function AmbulanceBottomSheet({ ambulances, onBook, selectedId, setSelectedId, loading, userLocation, bookedAmbulance, onCancelRequest }) {
  const [sortBy, setSortBy] = useState('nearest');

  const Skeleton = () => (
    <div className="flex animate-pulse items-center p-4 border-b border-gray-100">
      <div className="w-16 h-16 bg-gray-200 rounded-lg mr-4"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
      </div>
      <div className="ml-4 flex flex-col items-end">
        <div className="h-5 bg-gray-200 rounded w-16 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-12"></div>
      </div>
    </div>
  );

  const sortedAmbulances = useMemo(() => {
    let sorted = [...ambulances];
    if (sortBy === 'nearest') sorted.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    else if (sortBy === 'cheapest') sorted.sort((a, b) => a.basePrice - b.basePrice);
    else if (sortBy === 'fastest') sorted.sort((a, b) => a.eta - b.eta);
    return sorted;
  }, [ambulances, sortBy]);

  const bestChoiceId = useMemo(() => {
    const available = ambulances.filter(a => a.availability);
    if (available.length === 0) return null;
    available.sort((a, b) => (a.eta + parseFloat(a.distance)) - (b.eta + parseFloat(b.distance)));
    return available[0].id;
  }, [ambulances]);

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute bottom-0 w-full bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-10 overflow-hidden flex flex-col h-[60vh] rounded-t-3xl"
    >
      {/* Drag handle */}
      <div className="w-full flex justify-center py-3">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
      </div>

      <div className="px-6 pb-2">
        <h2 className="text-2xl font-bold text-gray-900">
          {bookedAmbulance ? 'Active Request' : 'Choose an ambulance'}
        </h2>
        {!userLocation && !loading && (
          <p className="text-sm text-amber-600 mt-1">Acquiring your location...</p>
        )}
      </div>

      {!bookedAmbulance && !loading && ambulances.length > 0 && (
        <div className="px-6 py-2 flex space-x-2 overflow-x-auto border-b border-gray-100">
          {['nearest', 'fastest', 'cheapest'].map(opt => (
            <button
              key={opt}
              onClick={() => setSortBy(opt)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                sortBy === opt ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt === 'nearest' ? 'Nearest First' : opt === 'fastest' ? 'Fastest Arrival' : 'Cheapest'}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {/* Active Booking Banner */}
        <AnimatePresence>
          {bookedAmbulance && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="bg-green-50 m-4 rounded-xl p-4 border border-green-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3 border-b border-green-200 pb-3">
                <div>
                  <h3 className="text-xl font-bold text-green-900">En Route</h3>
                  <p className="text-green-700 text-sm mt-0.5">Arriving in <span className="font-bold text-lg">{bookedAmbulance.eta} mins</span></p>
                </div>
                <div className="bg-green-200 text-green-800 p-2 rounded-full">
                  <BellRing className="w-5 h-5 animate-pulse" />
                </div>
              </div>
              <div className="flex justify-between items-center bg-white/60 rounded-lg p-2 mb-3 mt-1">
                <span className="text-green-800 font-medium text-sm">{bookedAmbulance.type}</span>
                <span className="font-bold text-green-900 text-sm">₹{bookedAmbulance.basePrice}</span>
              </div>
              <div className="flex justify-between items-center bg-white/60 rounded-lg p-2 mb-4">
                <span className="text-green-800 font-medium text-sm">Distance Remaining</span>
                <span className="font-bold text-green-900 text-sm">{bookedAmbulance.distance} km</span>
              </div>
              <button
                onClick={onCancelRequest}
                className="w-full bg-white text-red-600 border border-red-200 font-bold text-sm py-2.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                Cancel Booking
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <><Skeleton /><Skeleton /><Skeleton /></>
        ) : ambulances.length === 0 && userLocation ? (
          <div className="flex flex-col items-center justify-center p-8 text-center h-full">
            <ShieldAlert className="w-12 h-12 text-gray-400 mb-3" />
            <h3 className="text-lg font-semibold text-gray-700">No ambulances nearby</h3>
            <p className="text-gray-500 text-sm mt-1">Please try again or call emergency numbers directly.</p>
          </div>
        ) : (
          <>
            {/* 108 Govt Ambulance — always at top */}
            <div className="flex items-start p-4 border-b border-gray-100 bg-green-50/40 hover:bg-green-50 cursor-pointer relative">
              <div className="w-20 h-20 bg-white rounded-lg mr-4 flex flex-col items-center justify-center flex-shrink-0 relative overflow-hidden border-2 border-green-500 shadow-sm">
                <img src="https://img.icons8.com/color/96/ambulance.png" alt="108 Ambulance" className="w-12 h-12 relative z-10" />
                <div className="absolute top-0 w-full bg-green-600 text-[9px] font-black text-center py-0.5 text-white tracking-widest z-20">GOVT</div>
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] uppercase tracking-wider font-bold">
                      <span className="px-2 py-0.5 rounded text-white bg-green-600 flex items-center shadow-sm">
                        <ShieldAlert className="w-3 h-3 mr-1" /> 108 Free Service
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 bg-white border border-gray-100 w-fit px-1.5 py-0.5 rounded mb-1.5">
                      <Users className="w-3 h-3 mr-1" /> Govt Emergency
                    </div>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="font-black text-lg text-green-700 tracking-tight">FREE</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded mt-1 flex items-center bg-green-100 text-green-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Available
                    </span>
                  </div>
                </div>
                <div className="flex items-center mt-1 text-sm font-medium">
                  <span className="text-amber-700 flex items-center bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                    <Clock className="w-3.5 h-3.5 mr-1" /> 34 mins away
                  </span>
                  <span className="text-gray-400 mx-2">•</span>
                  <a href="tel:108" className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold flex items-center hover:bg-red-200 transition-colors">
                    <PhoneCall className="w-3 h-3 mr-1" /> Call Now
                  </a>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 font-medium">24x7 Toll Free • Basic Life Support • Government Run</p>
              </div>
            </div>

            {/* Private Ambulances */}
            {sortedAmbulances.map(amb => (
              <div
                key={amb.id}
                onClick={() => amb.availability && setSelectedId(amb.id)}
                className={`flex items-start p-4 border-b border-gray-100 transition-colors cursor-pointer relative
                  ${selectedId === amb.id ? 'bg-blue-50/50 border-blue-500 border-l-4' : 'hover:bg-gray-50 border-l-4 border-transparent'}
                  ${!amb.availability && 'opacity-50 cursor-not-allowed'}
                `}
              >
                <div className="w-20 h-20 bg-gray-100 rounded-lg mr-4 flex flex-col items-center justify-center flex-shrink-0 relative overflow-hidden border border-gray-200">
                  <img
                    src="https://img.icons8.com/color/96/ambulance.png"
                    alt="Ambulance"
                    className={`w-12 h-12 ${
                      !amb.availability ? 'grayscale opacity-50'
                        : amb.type === 'Mobile ICU' ? 'hue-rotate-180'
                        : amb.type === 'Basic Life Support (BLS)' ? 'hue-rotate-90'
                        : ''
                    }`}
                  />
                  <div className="absolute bottom-0 w-full bg-white/90 text-[10px] font-bold text-center py-0.5 text-gray-600 flex items-center justify-center">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-0.5" />
                    {amb.rating}
                  </div>
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] uppercase tracking-wider font-bold flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-white ${
                          amb.type === 'Mobile ICU' ? 'bg-red-500'
                            : amb.type === 'Cardiac' ? 'bg-purple-500'
                            : amb.type.includes('BLS') ? 'bg-orange-500'
                            : 'bg-green-500'
                        }`}>
                          {amb.type}
                        </span>
                        {amb.source === 'hospital' ? (
                          <span className="px-1.5 py-0.5 rounded bg-pink-100 text-pink-700 flex items-center">🏥 From Hospital</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 flex items-center">📍 Nearby</span>
                        )}
                        {amb.id === bestChoiceId && amb.availability && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 flex items-center">
                            <Zap className="w-3 h-3 mr-0.5" /> Best Choice
                          </span>
                        )}
                      </div>
                      {amb.source === 'hospital' && amb.hospitalName && (
                        <div className="text-xs font-semibold text-gray-700 mb-1">🏥 {amb.hospitalName}</div>
                      )}
                      <div className="flex items-center text-xs text-gray-500 bg-gray-100 w-fit px-1.5 py-0.5 rounded mb-1.5">
                        <Users className="w-3 h-3 mr-1" /> Capacity: {amb.capacity}
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="font-bold text-lg text-gray-900">₹{amb.basePrice}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded mt-1 flex items-center ${
                        amb.availability ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {amb.availability ? <><CheckCircle2 className="w-3 h-3 mr-1" />Available</> : 'Busy'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center mt-1 text-sm font-medium">
                    {amb.availability ? (
                      <span className="text-amber-600 flex items-center bg-amber-50 px-1.5 py-0.5 rounded">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {amb.eta ? `${amb.eta} mins away` : 'Calculating...'}
                      </span>
                    ) : (
                      <span className="text-gray-400">Unavailable for {amb.eta} mins</span>
                    )}
                    <span className="text-gray-400 mx-2">•</span>
                    <span className="text-gray-500 text-xs">{amb.distance} km</span>
                  </div>
                  {amb.features && (
                    <p className="text-[10px] text-gray-500 mt-2 truncate">{amb.features.join(' • ')}</p>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Book Button */}
      <AnimatePresence>
        {!bookedAmbulance && selectedId && ambulances.find(a => a.id === selectedId)?.availability && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]"
          >
            <button
              onClick={() => onBook(selectedId)}
              className="w-full bg-red-600 text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center hover:bg-red-700 transition-colors active:scale-[0.98] shadow-lg shadow-red-600/20 tracking-wide"
            >
              <Zap className="w-5 h-5 mr-2" />
              Book {ambulances.find(a => a.id === selectedId)?.type} Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default AmbulanceBottomSheet;
