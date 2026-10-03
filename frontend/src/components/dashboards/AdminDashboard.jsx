import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../../api'
import { motion } from 'framer-motion'
import {
  Users, Activity, MapPin, AlertTriangle, Wallet,
  FileText, RefreshCw, Map, TrendingUp, TrendingDown,
  CheckCircle, Clock, BarChart3, Package, MessageSquare, Brain, Wrench
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
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
  const [health, setHealth] = useState(null)
  const [revenue14d, setRevenue14d] = useState([])
  const [critical, setCritical] = useState([])
  const [pendingVendors, setPendingVendors] = useState([])
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
      const [stats, h, rev, critAlerts, vendors] = await Promise.all([
        api.get('/admin/dashboard-stats'),
        api.get('/health').catch(() => null),
        api.get('/dashboard/revenue-chart?days=14').catch(() => []),
        api.get('/alerts?resolved=false&severity=critical&limit=5').catch(() => []),
        api.get('/wasreb/vendors').catch(() => []),
      ])
      setData(stats)
      setHealth(h && h.service ? h : null)
      setRevenue14d(Array.isArray(rev) ? rev : [])
      setCritical(critAlerts || [])
      setPendingVendors((Array.isArray(vendors) ? vendors : []).filter(v => v.status === 'pending'))
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
            <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800' }}>Admin Dashboard</h1>
            <p style={{ margin: 0, fontSize: '15px', opacity: 0.95 }}>Welcome back, {user?.name || 'Administrator'} • {user?.county || 'System-wide'}</p>
            {lastUpdated && <p style={{ margin: '8px 0 0 0', fontSize: '12px', opacity: 0.8 }}>Last updated: {lastUpdated.toLocaleTimeString()}</p>}
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/app/workorders')}
              style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' }}>
              <Wrench size={18} /> Work Orders
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/app/ai-analytics')}
              style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #8b5cf6, #a855f7)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }}>
              <Brain size={18} /> AI Analytics
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/app/reports')}
              style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)' }}>
              <MessageSquare size={18} /> Reports
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/app/assets')}
              style={{ padding: '12px 20px', background: 'white', color: '#0891b2', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <Package size={18} /> Assets
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/app/gis')}
              style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', backdropFilter: 'blur(10px)' }}>
              <Map size={18} /> GIS Dashboard
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={fetchData} disabled={loading}
              style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', backdropFilter: 'blur(10px)' }}>
              <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
            </motion.button>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <StatCard title="Total Users" value={data?.total_users || 0} icon={Users} color="#0891b2" />
          <StatCard title="Active Nodes" value={data?.active_nodes || 0} icon={Activity} color="#10b981" />
          <StatCard title="Water Points" value={data?.water_points || 0} icon={MapPin} color="#06b6d4" />
          <StatCard title="Active Alerts" value={data?.active_alerts || 0} icon={AlertTriangle} color="#ef4444" />
          <StatCard title="Total Reports" value={data?.total_reports || 0} icon={FileText} color="#8b5cf6" />
          <StatCard title="Monthly Revenue" value={`KES ${(data?.monthly_revenue || 0).toLocaleString()}`} icon={Wallet} color="#f59e0b" />
        </div>

        {(() => {
          const dbUp = health ? health.db === 'up' : (data?.system_health !== 'down');
          const tone = dbUp ? { bg: '#d1fae5', iconBg: '#d1fae5', icon: '#10b981', border: '#d1fae5' }
                            : { bg: '#fef2f2', iconBg: '#fecaca', icon: '#dc2626', border: '#fecaca' };
          return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'white', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '16px', border: `1px solid ${tone.border}` }}>
          <div style={{ width: '48px', height: '48px', background: tone.iconBg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={24} color={tone.icon} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
              System Status: {dbUp ? 'Operational' : 'Degraded — database unreachable'}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              API {health?.version ? `v${health.version}` : ''} · Database {health?.database?.host || 'unknown host'}
              {health?.database?.repaired ? ' (auto-repaired host)' : ''} · Checked {new Date().toLocaleString()}
            </p>
          </div>
        </motion.div>
          );
        })()}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Revenue — last 14 days</h2>
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#64748b' }}>M-Pesa collections across all counties</p>
            {revenue14d.length === 0 ? (
              <p style={{ fontSize: '14px', color: '#94a3b8' }}>No completed payments in this window yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenue14d.map(d => ({ day: new Date(d.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }), revenue: Number(d.revenue) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`Ksh ${Number(v).toLocaleString()}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#0891b2" fill="#0891b2" fillOpacity={0.18} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} color="#dc2626" /> Needs your attention
            </h2>
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#64748b' }}>Critical alerts and vendor permits awaiting decision</p>
            {critical.length === 0 && pendingVendors.length === 0 && (
              <p style={{ fontSize: '14px', color: '#94a3b8' }}>All clear — nothing critical pending.</p>
            )}
            {critical.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
                <AlertTriangle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#0f172a' }}>{a.node_name || 'System'}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{a.message}</div>
                </div>
              </div>
            ))}
            {pendingVendors.length > 0 && (
              <div style={{ marginTop: 8, padding: '12px 14px', background: '#fef3d8', borderRadius: 10, fontSize: '13px', color: '#92400e' }}>
                <strong>{pendingVendors.length}</strong> vendor permit{pendingVendors.length === 1 ? '' : 's'} awaiting approval
                ({pendingVendors.slice(0, 3).map(v => v.county).filter(Boolean).join(', ') || 'various counties'}).
              </div>
            )}
          </motion.div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '40px', height: '40px', background: '#eff6ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} color="#0891b2" />
              </div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Recent Activity</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(data?.recent_activity || []).length > 0 ? (
                data.recent_activity.slice(0, 6).map((activity, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', background: activity.type === 'alert' ? '#fef2f2' : '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {activity.type === 'alert' ? <AlertTriangle size={16} color="#ef4444" /> : <FileText size={16} color="#0891b2" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.description}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{new Date(activity.timestamp).toLocaleString()}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 20px', background: '#f8fafc', borderRadius: '10px' }}>
                  <Clock size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '14px' }}>No recent activity</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '40px', height: '40px', background: '#f0fdf4', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart3 size={20} color="#10b981" />
              </div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>County Distribution</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(data?.county_distribution || []).length > 0 ? (
                data.county_distribution.slice(0, 6).map((county, i) => {
                  const maxCount = Math.max(...data.county_distribution.map(c => c.count))
                  const percentage = (county.count / maxCount) * 100
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{county.county}</span>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#0891b2' }}>{county.count} nodes</span>
                      </div>
                      <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} style={{ height: '100%', background: 'linear-gradient(90deg, #0891b2, #06b6d4)', borderRadius: '4px' }} />
                      </div>
                    </div>
                  )
                })
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 20px', background: '#f8fafc', borderRadius: '10px' }}>
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
