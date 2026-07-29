import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Dashboard Components
import AdminDashboard from '../components/dashboards/AdminDashboard'
import CountyDashboard from '../components/dashboards/CountyDashboard'
import OperatorDashboard from '../components/dashboards/OperatorDashboard'
import CommunityDashboard from '../components/dashboards/CommunityDashboard'
import CitizenDashboard from './CitizenDashboard'

// Enterprise Modules
import GISDashboard from './GISDashboard'
import AssetManagement from './AssetManagement'
import ReportManagement from './ReportManagement'
import CitizenReports from './CitizenReports'

export default function Dashboard() {
  const { user, loading } = useAuth()
  const [searchParams] = useSearchParams()
  
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #0891b2', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const dashboards = {
    admin: <AdminDashboard />,
    county_officer: <CountyDashboard />,
    operator: <OperatorDashboard />,
    community: <CitizenDashboard />,
    community_manager: <CommunityDashboard />,
  }
  
  const viewMode = searchParams.get('view')
  
  if (viewMode === 'reports-citizen') {
    return <CitizenReports />
  }
  
  const authorizedRoles = ['admin', 'county_officer', 'operator']
  
  if (viewMode && authorizedRoles.includes(user?.role)) {
    switch (viewMode) {
      case 'gis':
        return <GISDashboard />
      case 'assets':
        return <AssetManagement />
      case 'reports':
        return <ReportManagement />
      default:
        break
    }
  }
  
  return dashboards[user?.role] || <CitizenDashboard />
}
