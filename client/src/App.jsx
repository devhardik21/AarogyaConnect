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
import DoctorDashboard from './pages/DoctorDashboard';
import LandingPage from './pages/LandingPage';
import BottomNav from './components/BottomNav';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';

function AnimatedRoutes() {
  const location = useLocation();
  const { user } = useAuth();

  const isDoctor = user?.role === 'doctor';

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Auth Routes */}
        <Route path="/login/patient" element={<LoginPatient />} />
        <Route path="/login/doctor" element={<LoginDoctor />} />
        <Route path="/register" element={<InteractiveRegistration />} />
        <Route path="/register/doctor" element={<RegisterDoctor />} />

        {/* Doctor-only Dashboard */}
        <Route
          path="/doctor"
          element={user && isDoctor ? <DoctorDashboard /> : <Navigate to="/login/doctor" />}
        />

        {/* Protected App Routes (patient) */}
        <Route path="/ai-doctor" element={user ? <AIDoctorTab /> : <Navigate to="/login/patient" />} />
        <Route path="/video" element={user ? <VideoDoctorTab /> : <Navigate to="/login/patient" />} />
        <Route path="/vitals" element={user ? <VitalsTab /> : <Navigate to="/login/patient" />} />
        <Route path="/events" element={user ? <EventsTab /> : <Navigate to="/login/patient" />} />
        <Route path="/emergency" element={user ? <EmergencyTab /> : <Navigate to="/login/patient" />} />

        {/* Video Call (both roles) */}
        <Route path="/video-call/:channelId" element={user ? <VideoCall /> : <Navigate to="/login/patient" />} />

        {/* Default redirect based on role */}
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';

  return (
    <Router>
      <div className="fixed inset-0 flex justify-center bg-gradient-to-br from-gray-50 to-gray-200 overflow-hidden">
        <div className="relative w-full max-w-md md:max-w-4xl lg:max-w-6xl h-full bg-white flex flex-col shadow-2xl overflow-hidden transition-all duration-500 ease-in-out md:my-4 md:h-[calc(100%-2rem)] md:rounded-[2rem]">
          <div className="flex-1 overflow-hidden">
            <AnimatedRoutes />
          </div>

          {/* Hide bottom nav for doctors (they have their own dashboard UI) */}
          {user && !isDoctor && <BottomNav />}
        </div>
      </div>
    </Router>
  );
}

export default App;
