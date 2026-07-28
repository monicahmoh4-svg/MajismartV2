import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import PWAInstallBanner from './components/PWAInstallBanner'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '4px solid #e2e8f0', 
          borderTop: '4px solid #0891b2', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite' 
        }}></div>
      </div>
    )
  }
  
  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  // User is authenticated, show the protected content
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  
  // If already authenticated, redirect to dashboard
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        
        {/* Public routes - redirect to dashboard if already logged in */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        
        {/* Protected route - redirect to login if not authenticated */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <PWAInstallBanner />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}
