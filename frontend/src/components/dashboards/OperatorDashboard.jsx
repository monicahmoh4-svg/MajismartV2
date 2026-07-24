import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Wifi, CreditCard, Bell, Wrench, AlertTriangle, CheckCircle, Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../../api'

export default function OperatorDashboard() {
  const { user } = useAuth()
  const [nodes, setNodes] = useState([])
  const [alerts, setAlerts] = useState([])
  const [payments, setPayments] = useState([])
  const [maintenance, setMaintenance] = useState([])
  const [sensorHistory, setSensorHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = user?.county ? `?county=${encodeURIComponent(user.county)}` : ''
    Promise.all([
      api.get(`/nodes${q}`),
      api.get('/alerts?resolved=false&limit=10'),
      api.get('/payments?limit=20'),
      api.get('/dashboard/maintenance'),
    ]).then(async ([n, a, p, m]) => {
      setNodes(n)
      setAlerts(a)
      setPayments(p)
      setMaintenance(m)
      // Load sensor history for first active node
      const activeNode = n.find(x => x.status === 'active')
      if (activeNode) {
        const hist = await api.get(`/sensors/${activeNode.id}/history?hours=12`)
        setSensorHistory(hist.map(r => ({
          time: new Date(r.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          level: r.water_level,
          flow: r.flow_rate
        })))
      }
    }).finally(() => setLoading(false))
  }, [user])

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  const myAlerts = alerts.filter(a => user?.county ? a.county === user.county : true)
  const myPayments = payments.filter(p => user?.county ? p.county === user.county : true)
  const todayRevenue = myPayments.filter(p => {
    const today = new Date().toDateString()
    return new Date(p.created_at).toDateString() === today && p.status === 'completed'
  }).reduce((s, p) => s + Number(p.amount_ksh), 0)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Wrench size={22} color="#7a3fb5" />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#7a3fb5' }}>Operator Dashboard</h1>
        </div>
        <p style={{ color: '#5f6368', fontSize: 14 }}>
          Field operations — {user?.county || 'all'} area nodes, maintenance and real-time monitoring
        </p>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'My Nodes',       value: nodes.length,                   sub: `${nodes.filter(n=>n.status==='active').length} online`,    icon: Wifi,       color: '#7a3fb5', bg: '#f0e8fc' },
          { label: 'Active Alerts',  value: myAlerts.length,                sub: `${myAlerts.filter(a=>a.severity==='critical').length} critical`, icon: Bell, color: '#d93025', bg: '#fce8e6' },
          { label: 'Today Revenue',  value: `Ksh ${todayRevenue.toFixed(0)}`, sub: 'your sites', icon: CreditCard, color: '#0d9e75', bg: '#e1f5ee' },
          { label: 'Maintenance',    value: maintenance.length,             sub: 'logs total',                                               icon: Wrench,     color: '#e8a020', bg: '#fef3d8' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, color: '#5f6368', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#9aa0a6', marginTop: 2 }}>{s.sub}</div>
              </div>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={16} color={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sensor chart + Node list */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 18, marginBottom: 18 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#7a3fb5', display: 'flex', alignItems: 'center', gap: 7 }}>
            <Activity size={15} /> Live Sensor — Last 12 Hours
          </h3>
          {sensorHistory.length > 0
            ? <ResponsiveContainer width="100%" height={170}>
                <LineChart data={sensorHistory} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" />
                  <XAxis dataKey="time" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="level" stroke="#7a3fb5" strokeWidth={2} dot={false} name="Level %" />
                  <Line type="monotone" dataKey="flow" stroke="#0d9e75" strokeWidth={1.5} dot={false} name="Flow L/min" />
                </LineChart>
              </ResponsiveContainer>
            : <div style={{ textAlign: 'center', color: '#9aa0a6', padding: '40px 0', fontSize: 13 }}>No sensor data yet</div>
          }
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#7a3fb5' }}>My Nodes</h3>
            <Link to="/app/nodes" style={{ fontSize: 12, color: '#1a7fd4' }}>All nodes</Link>
          </div>
          {nodes.map(n => (
            <Link key={n.id} to={`/app/nodes/${n.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #f1f3f4', cursor: 'pointer' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: n.status === 'active' ? '#0d9e75' : n.status === 'warning' ? '#e8a020' : '#9aa0a6' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#202124', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.name}</div>
                  <div style={{ fontSize: 11, color: '#9aa0a6' }}>{n.location}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: n.water_level < 20 ? '#d93025' : '#0d9e75' }}>{n.water_level ?? '--'}%</div>
                  <div style={{ fontSize: 10, color: '#9aa0a6' }}>{n.flow_rate ? `${n.flow_rate}L/m` : '--'}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Alerts + Recent payments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 18 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}><Bell size={14} color="#d93025" /> Alerts to Action</h3>
            <Link to="/app/alerts" style={{ fontSize: 12, color: '#1a7fd4' }}>Resolve</Link>
          </div>
          {myAlerts.length === 0
            ? <div style={{ textAlign: 'center', color: '#9aa0a6', padding: '16px 0', fontSize: 13 }}><CheckCircle size={20} color="#0d9e75" style={{ display: 'block', margin: '0 auto 6px' }} />No alerts — all nodes healthy</div>
            : myAlerts.slice(0, 5).map(a => (
              <div key={a.id} style={{ padding: '8px 0', borderBottom: '1px solid #f1f3f4' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <AlertTriangle size={13} color={a.severity === 'critical' ? '#d93025' : '#e8a020'} style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{a.node_name}</div>
                    <div style={{ fontSize: 11, color: '#5f6368' }}>{a.message}</div>
                    <div style={{ fontSize: 10, color: '#9aa0a6', marginTop: 2 }}>{new Date(a.created_at).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))
          }
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}><CreditCard size={14} color="#0d9e75" /> Recent Payments</h3>
            <Link to="/app/payments" style={{ fontSize: 12, color: '#1a7fd4' }}>All</Link>
          </div>
          {myPayments.slice(0, 6).map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f1f3f4' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{p.phone}</div>
                <div style={{ fontSize: 11, color: '#9aa0a6' }}>{p.node_name} · {p.litres}L</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0d9e75' }}>Ksh {p.amount_ksh}</div>
                <div style={{ fontSize: 10, color: '#9aa0a6' }}>{new Date(p.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
