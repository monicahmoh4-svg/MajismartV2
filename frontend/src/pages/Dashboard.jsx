import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardFor, normalizeUiRole } from '../lib/roles'

// Dashboard Components
import AdminDashboard from '../components/dashboards/AdminDashboard'
import CountyDashboard from '../components/dashboards/CountyDashboard'
import OperatorDashboard from '../components/dashboards/OperatorDashboard'
import TechnicianDashboard from '../components/dashboards/TechnicianDashboard'
import CommunityDashboard from '../components/dashboards/CommunityDashboard'
import CitizenDashboard from './CitizenDashboard'

// Enterprise Modules
import GISDashboard from './GISDashboard'
import AssetManagement from './AssetManagement'
import ReportManagement from './ReportManagement'
import CitizenReports from './CitizenReports'
import AIAnalyticsDashboard from './AIAnalyticsDashboard'
import WorkOrderManagement from './WorkOrderManagement'

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

  if (viewMode === 'reports-citizen') {
    return <CitizenReports />
  }

  // Enterprise module views: staff with operational scope only.
  // Roles are normalized so canonical (super_admin/county_admin) and legacy
  // (admin/county_officer) role names both pass.
  const authorizedRoles = ['admin', 'county_officer', 'operator']
  const uiRole = normalizeUiRole(user?.role)

  if (viewMode && authorizedRoles.includes(uiRole)) {
    switch (viewMode) {
      case 'gis':
        return <GISDashboard />
      case 'assets':
        return <AssetManagement />
      case 'reports':
        return <ReportManagement />
      case 'ai-analytics':
        return <AIAnalyticsDashboard />
      case 'workorders':
        return <WorkOrderManagement />
      default:
        break
    }
  }

  const key = dashboardFor(user?.role)
  const Component = DASHBOARDS[key] || CitizenDashboard
  // Viewers are strictly read-only: hide every submit/action affordance.
  return <Component readOnly={key === 'viewer'} />
}
