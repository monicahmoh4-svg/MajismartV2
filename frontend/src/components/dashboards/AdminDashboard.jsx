import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../../api'
import { motion } from 'framer-motion'
import { 
  BarChart3, Users, Droplets, AlertTriangle, TrendingUp, 
  Activity, MapPin, Wallet, FileText, RefreshCw, Map
} from 'lucide-react'
import { StatCard, Loading, ErrorState } from '../ui/StateViews'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/dashboard-stats')
      setData(response)
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading />
  if (error) return <ErrorState error={error} onRetry={fetchData} />

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '24px', 
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
              Admin Dashboard
            </h1>
            <p style={{ margin: 0, fontSize: '15px', color: '#64748b' }}>
              Welcome back, {user?.name || 'Administrator'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard?view=gis')}
              style={{
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
              }}
            >
              <Map style={{ width: '18px', height: '18px' }} />
              GIS Dashboard
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchData}
              style={{
                padding: '12px 20px',
                background: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <RefreshCw style={{ width: '18px', height: '18px' }} />
              Refresh
            </motion.button>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px',
          marginBottom: '24px'
        }}>
          <StatCard
            title="Total Users"
            value={data?.total_users || 0}
            icon={Users}
            color="#0891b2"
            trend={12}
          />
          <StatCard
            title="Active Nodes"
            value={data?.active_nodes || 0}
            icon={Activity}
            color="#10b981"
            trend={5}
          />
          <StatCard
            title="Water Points"
            value={data?.water_points || 0}
            icon={MapPin}
            color="#06b6d4"
            trend={8}
          />
          <StatCard
            title="Active Alerts"
            value={data?.active_alerts || 0}
            icon={AlertTriangle}
            color="#ef4444"
            trend={-3}
          />
        </div>

        {/* Recent Activity */}
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
            Recent Activity
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(data?.recent_activity || []).slice(0, 5).map((activity, i) => (
              <div key={i} style={{ 
                padding: '16px', 
                background: '#f8fafc', 
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                  {activity.description}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
            {(!data?.recent_activity || data.recent_activity.length === 0) && (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
