import { useState, useEffect } from 'react'
import { Bell, AlertTriangle, CheckCircle, Info, Filter } from 'lucide-react'
import api from '../api'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('open')
  const [severity, setSeverity] = useState('')
  const [resolving, setResolving] = useState(null)

  const load = () => {
    const q = filter === 'open' ? 'resolved=false' : filter === 'resolved' ? 'resolved=true' : ''
    api.get(`/alerts?${q}&limit=100${severity?'&severity='+severity:''}`)
      .then(setAlerts).finally(() => setLoading(false))
  }
  useEffect(load, [filter, severity])

  const resolve = async (id) => {
    setResolving(id)
    await api.patch(`/alerts/${id}/resolve`, {})
    setResolving(null)
    load()
  }

  const sevIcon = s => s === 'critical' ? <AlertTriangle size={16} color="#d93025" />
    : s === 'warning' ? <AlertTriangle size={16} color="#e8a020" />
    : <Info size={16} color="#1a7fd4" />

  const sevBg = s => s === 'critical' ? '#fce8e6' : s === 'warning' ? '#fef3d8' : '#e8f4fd'
  const sevBorder = s => s === 'critical' ? '#f5c6c3' : s === 'warning' ? '#fad99c' : '#b5d4f4'

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  const open = alerts.filter(a => !a.resolved).length
  const critical = alerts.filter(a => !a.resolved && a.severity === 'critical').length

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bell size={24} color="#d93025" /> Alerts
          {open > 0 && <span style={{ background: '#d93025', color: 'white', borderRadius: 99, fontSize: 13, padding: '1px 9px', fontWeight: 600 }}>{open}</span>}
        </h1>
        <p style={{ color: '#5f6368', marginTop: 4 }}>System alerts and notifications from all nodes</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Open', val: alerts.filter(a=>!a.resolved).length, color: '#d93025', bg: '#fce8e6' },
          { label: 'Critical', val: alerts.filter(a=>!a.resolved&&a.severity==='critical').length, color: '#d93025', bg: '#fce8e6' },
          { label: 'Warnings', val: alerts.filter(a=>!a.resolved&&a.severity==='warning').length, color: '#e8a020', bg: '#fef3d8' },
          { label: 'Resolved', val: alerts.filter(a=>a.resolved).length, color: '#0d9e75', bg: '#e1f5ee' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 12, color: s.color, opacity: .8 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['open','Open'],['resolved','Resolved'],['all','All']].map(([val,label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`btn ${filter===val?'btn-primary':'btn-ghost'}`} style={{ padding: '7px 16px' }}>
            {label}
          </button>
        ))}
        <select value={severity} onChange={e => setSeverity(e.target.value)} style={{ width: 'auto', minWidth: 140 }}>
          <option value="">All severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
      </div>

      {/* Alert list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {alerts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <CheckCircle size={40} color="#0d9e75" style={{ margin: '0 auto 12px', display: 'block', opacity: .5 }} />
            <p style={{ color: '#9aa0a6' }}>No alerts found</p>
          </div>
        )}
        {alerts.map(a => (
          <div key={a.id} style={{
            background: a.resolved ? 'white' : sevBg(a.severity),
            border: `1px solid ${a.resolved ? '#e8eaed' : sevBorder(a.severity)}`,
            borderRadius: 10, padding: '16px 18px',
            display: 'flex', gap: 14, alignItems: 'flex-start',
            opacity: a.resolved ? .6 : 1
          }}>
            <div style={{ marginTop: 2 }}>{sevIcon(a.severity)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{a.node_name}</span>
                  <span style={{ color: '#9aa0a6', fontSize: 12, marginLeft: 8 }}>{a.county}</span>
                </div>
                <span className={`badge badge-${a.severity==='critical'?'critical':a.severity==='warning'?'warning':'info'}`}>
                  {a.severity}
                </span>
              </div>
              <p style={{ fontSize: 14, color: '#3c4043', margin: '6px 0 4px' }}>{a.message}</p>
              <div style={{ fontSize: 12, color: '#9aa0a6', display: 'flex', gap: 16 }}>
                <span>Type: {a.type.replace(/_/g,' ')}</span>
                <span>{new Date(a.created_at).toLocaleString()}</span>
                {a.resolved && a.resolved_at && <span>Resolved: {new Date(a.resolved_at).toLocaleString()}</span>}
              </div>
            </div>
            {!a.resolved && (
              <button className="btn btn-success" style={{ padding: '6px 14px', fontSize: 13, flexShrink: 0 }}
                onClick={() => resolve(a.id)} disabled={resolving === a.id}>
                {resolving === a.id ? '…' : 'Resolve'}
              </button>
            )}
            {a.resolved && <CheckCircle size={18} color="#0d9e75" style={{ flexShrink: 0 }} />}
          </div>
        ))}
      </div>
    </div>
  )
}
