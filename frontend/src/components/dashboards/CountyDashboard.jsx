import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Wifi, CreditCard, Bell, Droplets, MapPin, AlertTriangle, TrendingUp } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../../api'

export default function CountyDashboard() {
  const { user } = useAuth()
  const [nodes, setNodes] = useState([])
  const [revenue, setRevenue] = useState([])
  const [alerts, setAlerts] = useState([])
  const [countyStats, setCountyStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const countyQuery = user?.county ? `?county=${encodeURIComponent(user.county)}` : ''
    Promise.all([
      api.get(`/nodes${countyQuery}`),
      api.get('/dashboard/revenue-chart?days=14'),
      api.get(`/alerts?resolved=false&limit=8`),
      api.get('/dashboard/county-stats'),
    ]).then(([n, r, a, cs]) => {
      setNodes(n)
      setRevenue(r)
      setAlerts(a.filter(al => !user?.county || al.county === user.county))
      const myStat = cs.find(c => c.county === user?.county)
      setCountyStats(myStat || null)
    }).finally(() => setLoading(false))
  }, [user])

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  const activeNodes = nodes.filter(n => n.status === 'active').length
  const totalRevenue = nodes.reduce((s, n) => s + Number(n.revenue_ksh || 0), 0)
  const totalLitres = nodes.reduce((s, n) => s + Number(n.payment_count || 0) * 40, 0)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <MapPin size={22} color="#0d6e56" />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0d6e56' }}>
            {user?.county || 'County'} Water Dashboard
          </h1>
        </div>
        <p style={{ color: '#5f6368', fontSize: 14 }}>County-level water infrastructure — monitoring, revenue and quality oversight</p>
      </div>

      {/* County stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Nodes in County',  value: nodes.length,                                                             sub: `${activeNodes} active`,          icon: Wifi,       color: '#0d6e56', bg: '#e1f5ee' },
          { label: 'County Revenue',   value: `Ksh ${totalRevenue.toLocaleString()}`,                                   sub: 'all time',                       icon: CreditCard, color: '#1a7fd4', bg: '#e8f4fd' },
          { label: 'Litres Delivered', value: `${totalLitres.toLocaleString()}L`,                                       sub: 'estimated',                      icon: Droplets,   color: '#6f42c1', bg: '#f0e8fc' },
          { label: 'Open Alerts',      value: alerts.length,                                                            sub: `${alerts.filter(a=>a.severity==='critical').length} critical`, icon: Bell, color: '#d93025', bg: '#fce8e6' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, color: '#5f6368', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#9aa0a6', marginTop: 2 }}>{s.sub}</div>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={17} color={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue trend */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 18, marginBottom: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#0d6e56', display: 'flex', alignItems: 'center', gap: 7 }}>
            <TrendingUp size={15} /> County Revenue — 14 Days
          </h3>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={revenue} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d?.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => [`Ksh ${v}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#0d6e56" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Node water levels */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0d6e56' }}>Node Water Levels</h3>
            <Link to="/app/nodes" style={{ fontSize: 12, color: '#1a7fd4' }}>View all</Link>
          </div>
          {nodes.slice(0, 6).map(n => (
            <div key={n.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                <span style={{ fontWeight: 500 }}>{n.name}</span>
                <span style={{ color: n.water_level < 20 ? '#d93025' : '#0d9e75', fontWeight: 600 }}>{n.water_level ?? '--'}%</span>
              </div>
              <div style={{ height: 6, background: '#f1f3f4', borderRadius: 99 }}>
                <div style={{ height: '100%', width: `${n.water_level || 0}%`, borderRadius: 99, background: n.water_level < 20 ? '#d93025' : n.water_level < 40 ? '#e8a020' : '#0d9e75', transition: 'width 1s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Bell size={15} color="#d93025" /> County Alerts
          </h3>
          <Link to="/app/alerts" style={{ fontSize: 12, color: '#1a7fd4' }}>Manage</Link>
        </div>
        {alerts.length === 0
          ? <p style={{ color: '#9aa0a6', fontSize: 13 }}>No active alerts in {user?.county}.</p>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 10 }}>
              {alerts.map(a => (
                <div key={a.id} style={{
                  padding: '12px 14px', borderRadius: 8,
                  background: a.severity === 'critical' ? '#fce8e6' : '#fef3d8',
                  border: `1px solid ${a.severity === 'critical' ? '#f5c6c3' : '#fad99c'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                    <AlertTriangle size={14} color={a.severity === 'critical' ? '#d93025' : '#e8a020'} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{a.node_name}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#3c4043', margin: 0 }}>{a.message}</p>
                  <p style={{ fontSize: 11, color: '#9aa0a6', margin: '4px 0 0' }}>{new Date(a.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  )
}
