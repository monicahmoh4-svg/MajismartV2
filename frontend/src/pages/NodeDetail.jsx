import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Wifi, Droplets, Thermometer, Eye, Activity, AlertTriangle, Save, Shield } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../api'

export default function NodeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [node, setNode] = useState(null)
  const [history, setHistory] = useState([])
  const [latest, setLatest] = useState(null)
  const [payments, setPayments] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [msg, setMsg] = useState('')

  const load = async () => {
    try {
      const [n, hist, lat, pay, alrt] = await Promise.all([
        api.get(`/nodes/${id}`),
        api.get(`/sensors/${id}/history?hours=24`),
        api.get(`/sensors/${id}/latest`),
        api.get(`/payments?node_id=${id}&limit=10`),
        api.get(`/alerts?resolved=false`)
      ])
      setNode(n); setHistory(hist); setLatest(lat); setPayments(pay)
      setAlerts(alrt.filter(a => a.node_id === id))
      setEditForm({ name: n.name, location: n.location, county: n.county, status: n.status })
    } catch { navigate('/app/nodes') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [id])

  const saveEdit = async () => {
    try { await api.patch(`/nodes/${id}`, editForm); setMsg('Saved!'); setEditing(false); load() } 
    catch { setMsg('Save failed') }
    setTimeout(() => setMsg(''), 3000)
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><div style={{ width: 36, height: 36, border: '3px solid #e8eaed', borderTopColor: '#1a7fd4', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /></div>

  // Water Purity Logic
  const turbidity = latest?.turbidity || node?.turbidity || 0
  const ph = latest?.ph || node?.ph || 7.0
  let purityStatus = 'Safe to Drink'; let purityColor = '#0d9e75'; let purityBg = '#e1f5ee';
  if (turbidity > 4 || ph < 6.5 || ph > 8.5) { purityStatus = 'Unsafe / Boil Water'; purityColor = '#d93025'; purityBg = '#fce8e6'; }
  else if (turbidity > 1) { purityStatus = 'Caution'; purityColor = '#e8a020'; purityBg = '#fef3d8'; }

  const chartData = history.map(r => ({
    time: new Date(r.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    level: r.water_level, flow: r.flow_rate, turbidity: r.turbidity
  }))

  return (
    <div>
      <button onClick={() => navigate('/app/nodes')} className="btn btn-ghost" style={{ marginBottom: 20, padding: '8px 14px' }}>
        <ArrowLeft size={16} /> Back to Nodes
      </button>
      {msg && <div className={`alert-bar ${msg.includes('!') ? 'alert-bar-success' : 'alert-bar-error'}`}>{msg}</div>}
      
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            {editing ? (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <input value={editForm.name} onChange={e => setEditForm(f => ({...f, name: e.target.value}))} style={{ width: 220, fontWeight: 700, fontSize: 16 }} />
                <input value={editForm.location} onChange={e => setEditForm(f => ({...f, location: e.target.value}))} style={{ width: 220 }} placeholder="Location" />
                <select value={editForm.status} onChange={e => setEditForm(f => ({...f, status: e.target.value}))} style={{ width: 'auto' }}>
                  <option value="active">Active</option><option value="warning">Warning</option>
                  <option value="offline">Offline</option><option value="maintenance">Maintenance</option>
                </select>
              </div>
            ) : (
              <>
                <h1 style={{ fontSize: 24, fontWeight: 800 }}>{node.name}</h1>
                <p style={{ color: '#5f6368', marginTop: 4 }}>{node.location} · {node.county} · {node.type}</p>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {editing ? <><button className="btn btn-success" onClick={saveEdit}><Save size={15} />Save</button><button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button></> : <button className="btn btn-outline" onClick={() => setEditing(true)}>Edit Node</button>}
          </div>
        </div>

        {/* IoT Telemetry & Purity Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginTop: 24 }}>
          <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><Droplets size={15} color="#1a7fd4" /><span style={{ fontSize: 12, color: '#5f6368' }}>Water Level</span></div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#202124' }}>{latest?.water_level ?? '--'}%</div>
          </div>
          <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><Activity size={15} color="#0d9e75" /><span style={{ fontSize: 12, color: '#5f6368' }}>Flow Rate</span></div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#202124' }}>{latest?.flow_rate ?? '--'} <span style={{fontSize: 12, color: '#9aa0a6'}}>L/min</span></div>
          </div>
          <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><Eye size={15} color="#6f42c1" /><span style={{ fontSize: 12, color: '#5f6368' }}>Turbidity</span></div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#202124' }}>{turbidity} <span style={{fontSize: 12, color: '#9aa0a6'}}>NTU</span></div>
            <div style={{ fontSize: 10, color: turbidity > 4 ? '#d93025' : '#0d9e75' }}>{turbidity > 4 ? 'Exceeds WHO limit' : 'Within safe limits'}</div>
          </div>
          <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><Thermometer size={15} color="#e8a020" /><span style={{ fontSize: 12, color: '#5f6368' }}>Temperature</span></div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#202124' }}>{latest?.temperature ?? '--'}°C</div>
          </div>
        </div>

        {/* Water Purity Status Banner */}
        <div style={{ marginTop: 20, padding: '16px 20px', background: purityBg, borderRadius: 12, border: `1px solid ${purityColor}33`, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
            <Shield size={24} color={purityColor} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: purityColor, marginBottom: 4 }}>Water Purity Status: {purityStatus}</div>
            <div style={{ fontSize: 13, color: '#5f6368' }}>
              Based on latest IoT readings: Turbidity {turbidity} NTU (WHO limit: &lt;4), pH {ph} (WHO range: 6.5-8.5).
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>24-hour IoT Telemetry History</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} domain={[0,100]} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line yAxisId="left" type="monotone" dataKey="level" stroke="#1a7fd4" strokeWidth={2} dot={false} name="Level %" />
            <Line yAxisId="right" type="monotone" dataKey="flow" stroke="#0d9e75" strokeWidth={1.5} dot={false} name="Flow L/min" />
            <Line yAxisId="right" type="monotone" dataKey="turbidity" stroke="#6f42c1" strokeWidth={1.5} dot={false} name="Turbidity NTU" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Active Alerts</h3>
          {alerts.length === 0 ? <p style={{ color: '#9aa0a6', fontSize: 13 }}>No active alerts for this node.</p> :
            alerts.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f1f3f4' }}>
                <AlertTriangle size={15} color={a.severity==='critical'?'#d93025':'#e8a020'} />
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{a.message}</div><div style={{ fontSize: 11, color: '#9aa0a6' }}>{new Date(a.created_at).toLocaleString()}</div></div>
              </div>
            ))}
        </div>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Recent Payments</h3>
          {payments.length === 0 ? <p style={{ color: '#9aa0a6', fontSize: 13 }}>No payments recorded yet.</p> :
            payments.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f3f4' }}>
                <div><div style={{ fontSize: 13, fontWeight: 500 }}>{p.phone}</div><div style={{ fontSize: 11, color: '#9aa0a6' }}>{p.litres}L · {new Date(p.created_at).toLocaleDateString()}</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: 13, fontWeight: 700, color: '#0d9e75' }}>Ksh {p.amount_ksh}</div><span className={`badge badge-${p.status==='completed'?'active':'warning'}`} style={{ fontSize: 10 }}>{p.status}</span></div>
              </div>
            ))}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
