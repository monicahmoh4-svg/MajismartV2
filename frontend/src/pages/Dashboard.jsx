import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Dashboard Components
import AdminDashboard from '../components/dashboards/AdminDashboard'
import CountyDashboard from '../components/dashboards/CountyDashboard'
import OperatorDashboard from '../components/dashboards/OperatorDashboard'
import CommunityDashboard from '../components/dashboards/CommunityDashboard'

// The new, fully animated Citizen Dashboard
import CitizenDashboard from './CitizenDashboard'

export default function Dashboard() {
  const { user, loading } = useAuth()
  
  // Show loading state while checking auth
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #0891b2', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Route to the correct dashboard based on role
  // Defaults to CitizenDashboard if role is missing or unrecognized
  const dashboards = {
    admin: <AdminDashboard />,
    county_officer: <CountyDashboard />,
    operator: <OperatorDashboard />,
    community: <CitizenDashboard />,       // Community Members get the Citizen Dashboard
    community_manager: <CommunityDashboard />, // Separate role for managers, if needed
  }
  
  return dashboards[user?.role] || <CitizenDashboard />
}
