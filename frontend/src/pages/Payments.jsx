import { useState, useEffect } from 'react'
import { CreditCard, Search, Plus, X, CheckCircle, Clock, XCircle } from 'lucide-react'
import api from '../api'

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [nodes, setNodes] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ node_id:'', phone:'', litres:20 })
  const [submitting, setSubmitting] = useState(false)
  const [payResult, setPayResult] = useState(null)

  const load = () => {
    Promise.all([
      api.get('/payments?limit=100'),
      api.get('/nodes'),
      api.get('/payments/stats/summary')
    ]).then(([p,n,s]) => { setPayments(p); setNodes(n); setStats(s) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const filtered = payments.filter(p => {
    const q = search.toLowerCase()
    const match = !q || p.phone.includes(q) || p.node_name?.toLowerCase().includes(q) || (p.mpesa_code||'').toLowerCase().includes(q)
    return match && (!filterStatus || p.status === filterStatus)
  })

  const initiate = async e => {
    e.preventDefault(); setSubmitting(true); setPayResult(null)
    try {
      const res = await api.post('/payments/initiate', form)
      setPayResult({ success: true, msg: res.message, id: res.payment_id })
      // Poll for completion
      let attempts = 0
      const poll = setInterval(async () => {
        attempts++
        const status = await api.get(`/payments/${res.payment_id}/status`)
        if (status.status === 'completed') {
          clearInterval(poll)
          setPayResult(r => ({...r, msg: `Payment complete! M-Pesa code: ${status.mpesa_code}`}))
          load()
        }
        if (attempts > 10) clearInterval(poll)
      }, 2500)
    } catch (err) { setPayResult({ success: false, msg: err.error || 'Failed' }) }
    finally { setSubmitting(false) }
  }

  const statusIcon = s => s==='completed' ? <CheckCircle size={14} color="#0d9e75" /> : s==='pending' ? <Clock size={14} color="#e8a020" /> : <XCircle size={14} color="#d93025" />

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CreditCard size={24} color="#0d9e75" /> Payments
          </h1>
          <p style={{ color: '#5f6368', marginTop: 4 }}>M-Pesa water payment transactions</p>
        </div>
        <button className="btn btn-success" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Initiate Payment
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Revenue',    val: `Ksh ${Number(stats?.total_revenue||0).toLocaleString()}`, color: '#0d9e75' },
          { label: 'Total Litres',     val: `${Number(stats?.total_litres||0).toLocaleString()}L`,     color: '#1a7fd4' },
          { label: 'Transactions',     val: stats?.total_transactions || 0,                            color: '#6f42c1' },
          { label: 'Today\'s Sales',   val: stats?.today_transactions || 0,                            color: '#e8a020' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 12, color: '#5f6368', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Payment form */}
      {showForm && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700 }}>Initiate M-Pesa Payment</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#9aa0a6' }}><X size={18} /></button>
          </div>
          {payResult && (
            <div className={`alert-bar ${payResult.success ? 'alert-bar-success' : 'alert-bar-error'}`} style={{ marginBottom: 16 }}>
              {payResult.msg}
            </div>
          )}
          <form onSubmit={initiate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Node</label>
                <select value={form.node_id} onChange={e => setForm(f => ({...f, node_id: e.target.value}))} required>
                  <option value="">Select node</option>
                  {nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Phone (M-Pesa)</label>
                <input placeholder="0712345678" value={form.phone}
                  onChange={e => setForm(f => ({...f, phone: e.target.value}))} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Litres</label>
                <select value={form.litres} onChange={e => setForm(f => ({...f, litres: parseInt(e.target.value)}))}>
                  {[20,40,60,100,200].map(l => <option key={l} value={l}>{l}L — Ksh {(l*0.1).toFixed(2)}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center' }}>
              <button type="submit" className="btn btn-success" disabled={submitting}>
                {submitting ? 'Sending STK Push…' : `Pay Ksh ${(form.litres*0.1).toFixed(2)}`}
              </button>
              <span style={{ fontSize: 13, color: '#9aa0a6' }}>M-Pesa prompt will appear on phone</span>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9aa0a6' }} />
          <input placeholder="Search by phone, node or M-Pesa code…" value={search}
            onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto', minWidth: 140 }}>
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e8eaed' }}>
                {['Phone','Node','County','Litres','Amount','M-Pesa Code','Status','Date'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: '#5f6368', fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f3f4', background: i%2===0?'white':'#fcfcfc' }}>
                  <td style={{ padding: '11px 14px', fontWeight: 500 }}>{p.phone}</td>
                  <td style={{ padding: '11px 14px', color: '#3c4043' }}>{p.node_name}</td>
                  <td style={{ padding: '11px 14px', color: '#5f6368' }}>{p.county}</td>
                  <td style={{ padding: '11px 14px', fontWeight: 600, color: '#1a7fd4' }}>{p.litres}L</td>
                  <td style={{ padding: '11px 14px', fontWeight: 700, color: '#0d9e75' }}>Ksh {p.amount_ksh}</td>
                  <td style={{ padding: '11px 14px', color: '#9aa0a6', fontFamily: 'monospace', fontSize: 11 }}>{p.mpesa_code || '—'}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {statusIcon(p.status)} {p.status}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px', color: '#9aa0a6', whiteSpace: 'nowrap' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#9aa0a6' }}>No payments found</div>
          )}
        </div>
      </div>
    </div>
  )
}
