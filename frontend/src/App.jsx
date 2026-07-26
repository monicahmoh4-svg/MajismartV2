import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CountyOfficerDashboard from './pages/CountyOfficerDashboard';
import OperatorDashboard from './pages/OperatorDashboard';

function DashboardRouter() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  // Route to the correct dashboard based on role
  switch(user.role) {
    case 'admin': return <AdminDashboard />;
    case 'county_officer': return <CountyOfficerDashboard />;
    case 'operator': return <OperatorDashboard />;
    default: return <CitizenDashboard />; // 'citizen' is default
  }
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/app/*" element={<DashboardRouter />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
