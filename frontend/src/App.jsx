import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// LANDING & AUTH
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'

// APP PAGES
import Dashboard from './pages/Dashboard'
import Nodes from './pages/Nodes'
import NodeDetail from './pages/NodeDetail'
import Payments from './pages/Payments'
import Alerts from './pages/Alerts'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Users from './pages/Users'
import Maintenance from './pages/Maintenance'
import AIInsights from './pages/AIInsights'

import Layout from './components/Layout'

function PrivateRoute({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/app/dashboard" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* PROTECTED APP ROUTES */}
          <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard"   element={<Dashboard />} />
            <Route path="nodes"       element={<Nodes />} />
            <Route path="nodes/:id"   element={<NodeDetail />} />
            <Route path="payments"    element={<Payments />} />
            <Route path="alerts"      element={<Alerts />} />
            <Route path="ai-insights" element={<AIInsights />} />
            <Route path="analytics"   element={<PrivateRoute roles={['admin','county_officer']}><Analytics /></PrivateRoute>} />
            <Route path="users"       element={<PrivateRoute roles={['admin']}><Users /></PrivateRoute>} />
            <Route path="maintenance" element={<PrivateRoute roles={['operator','admin']}><Maintenance /></PrivateRoute>} />
            <Route path="settings"    element={<Settings />} />
          </Route>

          {/* CATCH ALL */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
