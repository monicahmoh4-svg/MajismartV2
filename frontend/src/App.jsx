import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Layout from './components/Layout'
import PWAInstallBanner from './components/PWAInstallBanner'

const Nodes = lazy(() => import('./pages/Nodes'))
const NodeDetail = lazy(() => import('./pages/NodeDetail'))
const Payments = lazy(() => import('./pages/Payments'))
const Alerts = lazy(() => import('./pages/Alerts'))
const AIInsights = lazy(() => import('./pages/AIInsights'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Users = lazy(() => import('./pages/Users'))
const Maintenance = lazy(() => import('./pages/Maintenance'))
const Settings = lazy(() => import('./pages/Settings'))
const FindWater = lazy(() => import('./pages/FindWater'))
const MyWater = lazy(() => import('./pages/MyWater'))
const ReportIssue = lazy(() => import('./pages/ReportIssue'))

function LoadingFallback() {
  return (
    <div className="page-loader"><div className="spinner" /></div>
  )
}

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="page-loader"><div className="spinner" /></div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (roles && roles.length) {
    const alias = { admin: 'super_admin', county_officer: 'county_admin', community: 'citizen', community_manager: 'citizen' }
    const role = alias[user.role] || user.role || 'citizen'
    const allowed = roles.map((r) => alias[r] || r)
    if (!allowed.includes(role) && role !== 'super_admin') {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}

function NotFound() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <h2>Page not found</h2>
      <p style={{ color: '#64748b' }}>The water point you are looking for moved.</p>
      <a className="btn btn-primary" href="/dashboard">Back to dashboard</a>
    </div>
  )
}

function AppRoutes() {
  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/find-water" element={<FindWater />} />

        {/* Legacy dashboard (query-param switcher) */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* App shell with role navigation */}
        <Route path="/app" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="nodes" element={<Nodes />} />
          <Route path="nodes/:id" element={<NodeDetail />} />
          <Route path="payments" element={<Payments />} />
          <Route path="my-water" element={<MyWater />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="ai-insights" element={<AIInsights />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="users" element={<Users />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="settings" element={<Settings />} />
          <Route path="report" element={<ReportIssue />} />
        </Route>

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
      </Suspense>
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
