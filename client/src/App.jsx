import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AIDoctorTab from './pages/AIDoctorTab';
import VideoDoctorTab from './pages/VideoDoctorTab';
import VitalsTab from './pages/VitalsTab';
import EventsTab from './pages/EventsTab';
import EmergencyTab from './pages/EmergencyTab';
import BottomNav from './components/BottomNav';
import { AnimatePresence } from 'framer-motion';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/ai-doctor" element={<AIDoctorTab />} />
        <Route path="/video" element={<VideoDoctorTab />} />
        <Route path="/vitals" element={<VitalsTab />} />
        <Route path="/events" element={<EventsTab />} />
        <Route path="/emergency" element={<EmergencyTab />} />
        <Route path="/" element={<Navigate to="/ai-doctor" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      {/* Full screen container — matches phone frame */}
      <div className="fixed inset-0 flex justify-center bg-gray-200">
        <div className="relative w-full max-w-md h-full bg-white flex flex-col shadow-2xl overflow-hidden">

          {/* Main scrollable area (each tab manages its own scroll) */}
          <div className="flex-1 overflow-hidden">
            <AnimatedRoutes />
          </div>

          {/* Fixed bottom navigation */}
          <BottomNav />
        </div>
      </div>
    </Router>
  );
}

export default App;
