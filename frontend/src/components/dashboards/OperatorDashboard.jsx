import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../../api'
import { motion } from 'framer-motion'
import { 
  Activity, MapPin, AlertTriangle, 
  RefreshCw, Map, FileText, Wrench, Package, MessageSquare, Brain
} from 'lucide-react'
import { Loading } from '../ui/StateViews'

function StatCard({ title, value, icon: Icon, color = '#0891b2' }) {
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
        border: '1px solid #f1f5f9'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>{title}</p>
          <h3 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>{value}</h3>
        </div>
        {Icon && (
          <div style={{ width: '48px', height: '48px', background: `${color}15`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={24} color={color} />
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function OperatorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [nodes, setNodes] = useState([])
  const [alerts, setAlerts] = useState([])
  const [resolving, setResolving] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const q = user?.county ? `?county=${encodeURIComponent(user.county)}` : ''
      const [stats, n, a] = await Promise.all([
        api.get('/operator/dashboard-stats'),
        api.get(`/nodes${q}`).catch(() => []),
        api.get('/alerts?resolved=false&limit=10').catch(() => []),
      ])
      setData(stats)
      setNodes(Array.isArray(n) ? n : [])
      setAlerts(Array.isArray(a) ? a.filter(x => !user?.county || !x.county || x.county === user.county) : [])
    } catch (err) {
      console.error('Operator dashboard fetch error:', err)
      setData({ water_points: 0, active_nodes: 0, active_alerts: 0, work_orders: 0, maintenance_tasks: 0 })
    } finally {
      setLoading(false)
    }
  }

  const resolveAlert = async (id) => {
    setResolving(id)
    try {
      await api.patch(`/alerts/${id}/resolve`, {})
      setAlerts(list => list.filter(a => a.id !== id))
    } catch (e) { console.error('Resolve failed:', e.message) }
    finally { setResolving(null) }
  }

  if (loading) return <Loading message="Loading operator dashboard..." />

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
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800' }}>Operator Dashboard</h1>
            <p style={{ margin: 0, fontSize: '15px', opacity: 0.95 }}>Welcome back, {user?.name || 'Operator'}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/dashboard?view=workorders')}
              style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' }}>
              <Wrench size={18} /> Work Orders
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/dashboard?view=ai-analytics')}
              style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #8b5cf6, #a855f7)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }}>
              <Brain size={18} /> AI Analytics
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/dashboard?view=reports')}
              style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)' }}>
              <MessageSquare size={18} /> Reports
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/dashboard?view=assets')}
              style={{ padding: '12px 20px', background: 'white', color: '#0891b2', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <Package size={18} /> Assets
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/dashboard?view=gis')}
              style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', backdropFilter: 'blur(10px)' }}>
              <Map size={18} /> GIS Dashboard
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={fetchData}
              style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={18} /> Refresh
            </motion.button>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <StatCard title="Water Points" value={data?.water_points || 0} icon={MapPin} color="#0891b2" />
          <StatCard title="Active Nodes" value={data?.active_nodes || 0} icon={Activity} color="#10b981" />
          <StatCard title="Active Alerts" value={data?.active_alerts || 0} icon={AlertTriangle} color="#ef4444" />
          <StatCard title="Open Work Orders" value={data?.work_orders || 0} icon={FileText} color="#8b5cf6" />
          <StatCard title="Maintenance Tasks" value={data?.maintenance_tasks || 0} icon={Wrench} color="#f59e0b" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
              My Network{user?.county ? ` — ${user.county}` : ''}
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>Live levels from your water points</p>
            {nodes.length === 0 && <p style={{ fontSize: '14px', color: '#94a3b8' }}>No nodes assigned in your county yet.</p>}
            {nodes.slice(0, 6).map(n => {
              const level = n.water_level ?? 0
              const color = level < 20 ? '#ef4444' : level < 40 ? '#f59e0b' : '#10b981'
              return (
                <div key={n.id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => navigate(`/app/nodes/${n.id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{n.name}</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color }}>{level}%</span>
                  </div>
                  <div style={{ height: '7px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${level}%`, background: color, borderRadius: '4px' }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Open Alerts ({alerts.length})</h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>Acknowledge and clear field alerts</p>
            {alerts.length === 0 && <p style={{ fontSize: '14px', color: '#94a3b8' }}>All clear — no open alerts.</p>}
            {alerts.slice(0, 6).map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <AlertTriangle size={16} color={a.severity === 'critical' ? '#ef4444' : '#f59e0b'} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#0f172a' }}>{a.node_name || a.type?.replace(/_/g, ' ')}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{a.message}</div>
                </div>
                <button className="btn btn-success btn-sm" disabled={resolving === a.id} onClick={() => resolveAlert(a.id)}>
                  {resolving === a.id ? '…' : 'Resolve'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
