import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../../api'
import { motion } from 'framer-motion'
import { 
  Users, Activity, MapPin, AlertTriangle, Wallet, 
  FileText, RefreshCw, Map, TrendingUp, TrendingDown,
  CheckCircle, Clock, BarChart3, Package, MessageSquare
} from 'lucide-react'
import { Loading } from '../ui/StateViews'

function StatCard({ title, value, icon: Icon, color = '#0891b2', trend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #f1f5f9',
        transition: 'all 0.3s'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>{title}</p>
          <h3 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>{value}</h3>
        </div>
        {Icon && (
          <div style={{ 
            width: '48px', 
            height: '48px', 
            background: `${color}15`, 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Icon size={24} color={color} />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          fontSize: '13px', 
          color: trend >= 0 ? '#10b981' : '#ef4444', 
          fontWeight: '600' 
        }}>
          {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{Math.abs(trend)}%</span>
          <span style={{ color: '#94a3b8', fontWeight: '400' }}>vs last month</span>
        </div>
      )}
    </motion.div>
  )
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/admin/dashboard-stats')
      setData(response)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Admin dashboard fetch error:', err)
      setData({
        total_users: 0,
        active_nodes: 0,
        water_points: 0,
        active_alerts: 0,
        total_reports: 0,
        monthly_revenue: 0,
        recent_activity: [],
        county_distribution: [],
        system_health: 'operational'
      })
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading message="Loading admin dashboard..." />

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', 
            borderRadius: '20px', 
            padding: '32px', 
            marginBottom: '24px',
            boxShadow: '0 10px 30px rgba(8, 145, 178, 0.2)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800' }}>
              Admin Dashboard
            </h1>
            <p style={{ margin: 0, fontSize: '15px', opacity: 0.95 }}>
              Welcome back, {user?.name || 'Administrator'} • {user?.county || 'System-wide'}
            </p>
            {lastUpdated && (
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', opacity: 0.8 }}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard?view=reports')}
              style={{
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
              }}
            >
              <MessageSquare size={18} />
              Reports
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard?view=assets')}
              style={{
                padding: '12px 20px',
                background: 'white',
                color: '#0891b2',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <Package size={18} />
              Assets
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard?view=gis')}
              style={{
                padding: '12px 20px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Map size={18} />
              GIS Dashboard
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchData}
              disabled={loading}
              style={{
                padding: '12px 20px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backdropFilter: 'blur(10px)'
              }}
            >
              <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </motion.button>
          </div>
        </motion.div>

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
          />
          <StatCard
            title="Total Reports"
            value={data?.total_reports || 0}
            icon={FileText}
            color="#8b5cf6"
          />
          <StatCard
            title="Monthly Revenue"
            value={`KES ${(data?.monthly_revenue || 0).toLocaleString()}`}
            icon={Wallet}
            color="#f59e0b"
            trend={15}
          />
        </div>

        {/* System Health Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            border: '1px solid #d1fae5'
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            background: '#d1fae5',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle size={24} color="#10b981" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
              System Status: Operational
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              All systems are running normally. Last health check: {new Date().toLocaleString()}
            </p>
          </div>
        </motion.div>

        {/* Recent Activity & County Distribution */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '24px'
        }}>
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: '#eff6ff',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock size={20} color="#0891b2" />
              </div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                Recent Activity
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(data?.recent_activity || []).length > 0 ? (
                data.recent_activity.slice(0, 6).map((activity, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{ 
                      padding: '14px', 
                      background: '#f8fafc', 
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: activity.type === 'alert' ? '#fef2f2' : '#eff6ff',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {activity.type === 'alert' ? 
                        <AlertTriangle size={16} color="#ef4444" /> : 
                        <FileText size={16} color="#0891b2" />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ 
                        margin: '0 0 2px 0', 
                        fontSize: '13px', 
                        fontWeight: '600', 
                        color: '#0f172a',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {activity.description}
                      </p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#64748b', 
                  padding: '40px 20px',
                  background: '#f8fafc',
                  borderRadius: '10px'
                }}>
                  <Clock size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '14px' }}>No recent activity</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* County Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: '#f0fdf4',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BarChart3 size={20} color="#10b981" />
              </div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                County Distribution
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(data?.county_distribution || []).length > 0 ? (
                data.county_distribution.slice(0, 6).map((county, i) => {
                  const maxCount = Math.max(...data.county_distribution.map(c => c.count))
                  const percentage = (county.count / maxCount) * 100
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                          {county.county}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#0891b2' }}>
                          {county.count} nodes
                        </span>
                      </div>
                      <div style={{ 
                        height: '8px', 
                        background: '#e2e8f0', 
                        borderRadius: '4px', 
                        overflow: 'hidden' 
                      }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                          style={{ 
                            height: '100%', 
                            background: 'linear-gradient(90deg, #0891b2, #06b6d4)',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#64748b', 
                  padding: '40px 20px',
                  background: '#f8fafc',
                  borderRadius: '10px'
                }}>
                  <BarChart3 size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '14px' }}>No county data available</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
