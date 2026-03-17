import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AIDoctorTab from './pages/AIDoctorTab';
import VideoDoctorTab from './pages/VideoDoctorTab';
import VitalsTab from './pages/VitalsTab';
import EventsTab from './pages/EventsTab';
import EmergencyTab from './pages/EmergencyTab';
import LoginPatient from './pages/LoginPatient';
import LoginDoctor from './pages/LoginDoctor';
import VideoCall from './pages/VideoCall';
import InteractiveRegistration from './pages/InteractiveRegistration';
import RegisterDoctor from './pages/RegisterDoctor';
import BottomNav from './components/BottomNav';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';

function AnimatedRoutes() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Auth Routes */}
        <Route path="/login/patient" element={<LoginPatient />} />
        <Route path="/login/doctor" element={<LoginDoctor />} />
        <Route path="/register" element={<InteractiveRegistration />} />
        <Route path="/register/doctor" element={<RegisterDoctor />} />

        {/* Protected App Routes */}
        <Route path="/ai-doctor" element={user ? <AIDoctorTab /> : <Navigate to="/login/patient" />} />
        <Route path="/video" element={user ? <VideoDoctorTab /> : <Navigate to="/login/patient" />} />
        <Route path="/vitals" element={user ? <VitalsTab /> : <Navigate to="/login/patient" />} />
        <Route path="/events" element={user ? <EventsTab /> : <Navigate to="/login/patient" />} />
        <Route path="/emergency" element={user ? <EmergencyTab /> : <Navigate to="/login/patient" />} />

        {/* Special Video Call route (dynamic ID) */}
        <Route path="/video-call/:channelId" element={user ? <VideoCall /> : <Navigate to="/login/patient" />} />

        <Route path="/" element={<Navigate to={user ? "/ai-doctor" : "/login/patient"} replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="fixed inset-0 flex justify-center bg-gray-200">
        <div className="relative w-full max-w-md h-full bg-white flex flex-col shadow-2xl overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <AnimatedRoutes />
          </div>

          {/* Only show bottom nav if logged in and not in a call */}
          {user && <BottomNav />}
        </div>
      </div>
    </Router>
  );
}

export default App;
