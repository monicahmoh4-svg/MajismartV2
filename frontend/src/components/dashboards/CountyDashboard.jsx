import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../../api'
import { motion } from 'framer-motion'
import { 
  Users, Activity, MapPin, AlertTriangle, 
  RefreshCw, Map, FileText, Package, MessageSquare, Brain, Wrench
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

export default function CountyDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [kpis, setKpis] = useState(null)
  const [vendors, setVendors] = useState([])
  const [creports, setCreports] = useState([])
  const [balance, setBalance] = useState(null)
  const [deciding, setDeciding] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const county = user?.county || ''
      const [stats, k, v, r, wb] = await Promise.all([
        api.get(`/county/dashboard-stats?county=${county}`),
        api.get(`/wasreb/kpis?county=${encodeURIComponent(county)}`).catch(() => null),
        api.get('/wasreb/vendors').catch(() => []),
        api.get('/reports-enhanced?limit=50').catch(() => []),
        api.get('/wasreb/water-balance').catch(() => []),
      ])
      setData(stats)
      setKpis(k)
      setVendors(Array.isArray(v) ? v.filter(x => !county || x.county === county) : [])
      const list = Array.isArray(r) ? r : r?.data || r?.reports || []
      setCreports(list.filter(x => !county || x.county === county).slice(0, 5))
      const rows = Array.isArray(wb) ? wb : []
      setBalance(rows.find(x => x.county === county) || null)
    } catch (err) {
      console.error('County dashboard fetch error:', err)
      setData({ water_points: 0, active_nodes: 0, active_alerts: 0, reports: 0, population_served: 0 })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading message="Loading county dashboard..." />

  const decideVendor = async (id, status) => {
    setDeciding(id)
    try {
      await api.patch(`/wasreb/vendors/${id}`, { status })
      const v = await api.get('/wasreb/vendors').catch(() => [])
      const county = user?.county || ''
      setVendors(Array.isArray(v) ? v.filter(x => !county || x.county === county) : [])
    } catch (err) {
      console.error('Vendor decision failed:', err.message)
    } finally {
      setDeciding(null)
    }
  }

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
            <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800' }}>County Dashboard - {user?.county || 'County'}</h1>
            <p style={{ margin: 0, fontSize: '15px', opacity: 0.95 }}>Welcome back, {user?.name || 'Officer'}</p>
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
          <StatCard title="Reports" value={data?.reports || 0} icon={FileText} color="#8b5cf6" />
          <StatCard title="Population Served" value={data?.population_served || 0} icon={Users} color="#f59e0b" />
        </div>

        {kpis && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>WASREB Performance — {user?.county}</h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>Live utility KPIs vs national benchmarks</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              {[
                { label: 'Non-Revenue Water', val: `${kpis.nrw_pct ?? '—'}%`, hint: 'benchmark 25%', bad: (kpis.nrw_pct || 0) > 25 },
                { label: 'Collection Efficiency', val: `${kpis.collection_efficiency_pct ?? '—'}%`, hint: 'target 90%+', bad: (kpis.collection_efficiency_pct || 0) < 90 },
                { label: 'Revenue (30d)', val: `KES ${Number(kpis.revenue_ksh_30d || 0).toLocaleString()}`, hint: 'M-Pesa collected', bad: false },
                { label: 'Active Points', val: `${kpis.active_points ?? 0}/${kpis.total_points ?? 0}`, hint: 'points online', bad: false },
                { label: 'Supply Hours/Day', val: kpis.hours_of_supply_per_day ?? '—', hint: 'continuity', bad: false },
              ].map(k => (
                <div key={k.label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', borderLeft: `4px solid ${k.bad ? '#ef4444' : '#10b981'}` }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{k.val}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>{k.label}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{k.hint}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {balance && (
          <div style={{ background: 'linear-gradient(135deg, #0c1a2e, #0d6e56)', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px', color: 'white', display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>DMA water balance — {balance.county}</div>
              <div style={{ fontSize: '26px', fontWeight: '800' }}>{balance.nrw_pct}% NRW</div>
            </div>
            <div style={{ fontSize: '13px', opacity: 0.85 }}>
              Produced {Number(balance.produced_litres || 0).toLocaleString()}L · Billed {Number(balance.billed_litres || 0).toLocaleString()}L
            </div>
            <div style={{ fontSize: '13px', opacity: 0.85 }}>
              Revenue Ksh {Number(balance.revenue_ksh || 0).toLocaleString()} across {balance.points || 0} points
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Licensed Vendors ({vendors.length})</h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>Water Services Regulations 2025 · Sec.74 permits</p>
            {vendors.length === 0 && <p style={{ fontSize: '14px', color: '#94a3b8' }}>No vendors registered in {user?.county || 'this county'} yet.</p>}
            {vendors.slice(0, 6).map(v => (
              <div key={v.id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{v.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{v.ward || v.county} · {v.permit_no} · Ksh {v.tariff_ksh_per_20l}/20L</div>
                  </div>
                  <span className={`badge badge-${v.status === 'approved' ? 'active' : v.status === 'rejected' ? 'critical' : 'warning'}`}>{v.status}</span>
                </div>
                {v.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="btn btn-success btn-sm" disabled={deciding === v.id} onClick={() => decideVendor(v.id, 'approved')}>
                      {deciding === v.id ? '…' : 'Approve'}
                    </button>
                    <button className="btn btn-ghost btn-sm" disabled={deciding === v.id} onClick={() => decideVendor(v.id, 'rejected')}>Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Recent Citizen Reports</h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>Latest issues raised in {user?.county || 'your county'}</p>
            {creports.length === 0 && <p style={{ fontSize: '14px', color: '#94a3b8' }}>No reports yet.</p>}
            {creports.map(r => (
              <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{r.title || r.category || 'Report'}</span>
                  <span className={`badge badge-${r.status === 'resolved' || r.status === 'closed' ? 'active' : 'warning'}`}>{r.status}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: 2 }}>{r.ward || r.county}{r.created_at ? ` · ${new Date(r.created_at).toLocaleDateString()}` : ''}</div>
              </div>
            ))}
            <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/app/reports')}>Open report management</button>
          </div>
        </div>
      </div>
    </div>
  )
}
