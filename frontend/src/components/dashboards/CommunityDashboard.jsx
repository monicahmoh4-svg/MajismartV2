import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Droplets, CreditCard, Bell, MapPin, CheckCircle, AlertTriangle, Shield, Thermometer, Eye } from 'lucide-react'
import api from '../../api'

// WHO Water Quality Standards Helper
const getPurityStatus = (turbidity, ph) => {
  const turb = parseFloat(turbidity)
  const pH = parseFloat(ph)
  if (turb > 4 || pH < 6.5 || pH > 8.5) return { label: 'Unsafe / Boil', color: '#d93025', bg: '#fce8e6', icon: AlertTriangle }
  if (turb > 1) return { label: 'Caution', color: '#e8a020', bg: '#fef3d8', icon: Eye }
  return { label: 'Safe to Drink', color: '#0d9e75', bg: '#e1f5ee', icon: CheckCircle }
}

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
    ]).then(([n, a]) => { setNodes(n); setAlerts(a) }).finally(() => setLoading(false))
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
        if (s.status === 'completed') { clearInterval(poll); setPayResult({ ok: true, msg: `✅ Payment complete! M-Pesa code: ${s.mpesa_code}` }) }
        if (tries > 12) clearInterval(poll)
      }, 2500)
    } catch (err) { setPayResult({ ok: false, msg: err.error || 'Payment failed.' }) }
    finally { setPaying(false) }
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><div style={{ width: 36, height: 36, border: '3px solid #e8eaed', borderTopColor: '#1a7fd4', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /></div>

  const activeNodes = nodes.filter(n => n.status === 'active')
  const safeNodes = nodes.filter(n => {
    const purity = getPurityStatus(n.turbidity, n.ph)
    return purity.label === 'Safe to Drink'
  })

  return (
    <div>
      {/* Water Themed Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0c1a2e 0%, #1a3a6e 50%, #0d6e56 100%)',
        borderRadius: 16, padding: '32px 28px', marginBottom: 24, color: 'white', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: 200, height: 200, background: 'rgba(77,208,168,.15)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '20%', width: 160, height: 160, background: 'rgba(77,184,244,.12)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Droplets size={22} color="#4dd0a8" />
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{user?.county ? `${user.county} Water Network` : 'Community Water'}</h1>
          </div>
          <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 14, margin: 0, marginBottom: 20 }}>Real-time IoT telemetry, water purity ratings, and M-Pesa payments</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12 }}>
            {[
              { label: 'Active Points', val: activeNodes.length, icon: MapPin, color: '#4db8f4' },
              { label: 'Safe to Drink', val: safeNodes.length, icon: Shield, color: '#4dd0a8' },
              { label: 'Avg Turbidity', val: `${(nodes.reduce((s,n)=>s+parseFloat(n.turbidity||0),0)/Math.max(nodes.length,1)).toFixed(1)} NTU`, icon: Eye, color: '#ffd54f' },
              { label: 'Avg Temp', val: `${(nodes.reduce((s,n)=>s+parseFloat(n.temperature||0),0)/Math.max(nodes.length,1)).toFixed(1)}°C`, icon: Thermometer, color: '#f28b82' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <s.icon size={14} color={s.color} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>{s.label}</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* M-Pesa Payment */}
      <div style={{ background: 'white', borderRadius: 12, padding: 20, marginBottom: 18, borderLeft: '4px solid #0d9e75', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e8eaed' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0d6e56', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={16} color="#0d9e75" /> Pay for Water — M-Pesa
            </h3>
            <p style={{ fontSize: 13, color: '#5f6368', margin: 0 }}>Select a water point, enter your M-Pesa number and choose volume</p>
          </div>
          <button onClick={() => setShowPay(!showPay)} style={{ background: showPay ? '#f1f3f4' : '#0d9e75', color: showPay ? '#5f6368' : 'white', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {showPay ? 'Hide' : 'Pay Now'}
          </button>
        </div>
        {showPay && (
          <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid #e8eaed' }}>
            {payResult && <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 14, fontSize: 13, background: payResult.ok ? '#e1f5ee' : '#fce8e6', color: payResult.ok ? '#0a7a5c' : '#a52820' }}>{payResult.msg}</div>}
            <form onSubmit={pay}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
                <div><label style={{ fontSize: 13, fontWeight: 500, color: '#5f6368' }}>Water Point</label>
                  <select value={payForm.node_id} onChange={e => setPayForm(f => ({ ...f, node_id: e.target.value }))} required style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e8eaed', borderRadius: 8, fontSize: 14, marginTop: 4 }}>
                    <option value="">Select water point</option>
                    {activeNodes.map(n => <option key={n.id} value={n.id}>{n.name} — {n.water_level ?? '--'}% full</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize: 13, fontWeight: 500, color: '#5f6368' }}>M-Pesa Number</label>
                  <input placeholder="0712345678" value={payForm.phone} onChange={e => setPayForm(f => ({ ...f, phone: e.target.value }))} required style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e8eaed', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
                </div>
                <div><label style={{ fontSize: 13, fontWeight: 500, color: '#5f6368' }}>Litres</label>
                  <select value={payForm.litres} onChange={e => setPayForm(f => ({ ...f, litres: parseInt(e.target.value) }))} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e8eaed', borderRadius: 8, fontSize: 14, marginTop: 4 }}>
                    {[20, 40, 60, 100, 200].map(l => <option key={l} value={l}>{l}L — Ksh {(l * 0.1).toFixed(2)}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={paying} style={{ background: paying ? '#9aa0a6' : '#0d9e75', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: paying ? 'not-allowed' : 'pointer', marginTop: 14 }}>
                {paying ? 'Sending M-Pesa prompt…' : `Pay Ksh ${(payForm.litres * 0.1).toFixed(2)}`}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Water Points Grid with Purity Ratings */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#202124', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Droplets size={20} color="#1a7fd4" /> Water Points & Purity Status
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14, marginBottom: 18 }}>
        {nodes.map(n => {
          const level = n.water_level || 0
          const levelColor = level < 20 ? '#d93025' : level < 40 ? '#e8a020' : '#0d9e75'
          const purity = getPurityStatus(n.turbidity, n.ph)
          const PurityIcon = purity.icon
          return (
            <Link key={n.id} to={`/app/nodes/${n.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e8eaed', transition: 'transform .15s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#202124' }}>{n.name}</div>
                    <div style={{ fontSize: 12, color: '#9aa0a6', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}><MapPin size={11} />{n.location}</div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: n.status === 'active' ? '#e1f5ee' : '#fce8e6', color: n.status === 'active' ? '#0d9e75' : '#d93025' }}>{n.status}</span>
                </div>
                
                {/* Water Level */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: '#5f6368' }}>Water Level</span>
                    <span style={{ fontWeight: 700, color: levelColor }}>{level}%</span>
                  </div>
                  <div style={{ height: 6, background: '#f1f3f4', borderRadius: 99 }}>
                    <div style={{ height: '100%', width: `${level}%`, borderRadius: 99, background: levelColor, transition: 'width 1s' }} />
                  </div>
                </div>

                {/* IoT Purity Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <div style={{ background: '#f8f9fa', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#9aa0a6' }}>Turbidity</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#202124' }}>{n.turbidity || '--'} <span style={{fontSize: 9}}>NTU</span></div>
                  </div>
                  <div style={{ background: '#f8f9fa', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#9aa0a6' }}>pH Level</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#202124' }}>{n.ph || '--'}</div>
                  </div>
                  <div style={{ background: '#f8f9fa', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#9aa0a6' }}>Temp</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#202124' }}>{n.temperature || '--'}°C</div>
                  </div>
                </div>

                {/* Purity Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: purity.bg, borderRadius: 8, border: `1px solid ${purity.color}33` }}>
                  <PurityIcon size={14} color={purity.color} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: purity.color }}>{purity.label}</span>
                  <span style={{ fontSize: 10, color: '#5f6368', marginLeft: 'auto' }}>WHO Standard</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {alerts.length > 0 && (
        <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e8eaed' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}><Bell size={14} color="#e8a020" /> Community Notices</h3>
          {alerts.map(a => (
            <div key={a.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid #f1f3f4', alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: a.severity === 'critical' ? '#fce8e6' : '#fef3d8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
