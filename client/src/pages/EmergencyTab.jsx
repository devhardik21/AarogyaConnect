// ─── Emergency Tab (Ambulance Module) ────────────────────────────────────────
// Replaces the old placeholder. Full ambulance booking UI integrated from
// ambulance/client/src/App.jsx.
//
// Key integration points:
//  • useAuth()  — reads the logged-in user & token from the main app's AuthContext
//  • config.js  — reads API_BASE_URL so calls go to the unified backend
//  • No standalone CSS imported — all styles are Tailwind classes
//  • The component renders inside the main app's 60vh content area,
//    so the root div uses h-full instead of h-screen.

import React, { useEffect, useState } from 'react';
import AmbulanceMap from '../components/emergency/AmbulanceMap';
import AmbulanceBottomSheet from '../components/emergency/AmbulanceBottomSheet';
import { BellRing, MapPin, PhoneCall } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  generateDummyAmbulances,
  updateAmbulanceLocationsSimulated,
  calculateDistance,
  repositionAmbulance
} from '../utils/dummyGenerator';
import { useAuth } from '../context/AuthContext';
import config from '../config';

// ─── Constants ────────────────────────────────────────────────────────────────
const API = `${config.API_BASE_URL}/api/emergency`;

export default function EmergencyTab() {
  // ─── Main App Auth Context ───────────────────────────────────────────────
  const { user, token } = useAuth();

  // ─── State ───────────────────────────────────────────────────────────────
  const [userLocation, setUserLocation] = useState(null);
  const [ambulances, setAmbulances] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [bookedAmbulance, setBookedAmbulance] = useState(null);
  const [address, setAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(true);

  // ─── Geolocation ─────────────────────────────────────────────────────────
  useEffect(() => {
    let watchId;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          fetchAddress(loc);
          initAmbulancesAndHospitals(loc);
        },
        () => {
          showNotification('Please enable location services. Using default location.', 'error');
          setLoading(false);
          const fallback = { lat: 28.6139, lng: 77.2090 };
          setUserLocation(fallback);
          fetchAddress(fallback);
          initAmbulancesAndHospitals(fallback);
        }
      );

      watchId = navigator.geolocation.watchPosition(
        position => {
          const newLoc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(prev => {
            if (prev) {
              const dist = calculateDistance(prev.lat, prev.lng, newLoc.lat, newLoc.lng);
              if (dist >= 0.5) {
                fetchHospitals(newLoc).then(newHospitals => {
                  setHospitals(newHospitals);
                  const freshAmbs = generateDummyAmbulances(newLoc.lat, newLoc.lng, newHospitals);
                  setAmbulances(prevAmbs => {
                    const active = prevAmbs.filter(a => a.isBookedActive);
                    let updated = [...active, ...freshAmbs.filter(f => !active.some(a => a.id === f.id))];
                    updated = updated.filter(a => a.isBookedActive || (parseFloat(a.distance) <= 15 && a.eta <= 60));
                    localStorage.setItem('ambulances', JSON.stringify(updated));
                    return updated;
                  });
                });
                fetchAddress(newLoc);
              }
            }
            return newLoc;
          });
        },
        err => console.error('Location watch error:', err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    } else {
      showNotification('Geolocation is not supported by this browser.', 'error');
      setLoading(false);
    }

    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, []);

  // ─── Simulate ambulance movement while booking is active ─────────────────
  useEffect(() => {
    if (bookedAmbulance && userLocation) {
      const interval = setInterval(() => {
        setAmbulances(prev => {
          const updated = updateAmbulanceLocationsSimulated(prev, userLocation.lat, userLocation.lng);
          localStorage.setItem('ambulances', JSON.stringify(updated));
          const current = updated.find(a => a.id === bookedAmbulance.id);
          if (current) setBookedAmbulance(current);
          return updated;
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [bookedAmbulance, userLocation]);

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const initAmbulancesAndHospitals = async location => {
    setLoading(true);
    try {
      const savedAmbs = localStorage.getItem('ambulances');
      const savedBooking = localStorage.getItem('bookedAmbulance');
      const savedHosps = localStorage.getItem('hospitals');

      let currentHospitals = [];
      if (savedHosps) {
        currentHospitals = JSON.parse(savedHosps);
        setHospitals(currentHospitals);
      } else {
        currentHospitals = await fetchHospitals(location);
        setHospitals(currentHospitals);
      }

      if (savedAmbs) {
        let parsed = JSON.parse(savedAmbs);
        const savedBookingParsed = savedBooking ? JSON.parse(savedBooking) : null;
        parsed = parsed.map(amb => {
          const dist = calculateDistance(location.lat, location.lng, amb.location.lat, amb.location.lng);
          if (dist < 0.5 && (!savedBookingParsed || savedBookingParsed.id !== amb.id)) {
            return repositionAmbulance(amb, location.lat, location.lng);
          }
          return amb;
        });
        parsed = parsed.filter(a => parseFloat(a.distance) <= 15 && a.eta <= 60);
        setAmbulances(parsed);
        localStorage.setItem('ambulances', JSON.stringify(parsed));
      } else {
        let fresh = generateDummyAmbulances(location.lat, location.lng, currentHospitals);
        fresh = fresh.filter(a => parseFloat(a.distance) <= 15 && a.eta <= 60);
        setAmbulances(fresh);
        localStorage.setItem('ambulances', JSON.stringify(fresh));
      }

      if (savedBooking) {
        const b = JSON.parse(savedBooking);
        setBookedAmbulance(b);
        setSelectedId(b.id);
      }
    } catch (e) {
      console.error('Error loading ambulance state', e);
    }
    setLoading(false);
  };

  const fetchHospitals = async location => {
    try {
      // Use Nominatim (OSM) for hospital search — no token required
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=hospital&lat=${location.lat}&lon=${location.lng}&limit=10`;
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.length > 0) {
        let parsed = data.map((d, i) => ({
          id: `HOSP_${i}`,
          name: d.display_name.split(',')[0] || 'City Hospital',
          location: { lat: parseFloat(d.lat), lng: parseFloat(d.lon) }
        }));
        parsed = parsed.filter(h => {
          if (!h.location.lat || !h.location.lng) return false;
          return calculateDistance(location.lat, location.lng, h.location.lat, h.location.lng) <= 15;
        });
        if (parsed.length > 0) {
          localStorage.setItem('hospitals', JSON.stringify(parsed));
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to fetch hospitals', e);
    }
    const fallback = [
      { id: 'HOSP_FB_1', name: 'Sector 9 Hospital Bhilai', location: { lat: 21.21, lng: 81.36 } },
      { id: 'HOSP_FB_2', name: 'Jawaharlal Nehru Hospital Durg', location: { lat: 21.19, lng: 81.28 } },
      { id: 'HOSP_FB_3', name: 'Shri Shankaracharya Hospital', location: { lat: 21.24, lng: 81.35 } }
    ];
    localStorage.setItem('hospitals', JSON.stringify(fallback));
    return fallback;
  };

  const fetchAddress = async location => {
    setAddressLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data?.address) {
        const addr = data.address;
        let short = '';
        if (addr.amenity || addr.building) short += (addr.amenity || addr.building) + ', ';
        if (addr.road) short += addr.road + ', ';
        if (addr.neighbourhood || addr.suburb) short += (addr.neighbourhood || addr.suburb) + ', ';
        if (addr.city || addr.town || addr.village) short += (addr.city || addr.town || addr.village);
        short = short.replace(/,\s*$/, '');
        if (!short || short.length < 5) short = data.display_name.split(',').slice(0, 3).join(',');
        setAddress(short);
      } else {
        setAddress('Location found');
      }
    } catch { setAddress(null); }
    setAddressLoading(false);
  };

  // ─── Booking Handlers ─────────────────────────────────────────────────────
  const handleBook = ambulanceId => {
    const amb = ambulances.find(a => a.id === ambulanceId);
    if (!amb || !amb.availability) {
      showNotification('This ambulance is no longer available.', 'error');
      return;
    }
    const updated = ambulances.map(a =>
      a.id === ambulanceId ? { ...a, availability: false, isBookedActive: true } : a
    );
    setAmbulances(updated);
    const booked = updated.find(a => a.id === ambulanceId);
    setBookedAmbulance(booked);
    localStorage.setItem('ambulances', JSON.stringify(updated));
    localStorage.setItem('bookedAmbulance', JSON.stringify(booked));
    showNotification('Ambulance booked successfully! The driver is on their way.', 'success');
  };

  const handleCancel = () => {
    if (!bookedAmbulance) return;
    const updated = ambulances.map(a =>
      a.id === bookedAmbulance.id ? repositionAmbulance(a, userLocation.lat, userLocation.lng) : a
    );
    setAmbulances(updated);
    setBookedAmbulance(null);
    setSelectedId(null);
    localStorage.setItem('ambulances', JSON.stringify(updated));
    localStorage.removeItem('bookedAmbulance');
    showNotification('Booking cancelled successfully.', 'success');
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full bg-gray-50 overflow-hidden font-sans">

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg flex items-center max-w-[90%]
              ${notification.type === 'error'
                ? 'bg-red-50 text-red-600 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'}`}
          >
            <BellRing className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">
              {notification.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location Header */}
      <div className="absolute top-0 w-full z-10 pt-3 pb-10 px-4 bg-gradient-to-b from-white/90 via-white/50 to-transparent pointer-events-none">
        <div className="bg-white px-4 py-2.5 rounded-2xl shadow-lg border border-gray-100 flex items-center pointer-events-auto">
          <div className="bg-gray-100 p-2 rounded-full mr-3 border border-gray-200">
            <MapPin className="w-4 h-4 text-gray-700" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Current Location</span>
            {addressLoading && !address ? (
              <div className="h-3 bg-gray-200 animate-pulse rounded w-3/4 mt-1"></div>
            ) : (
              <span className="font-bold text-gray-900 text-xs truncate">
                {address || `${userLocation?.lat.toFixed(4)}, ${userLocation?.lng.toFixed(4)}`}
              </span>
            )}
          </div>
          {/* Welcome message using main app's auth */}
          {user && (
            <span className="text-xs text-gray-500 font-medium flex-shrink-0 ml-2">
              Hi, {user.name?.split(' ')[0]}
            </span>
          )}
        </div>
      </div>

      {/* 108 Emergency Call Button */}
      <a
        href="tel:108"
        className="absolute top-20 right-4 z-20 bg-gradient-to-br from-red-500 to-red-600 text-white px-3 py-2.5 rounded-2xl shadow-xl shadow-red-600/30 border-2 border-white flex flex-col items-center justify-center hover:scale-105 active:scale-95 transition-all"
      >
        <PhoneCall className="w-5 h-5 mb-1 animate-pulse" />
        <span className="font-black text-xl leading-none tracking-tight">108</span>
        <span className="text-[9px] uppercase font-bold tracking-widest mt-1 opacity-90">Govt Free</span>
      </a>

      {/* Map */}
      <AmbulanceMap
        userLocation={userLocation}
        ambulances={ambulances}
        hospitals={hospitals}
        selectedAmbulance={selectedId}
      />

      {/* Bottom Sheet */}
      <AnimatePresence>
        <AmbulanceBottomSheet
          ambulances={ambulances}
          loading={loading}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          userLocation={userLocation}
          onBook={handleBook}
          bookedAmbulance={bookedAmbulance}
          onCancelRequest={handleCancel}
        />
      </AnimatePresence>
    </div>
  );
}
