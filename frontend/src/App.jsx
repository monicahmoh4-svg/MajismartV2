import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { normalizeUiRole } from './lib/roles'
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
const CitizenReports = lazy(() => import('./pages/CitizenReports'))
const CommunityReports = lazy(() => import('./pages/CommunityReports'))
const ReportManagement = lazy(() => import('./pages/ReportManagement'))
const AssetManagement = lazy(() => import('./pages/AssetManagement'))
const GISDashboard = lazy(() => import('./pages/GISDashboard'))
const AIAnalyticsDashboard = lazy(() => import('./pages/AIAnalyticsDashboard'))
const WorkOrderManagement = lazy(() => import('./pages/WorkOrderManagement'))

// UI-role based access: null = any authenticated user.
// Roles: admin, county_officer, operator, technician, community, viewer
// (canonical backend roles are normalized via lib/roles, so super_admin etc.
 // automatically land on their UI equivalent).
const ROUTE_ROLES = {
  users: ['admin', 'county_officer'],
  maintenance: ['admin', 'county_officer', 'operator', 'technician'],
  workorders: ['admin', 'county_officer', 'operator'],
  'ai-insights': ['admin', 'county_officer', 'operator'],
  'ai-analytics': ['admin', 'county_officer', 'operator'],
  analytics: ['admin', 'county_officer', 'viewer'],
  reports: ['admin', 'county_officer'],
  'field-reports': ['admin', 'county_officer', 'operator'],
  'community-reports': ['community', 'admin', 'county_officer'],
  assets: ['admin', 'county_officer'],
  gis: ['admin', 'county_officer'],
  report: ['admin', 'county_officer', 'operator', 'technician', 'community'],
}

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
    const role = normalizeUiRole(user.role)
    // System admin sees everything, even where not explicitly listed.
    if (role !== 'admin' && !roles.includes(role)) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}

function RoleRoute({ element, roles }) {
  return <ProtectedRoute roles={roles}>{element}</ProtectedRoute>
}

function NotFound() {
  return (
    <div className="notfound">
      <h2>Page not found</h2>
      <p>The water point you are looking for moved.</p>
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

        {/* Legacy dashboard URL now lives inside the app shell */}
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />

        {/* Role-based app shell */}
        <Route path="/app" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="nodes" element={<Nodes />} />
          <Route path="nodes/:id" element={<NodeDetail />} />
          <Route path="payments" element={<Payments />} />
          <Route path="my-water" element={<RoleRoute element={<MyWater />} roles={null} />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="ai-insights" element={<RoleRoute element={<AIInsights />} roles={ROUTE_ROLES['ai-insights']} />} />
          <Route path="analytics" element={<RoleRoute element={<Analytics />} roles={ROUTE_ROLES.analytics} />} />
          <Route path="users" element={<RoleRoute element={<Users />} roles={ROUTE_ROLES.users} />} />
          <Route path="maintenance" element={<RoleRoute element={<Maintenance />} roles={ROUTE_ROLES.maintenance} />} />
          <Route path="workorders" element={<RoleRoute element={<WorkOrderManagement />} roles={ROUTE_ROLES.workorders} />} />
          <Route path="reports" element={<RoleRoute element={<ReportManagement />} roles={ROUTE_ROLES.reports} />} />
          <Route path="field-reports" element={<RoleRoute element={<CommunityReports />} roles={ROUTE_ROLES['field-reports']} />} />
          <Route path="community-reports" element={<RoleRoute element={<CitizenReports />} roles={ROUTE_ROLES['community-reports']} />} />
          <Route path="assets" element={<RoleRoute element={<AssetManagement />} roles={ROUTE_ROLES.assets} />} />
          <Route path="gis" element={<RoleRoute element={<GISDashboard />} roles={ROUTE_ROLES.gis} />} />
          <Route path="ai-analytics" element={<RoleRoute element={<AIAnalyticsDashboard />} roles={ROUTE_ROLES['ai-analytics']} />} />
          <Route path="settings" element={<Settings />} />
          <Route path="report" element={<RoleRoute element={<ReportIssue />} roles={ROUTE_ROLES.report} />} />
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
