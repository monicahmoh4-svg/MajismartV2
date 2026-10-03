import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardFor } from '../lib/roles'

// Dashboard Components
import AdminDashboard from '../components/dashboards/AdminDashboard'
import CountyDashboard from '../components/dashboards/CountyDashboard'
import OperatorDashboard from '../components/dashboards/OperatorDashboard'
import TechnicianDashboard from '../components/dashboards/TechnicianDashboard'
import CommunityDashboard from '../components/dashboards/CommunityDashboard'
import CitizenDashboard from './CitizenDashboard'

// Role key (from lib/roles dashboardFor) -> component. Every key returned by
// dashboardFor() MUST exist here (verified by consistency test).
const DASHBOARDS = {
  admin: AdminDashboard,
  county: CountyDashboard,
  operator: OperatorDashboard,
  technician: TechnicianDashboard,
  'community-mgr': CommunityDashboard,
  citizen: CitizenDashboard,
  viewer: CitizenDashboard,
}

// Back-compat: old ?view= module URLs redirect into the single /app/*
// navigation. There is exactly one way to reach each module now.
const VIEW_REDIRECTS = {
  gis: '/app/gis',
  assets: '/app/assets',
  reports: '/app/reports',
  'ai-analytics': '/app/ai-analytics',
  workorders: '/app/workorders',
  'reports-citizen': '/app/community-reports',
}

export default function Dashboard() {
  const { user, loading } = useAuth()
  const [searchParams] = useSearchParams()

  if (loading) {
    return (
      <div className="page-loader"><div className="spinner" /></div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const viewMode = searchParams.get('view')
  if (viewMode && VIEW_REDIRECTS[viewMode]) {
    return <Navigate to={VIEW_REDIRECTS[viewMode]} replace />
  }

  const key = dashboardFor(user?.role)
  const Component = DASHBOARDS[key] || CitizenDashboard
  // Viewers are strictly read-only: hide every submit/action affordance.
  return <Component readOnly={key === 'viewer'} />
}
