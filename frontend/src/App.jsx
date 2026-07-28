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
  
  // ✅ Fallback: Check localStorage if user state is null (race condition fix)
  if (!user) {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      // Token and user exist in localStorage but state hasn't propagated yet
      // Allow access and let the context catch up
      console.log('⚠️ Race condition detected - allowing access based on localStorage')
      return children
    }
    
    return <Navigate to="/login" replace />
  }
  
  return children
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
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
