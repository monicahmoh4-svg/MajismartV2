import { useState, useEffect } from 'react'
import { Cpu, Plus, X, RefreshCw, Copy, CheckCircle } from 'lucide-react'
import api from '../api'

// Device fleet: provision field hardware, rotate keys, suspend/retire.
// Only staff who run hardware (admin, operator) can open this page.
export default function Devices() {
  const [devices, setDevices] = useState([])
  const [nodes, setNodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ device_id: '', name: '', kind: 'level', node_id: '', firmware: '' })
  const [saving, setSaving] = useState(false)
  const [newKey, setNewKey] = useState(null)
  const [busy, setBusy] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [d, n] = await Promise.all([
        api.get('/devices?limit=200'),
        api.get('/nodes').catch(() => []),
      ])
      setDevices(Array.isArray(d) ? d : [])
      setNodes(Array.isArray(n) ? n : [])
    } catch (e) {
      setMsg({ ok: false, text: e.message || 'Could not load devices' })
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const flash = (ok, text) => {
    setMsg({ ok, text })
    setTimeout(() => setMsg(null), 5000)
  }

  const register = async (e) => {
    e.preventDefault(); setSaving(true); setNewKey(null)
    try {
      const res = await api.post('/devices/register', {
        ...form, node_id: form.node_id || undefined,
      })
      setNewKey({ id: res.device_id, key: res.api_key })
      setForm({ device_id: '', name: '', kind: 'level', node_id: '', firmware: '' })
      setShowForm(false)
      load()
    } catch (e2) {
      flash(false, e2.message || 'Registration failed')
    } finally {
      setSaving(false)
    }
  }

  const rotate = async (id, deviceId) => {
    if (!window.confirm(`Rotate the API key for ${deviceId}? The old key stops working immediately.`)) return
    setBusy(id)
    try {
      const res = await api.post(`/devices/${id}/rotate`, {})
      setNewKey({ id: res.device_id, key: res.api_key })
      load()
    } catch (e) {
      flash(false, e.message || 'Rotation failed')
    } finally {
      setBusy(null)
    }
  }

  const setStatus = async (id, status) => {
    setBusy(id)
    try {
      await api.patch(`/devices/${id}`, { status })
      load()
    } catch (e) {
      flash(false, e.message || 'Update failed')
    } finally {
      setBusy(null)
    }
  }

  const copy = async (t) => {
    try { await navigator.clipboard.writeText(t) } catch (e) { /* noop */ }
  }

  const ago = (ts) => {
    if (!ts) return 'never'
    const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 48) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Field Devices</h1>
          <p className="page-sub">Provision telemetry hardware, rotate keys, monitor last-seen. Keys authenticate devices — never share them.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={15} /> Register device
        </button>
      </div>

      {msg && <div className={`alert-bar ${msg.ok ? 'alert-bar-success' : 'alert-bar-error'}`}>{msg.text}</div>}

      {newKey && (
        <div className="panel" style={{ borderColor: '#f5c6c3', background: '#fef2f2' }}>
          <h2 style={{ margin: '0 0 6px 0', fontSize: 15, fontWeight: 800, color: '#a52820' }}>
            API key for {newKey.id} — shown once
          </h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <code style={{ flex: 1, minWidth: 220, background: 'white', border: '1px dashed #d93025', borderRadius: 8, padding: '10px 12px', fontSize: 13, overflowWrap: 'anywhere' }}>{newKey.key}</code>
            <button className="btn btn-ghost btn-sm" onClick={() => copy(newKey.key)}><Copy size={13} /> Copy</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setNewKey(null)}><X size={13} /> Dismiss</button>
          </div>
          <p className="muted-sm" style={{ marginTop: 8 }}>Program it into the device as X-Device-Key. Lost it? Rotate below.</p>
        </div>
      )}

      {showForm && (
        <form className="panel" onSubmit={register}>
          <div className="panel-h"><h2>Register device</h2></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Device ID *</label>
              <input required value={form.device_id} onChange={(e) => setForm({ ...form, device_id: e.target.value })} placeholder="MS-KE-0001" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Kibera kiosk level sensor" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Kind</label>
              <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                {['level', 'flow', 'pressure', 'quality', 'meter', 'valve', 'gateway', 'simulator', 'other'].map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Water point (optional)</label>
              <select value={form.node_id} onChange={(e) => setForm({ ...form, node_id: e.target.value })}>
                <option value="">Unlinked</option>
                {nodes.map((n) => <option key={n.id} value={n.id}>{n.name} — {n.county}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Firmware</label>
              <input value={form.firmware} onChange={(e) => setForm({ ...form, firmware: e.target.value })} placeholder="v1.2.0" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Registering…' : 'Register + issue key'}</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="panel">
        <div className="panel-h"><h2><Cpu size={16} /> Fleet ({devices.length})</h2></div>
        {devices.length === 0 && <p className="muted">No devices yet. Register your first sensor to start live telemetry (see backend/IOT.md).</p>}
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Device</th><th>Kind</th><th>Water point</th><th>Status</th><th>Last seen</th><th>Firmware</th><th>Actions</th></tr></thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id}>
                  <td><strong>{d.device_id}</strong><br /><span className="muted-sm">{d.name}</span></td>
                  <td><span className="chip">{d.kind}</span></td>
                  <td>{d.node_name || <span className="muted-sm">unlinked</span>}</td>
                  <td><span className={`badge badge-${d.status === 'active' ? 'active' : 'warning'}`}>{d.status}</span></td>
                  <td className="tnum">{ago(d.last_seen)}</td>
                  <td>{d.firmware || '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-ghost btn-sm" disabled={busy === d.id} onClick={() => rotate(d.id, d.device_id)}>
                      <RefreshCw size={13} /> Rotate key
                    </button>{' '}
                    {d.status === 'active' ? (
                      <button className="btn btn-ghost btn-sm" disabled={busy === d.id} onClick={() => setStatus(d.id, 'suspended')}>Suspend</button>
                    ) : (
                      <button className="btn btn-ghost btn-sm" disabled={busy === d.id} onClick={() => setStatus(d.id, 'active')}>
                        <CheckCircle size={13} /> Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
