import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Wifi, Plus, Search, MapPin, Droplets, ChevronRight, X } from 'lucide-react'
import api from '../api'

const STATUS_COLOR = { active:'#0d9e75', warning:'#e8a020', offline:'#9aa0a6', maintenance:'#6f42c1' }
const TYPE_ICON = { borehole:'🕳️', tank:'🗄️', kiosk:'🏪', river_intake:'🌊' }

export default function Nodes() {
  const [nodes, setNodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:'', location:'', county:'', latitude:'', longitude:'', type:'borehole', capacity_litres:10000 })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () => {
    api.get('/nodes').then(setNodes).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const filtered = nodes.filter(n => {
    const q = search.toLowerCase()
    const match = !q || n.name.toLowerCase().includes(q) || n.county.toLowerCase().includes(q) || n.location.toLowerCase().includes(q)
    const st = !filterStatus || n.status === filterStatus
    return match && st
  })

  const save = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/nodes', form)
      setMsg('Node created!'); setShowForm(false)
      setForm({ name:'', location:'', county:'', latitude:'', longitude:'', type:'borehole', capacity_litres:10000 })
      load()
    } catch (err) { setMsg(err.error || 'Failed') }
    finally { setSaving(false); setTimeout(() => setMsg(''), 3000) }
  }

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Wifi size={24} color="#1a7fd4" /> Water Nodes
          </h1>
          <p style={{ color: '#5f6368', marginTop: 4 }}>{nodes.length} nodes across Kenya</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Add Node
        </button>
      </div>

      {msg && <div className={`alert-bar ${msg.includes('!') ? 'alert-bar-success' : 'alert-bar-error'}`}>{msg}</div>}

      {/* Add node form */}
      {showForm && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Add New Node</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#9aa0a6' }}><X size={18} /></button>
          </div>
          <form onSubmit={save}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
              {[
                { k:'name', ph:'Kiambu Borehole 1', label:'Node name' },
                { k:'location', ph:'Thika Road, Kiambu', label:'Location' },
                { k:'county', ph:'Kiambu', label:'County' },
                { k:'latitude', ph:'-1.0332', label:'Latitude' },
                { k:'longitude', ph:'36.8279', label:'Longitude' },
                { k:'capacity_litres', ph:'10000', label:'Capacity (L)', type:'number' },
              ].map(f => (
                <div className="form-group" key={f.k} style={{ marginBottom: 0 }}>
                  <label>{f.label}</label>
                  <input type={f.type||'text'} placeholder={f.ph} value={form[f.k]}
                    onChange={e => setForm(x => ({...x, [f.k]: e.target.value}))}
                    required={['name','location','county'].includes(f.k)} />
                </div>
              ))}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Type</label>
                <select value={form.type} onChange={e => setForm(x => ({...x, type: e.target.value}))}>
                  <option value="borehole">Borehole</option>
                  <option value="tank">Tank</option>
                  <option value="kiosk">Kiosk</option>
                  <option value="river_intake">River Intake</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Create Node'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9aa0a6' }} />
          <input placeholder="Search nodes…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto', minWidth: 140 }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="warning">Warning</option>
          <option value="offline">Offline</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {/* Node cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
        {filtered.map(n => (
          <Link key={n.id} to={`/app/nodes/${n.id}`} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: 20, transition: 'transform .15s,box-shadow .15s', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow-md)' }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{TYPE_ICON[n.type] || '💧'}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#202124' }}>{n.name}</div>
                    <div style={{ fontSize: 12, color: '#9aa0a6', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={11} />{n.location}
                    </div>
                  </div>
                </div>
                <span className={`badge badge-${n.status}`}>{n.status}</span>
              </div>

              {/* Water level bar */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#5f6368' }}>Water level</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: STATUS_COLOR[n.status] }}>
                    {n.water_level ?? '--'}%
                  </span>
                </div>
                <div style={{ height: 7, background: '#f1f3f4', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: (n.water_level ?? 0)+'%', borderRadius: 99, background: STATUS_COLOR[n.status], transition: 'width 1s' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, fontSize: 12 }}>
                <div style={{ background: '#f8f9fa', borderRadius: 7, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ color: '#9aa0a6' }}>Flow</div>
                  <div style={{ fontWeight: 600, color: '#202124' }}>{n.flow_rate ? n.flow_rate+'L/m' : '--'}</div>
                </div>
                <div style={{ background: '#f8f9fa', borderRadius: 7, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ color: '#9aa0a6' }}>Revenue</div>
                  <div style={{ fontWeight: 600, color: '#0d9e75' }}>Ksh {Number(n.revenue_ksh||0).toFixed(0)}</div>
                </div>
                <div style={{ background: '#f8f9fa', borderRadius: 7, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ color: '#9aa0a6' }}>County</div>
                  <div style={{ fontWeight: 600, color: '#202124', fontSize: 11 }}>{n.county}</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9aa0a6' }}>
          <Wifi size={40} style={{ marginBottom: 12, opacity: .3 }} />
          <p>No nodes found</p>
        </div>
      )}
    </div>
  )
}
