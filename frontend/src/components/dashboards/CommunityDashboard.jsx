import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Droplets, CreditCard, Bell, MapPin, CheckCircle, AlertTriangle, X } from 'lucide-react'
import api from '../../api'
export default function CommunityDashboard() {
  const { user } = useAuth()
  const [nodes, setNodes] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPay, setShowPay] = useState(false)
  const [payForm, setPayForm] = useState({ node_id: '', phone: '', litres: 20 })
  const [payResult, setPayResult] = useState(null)
  const [paying, setPaying] = useState(false)
  useEffect(() => {
    const q = user?.county ? `?county=${encodeURIComponent(user.county)}` : ''
    Promise.all([
      api.get(`/nodes${q}`),
      api.get('/alerts?resolved=false&limit=5'),
    ]).then(([n, a]) => {
      setNodes(n)
      setAlerts(a)
    }).finally(() => setLoading(false))
  }, [user])
  const pay = async e => {
    e.preventDefault(); setPaying(true); setPayResult(null)
    try {
      const res = await api.post('/payments/initiate', payForm)
      setPayResult({ ok: true, msg: res.message, id: res.payment_id })
      let tries = 0
      const poll = setInterval(async () => {
        tries++
        const s = await api.get(`/payments/${res.payment_id}/status`)
        if (s.status === 'completed') {
          clearInterval(poll)
          setPayResult({ ok: true, msg: `✅ Payment complete! M-Pesa code: ${s.mpesa_code}` })
        }
        if (tries > 12) clearInterval(poll)
      }, 2500)
    } catch (err) {
      setPayResult({ ok: false, msg: err.error || 'Payment failed. Try again.' })
    } finally { setPaying(false) }
  }
  if (loading) return <div className="page-loader"><div className="spinner" /></div>
  const activeNodes = nodes.filter(n => n.status === 'active')
  const warningNodes = nodes.filter(n => n.status === 'warning')
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Droplets size={22} color="#b5720a" />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#b5720a' }}>
            {user?.county ? `${user.county} Water Points` : 'Community Water'}
          </h1>
        </div>
        <p style={{ color: '#5f6368', fontSize: 14 }}>Check water availability and pay for water via M-Pesa</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Water Points',  value: nodes.length,         sub: 'in your area', color: '#b5720a', bg: '#fef3d8' },
          { label: 'Open Now',      value: activeNodes.length,   sub: 'serving water', color: '#0d9e75', bg: '#e1f5ee' },
          { label: 'Low Water',     value: warningNodes.length,  sub: 'need attention', color: '#d93025', bg: '#fce8e6' },
          { label: 'Price',         value: 'Ksh 2',              sub: 'per 20 litres', color: '#1a7fd4', bg: '#e8f4fd' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 18px', background: s.bg, border: `1px solid ${s.color}22` }}>
            <div style={{ fontSize: 12, color: s.color, marginBottom: 4, fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.color, opacity: .7, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 20, marginBottom: 18, borderLeft: '4px solid #0d9e75' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0d6e56', marginBottom: 4 }}>Pay for Water — M-Pesa</h3>
            <p style={{ fontSize: 13, color: '#5f6368' }}>Select a water point, enter your M-Pesa number and choose volume</p>
          </div>
          <button className="btn btn-success" onClick={() => setShowPay(!showPay)} style={{ fontSize: 14 }}>
            <CreditCard size={16} /> {showPay ? 'Hide' : 'Pay Now'}
          </button>
        </div>
        {showPay && (
          <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid #e8eaed' }}>
            {payResult && (
              <div className={`alert-bar ${payResult.ok ? 'alert-bar-success' : 'alert-bar-error'}`} style={{ marginBottom: 14 }}>
                {payResult.msg}
              </div>
            )}
            <form onSubmit={pay}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Water Point</label>
                  <select value={payForm.node_id} onChange={e => setPayForm(f => ({ ...f, node_id: e.target.value }))} required>
                    <option value="">Select water point</option>
                    {activeNodes.map(n => (
                      <option key={n.id} value={n.id}>{n.name} — {n.water_level ?? '--'}% full</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Your M-Pesa Number</label>
                  <input placeholder="e.g. 0712345678" value={payForm.phone}
                    onChange={e => setPayForm(f => ({ ...f, phone: e.target.value }))} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Litres</label>
                  <select value={payForm.litres} onChange={e => setPayForm(f => ({ ...f, litres: parseInt(e.target.value) }))}>
                    {[20, 40, 60, 100, 200].map(l => (
                      <option key={l} value={l}>{l}L — Ksh {(l * 0.1).toFixed(2)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'center' }}>
                <button type="submit" className="btn btn-success" disabled={paying}>
                  {paying ? 'Sending M-Pesa prompt…' : `Pay Ksh ${(payForm.litres * 0.1).toFixed(2)}`}
                </button>
                <span style={{ fontSize: 12, color: '#9aa0a6' }}>Prompt sent to your Safaricom phone</span>
              </div>
            </form>
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14, marginBottom: 18 }}>
        {nodes.map(n => (
          <Link key={n.id} to={`/app/nodes/${n.id}`} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: 18, cursor: 'pointer', transition: 'transform .15s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#202124' }}>{n.name}</div>
                  <div style={{ fontSize: 12, color: '#9aa0a6', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <MapPin size={11} />{n.location}
                  </div>
                </div>
                <span className={`badge badge-${n.status}`}>{n.status}</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#5f6368' }}>Water available</span>
                  <span style={{ fontWeight: 700, color: n.water_level < 20 ? '#d93025' : '#0d9e75' }}>{n.water_level ?? '--'}%</span>
                </div>
                <div style={{ height: 8, background: '#f1f3f4', borderRadius: 99 }}>
                  <div style={{ height: '100%', width: `${n.water_level || 0}%`, borderRadius: 99, background: n.water_level < 20 ? '#d93025' : n.water_level < 40 ? '#e8a020' : '#0d9e75', transition: 'width 1s' }} />
                </div>
              </div>
              {n.status === 'active'
                ? <div style={{ fontSize: 12, color: '#0d9e75', display: 'flex', alignItems: 'center', gap: 5 }}><CheckCircle size={13} />Open — Ksh 2 per 20L</div>
                : <div style={{ fontSize: 12, color: '#d93025', display: 'flex', alignItems: 'center', gap: 5 }}><AlertTriangle size={13} />Currently {n.status}</div>
              }
            </div>
          </Link>
        ))}
      </div>
      {alerts.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Bell size={14} color="#e8a020" /> Community Notices
          </h3>
          {alerts.map(a => (
            <div key={a.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #f1f3f4', alignItems: 'flex-start' }}>
              <AlertTriangle size={14} color={a.severity === 'critical' ? '#d93025' : '#e8a020'} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{a.node_name} — {a.message}</div>
                <div style={{ fontSize: 11, color: '#9aa0a6', marginTop: 2 }}>{new Date(a.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
