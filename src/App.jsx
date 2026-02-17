import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import PortalLogin from './pages/portal/PortalLogin';
import PortalDashboard from './pages/portal/PortalDashboard';
import EmergencyView from './pages/EmergencyView';
import DoctorPortal from './pages/doctor/DoctorPortal';
import SecretaryAppointmentsPage from './pages/doctor/SecretaryAppointmentsPage';
import DoctorLogin from './pages/doctor/DoctorLogin';
import DoctorSignup from './pages/doctor/DoctorSignup';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* Main Doctor Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Citizen Portal */}
        <Route path="/portal" element={<PortalLogin />} />
        <Route path="/portal/home" element={<PortalDashboard />} />

        {/* Public Emergency Profile (QR Access) */}
        <Route path="/perfil-emergencia/:token" element={<EmergencyView />} />

        {/* Doctor Portal Routes (Multi-tenant) */}
        <Route path="/doctor-login" element={<DoctorLogin />} />
        <Route path="/doctor-signup" element={<DoctorSignup />} />
        <Route path="/doctor-portal" element={<DoctorPortal />} />
        <Route path="/doctor-portal/appointments" element={<SecretaryAppointmentsPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
