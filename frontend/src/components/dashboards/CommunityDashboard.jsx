import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Droplets, CreditCard, Bell, MapPin, CheckCircle, AlertTriangle, X, Shield, Activity, CloudRain, Zap } from 'lucide-react'
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

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><div style={{ width: 36, height: 36, border: '3px solid #e8eaed', borderTopColor: '#1a7fd4', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /></div>

  const activeNodes = nodes.filter(n => n.status === 'active')
  const warningNodes = nodes.filter(n => n.status === 'warning')
  const safeNodes = nodes.filter(n => (n.water_level || 0) > 50)

  return (
    <div>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0c1a2e 0%, #1a3a6e 50%, #0d6e56 100%)',
        borderRadius: 16, padding: '32px 28px', marginBottom: 24, color: 'white',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: 200, height: 200, background: 'rgba(77,208,168,.15)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '20%', width: 160, height: 160, background: 'rgba(77,184,244,.12)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <CloudRain size={22} color="#4dd0a8" />
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
              {user?.county ? `${user.county} Water Network` : 'Community Water'}
            </h1>
          </div>
          <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 14, margin: 0, marginBottom: 20 }}>
            Real-time availability, safety ratings, and M-Pesa water payments
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12 }}>
            {[
              { label: 'Water Points', val: nodes.length, icon: MapPin, color: '#4db8f4' },
              { label: 'Open Now', val: activeNodes.length, icon: CheckCircle, color: '#4dd0a8' },
              { label: 'Need Attention', val: warningNodes.length, icon: AlertTriangle, color: '#ffd54f' },
              { label: 'Safe to Drink', val: `${Math.round((safeNodes.length / Math.max(nodes.length,1)) * 100)}%`, icon: Shield, color: '#4dd0a8' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,.08)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,.12)',
                borderRadius: 10, padding: '14px 16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <s.icon size={14} color={s.color} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>{s.label}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pay for water — M-Pesa */}
      <div style={{
        background: 'white', borderRadius: 12, padding: 20, marginBottom: 18,
        borderLeft: '4px solid #0d9e75', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e8eaed'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0d6e56', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={16} color="#0d9e75" /> Pay for Water — M-Pesa
            </h3>
            <p style={{ fontSize: 13, color: '#5f6368', margin: 0 }}>Select a water point, enter your M-Pesa number and choose volume</p>
          </div>
          <button onClick={() => setShowPay(!showPay)} style={{
            background: showPay ? '#f1f3f4' : '#0d9e75', color: showPay ? '#5f6368' : 'white',
            border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <CreditCard size={16} /> {showPay ? 'Hide' : 'Pay Now'}
          </button>
        </div>
        {showPay && (
          <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid #e8eaed' }}>
            {payResult && (
              <div style={{
                padding: '12px 16px', borderRadius: 8, marginBottom: 14, fontSize: 13,
                background: payResult.ok ? '#e1f5ee' : '#fce8e6',
                color: payResult.ok ? '#0a7a5c' : '#a52820',
                border: `1px solid ${payResult.ok ? '#9ee0c8' : '#f5c6c3'}`
              }}>
                {payResult.msg}
              </div>
            )}
            <form onSubmit={pay}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
                <div style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#5f6368', marginBottom: 6 }}>Water Point</label>
                  <select value={payForm.node_id} onChange={e => setPayForm(f => ({ ...f, node_id: e.target.value }))} required style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e8eaed', borderRadius: 8, fontSize: 14, background: 'white' }}>
                    <option value="">Select water point</option>
                    {activeNodes.map(n => (
                      <option key={n.id} value={n.id}>{n.name} — {n.water_level ?? '--'}% full</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#5f6368', marginBottom: 6 }}>Your M-Pesa Number</label>
                  <input placeholder="e.g. 0712345678" value={payForm.phone}
                    onChange={e => setPayForm(f => ({ ...f, phone: e.target.value }))} required
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e8eaed', borderRadius: 8, fontSize: 14 }} />
                </div>
                <div style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#5f6368', marginBottom: 6 }}>Litres</label>
                  <select value={payForm.litres} onChange={e => setPayForm(f => ({ ...f, litres: parseInt(e.target.value) }))}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e8eaed', borderRadius: 8, fontSize: 14, background: 'white' }}>
                    {[20, 40, 60, 100, 200].map(l => (
                      <option key={l} value={l}>{l}L — Ksh {(l * 0.1).toFixed(2)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'center' }}>
                <button type="submit" disabled={paying} style={{
                  background: paying ? '#9aa0a6' : '#0d9e75', color: 'white',
                  border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: paying ? 'not-allowed' : 'pointer'
                }}>
                  {paying ? 'Sending M-Pesa prompt…' : `Pay Ksh ${(payForm.litres * 0.1).toFixed(2)}`}
                </button>
                <span style={{ fontSize: 12, color: '#9aa0a6' }}>Prompt sent to your Safaricom phone</span>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Water points grid */}
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#202124', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Droplets size={20} color="#1a7fd4" /> Water Points in Your Area
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {nodes.map(n => {
            const level = n.water_level || 0
            const levelColor = level < 20 ? '#d93025' : level < 40 ? '#e8a020' : '#0d9e75'
            const statusColor = n.status === 'active' ? '#0d9e75' : n.status === 'warning' ? '#e8a020' : '#d93025'
            return (
              <Link key={n.id} to={`/app/nodes/${n.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'white', borderRadius: 12, padding: 18,
                  boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e8eaed',
                  cursor: 'pointer', transition: 'transform .15s, box-shadow .15s'
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#202124' }}>{n.name}</div>
                      <div style={{ fontSize: 12, color: '#9aa0a6', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <MapPin size={11} />{n.location}
                      </div>
                    </div>
                    <span style={{
                      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                      background: n.status === 'active' ? '#e1f5ee' : n.status === 'warning' ? '#fef3d8' : '#fce8e6',
                      color: statusColor
                    }}>{n.status}</span>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: '#5f6368' }}>Water available</span>
                      <span style={{ fontWeight: 700, color: levelColor }}>{level}%</span>
                    </div>
                    <div style={{ height: 8, background: '#f1f3f4', borderRadius: 99 }}>
                      <div style={{ height: '100%', width: `${level}%`, borderRadius: 99, background: levelColor, transition: 'width 1s' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: level > 50 ? '#0d9e75' : '#d93025' }}>
                      {level > 50 ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
                      {level > 50 ? 'Safe to drink' : 'Low supply'}
                    </div>
                    <div style={{ fontSize: 11, color: '#5f6368', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Zap size={11} /> Ksh 2 / 20L
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
        {nodes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9aa0a6' }}>
            <Droplets size={40} style={{ marginBottom: 12, opacity: .3 }} />
            <p>No water points in your area yet</p>
          </div>
        )}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e8eaed' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Bell size={14} color="#e8a020" /> Community Notices
          </h3>
          {alerts.map(a => (
            <div key={a.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid #f1f3f4', alignItems: 'flex-start' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: a.severity === 'critical' ? '#fce8e6' : '#fef3d8',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <AlertTriangle size={14} color={a.severity === 'critical' ? '#d93025' : '#e8a020'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#202124' }}>{a.node_name}</div>
                <div style={{ fontSize: 12, color: '#5f6368', marginTop: 2 }}>{a.message}</div>
                <div style={{ fontSize: 11, color: '#9aa0a6', marginTop: 3 }}>{new Date(a.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
