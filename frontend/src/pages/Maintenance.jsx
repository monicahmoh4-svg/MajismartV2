import { useState, useEffect } from 'react'
import { Wrench, Plus, X, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api'

const TYPES = ['Routine inspection','Pump repair','Sensor calibration','Pipe replacement','Solar panel maintenance','Valve service','Software update','Emergency repair','Other']

export default function Maintenance() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [nodes, setNodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ node_id:'', description:'', type:'Routine inspection', cost_ksh:'' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () => {
    const q = user?.county ? `?county=${encodeURIComponent(user.county)}` : ''
    Promise.all([
      api.get('/dashboard/maintenance'),
      api.get(`/nodes${q}`)
    ]).then(([m, n]) => { setLogs(m); setNodes(n) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [user])

  const save = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/dashboard/maintenance', { ...form, user_id: user.id })
      setMsg('Logged!'); setShowForm(false)
      setForm({ node_id:'', description:'', type:'Routine inspection', cost_ksh:'' })
      load()
    } catch (err) { setMsg(err.error || 'Failed') }
    finally { setSaving(false); setTimeout(() => setMsg(''), 3000) }
  }

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Wrench size={24} color="#7a3fb5" /> Maintenance Log
          </h1>
          <p style={{ color: '#5f6368', marginTop: 4 }}>{logs.length} maintenance events recorded</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={16} /> Log Maintenance</button>
      </div>

      {msg && <div className={`alert-bar ${msg.includes('!') ? 'alert-bar-success' : 'alert-bar-error'}`}>{msg}</div>}

      {showForm && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700 }}>Log Maintenance Event</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#9aa0a6', cursor: 'pointer' }}><X size={18} /></button>
          </div>
          <form onSubmit={save}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Node</label>
                <select value={form.node_id} onChange={e => setForm(f => ({ ...f, node_id: e.target.value }))} required>
                  <option value="">Select node</option>
                  {nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Cost (Ksh)</label>
                <input type="number" placeholder="0" value={form.cost_ksh} onChange={e => setForm(f => ({ ...f, cost_ksh: e.target.value }))} />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 12 }}>
              <label>Description</label>
              <textarea rows={3} placeholder="Describe work done…" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e8eaed', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Log'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Logs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {logs.length === 0 && (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: '#9aa0a6' }}>
            <CheckCircle size={36} color="#0d9e75" style={{ display: 'block', margin: '0 auto 12px', opacity: .5 }} />
            <p>No maintenance events logged yet. Click "Log Maintenance" to start.</p>
          </div>
        )}
        {logs.map(l => (
          <div key={l.id} className="card" style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0e8fc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Wrench size={18} color="#7a3fb5" />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{l.node_name}</span>
                  <span style={{ fontSize: 12, color: '#9aa0a6', marginLeft: 8 }}>{l.type}</span>
                </div>
                <span style={{ fontSize: 12, color: '#9aa0a6' }}>{new Date(l.created_at).toLocaleString()}</span>
              </div>
              <p style={{ fontSize: 13, color: '#3c4043', margin: '0 0 6px' }}>{l.description}</p>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#5f6368' }}>
                {l.technician_name && <span>👷 {l.technician_name}</span>}
                {l.cost_ksh && <span style={{ color: '#0d9e75', fontWeight: 600 }}>Ksh {Number(l.cost_ksh).toLocaleString()}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
