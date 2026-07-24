import { useState, useEffect } from 'react'
import { Users as UsersIcon, Search, Plus, X, Shield, MapPin } from 'lucide-react'
import api from '../api'

const ROLES = ['admin','county_officer','operator','community']
const COUNTIES = ['Nairobi','Mombasa','Kisumu','Nakuru','Kiambu','Machakos','Kakamega','Meru','Kilifi','Uasin Gishu','Other']
const ROLE_COLOR = { admin: 'critical', county_officer: 'active', operator: 'info', community: 'warning' }

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'operator', county:'', phone:'' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () => api.get('/users').then(setUsers).finally(() => setLoading(false))
  useEffect(load, [])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      && (!filterRole || u.role === filterRole)
  })

  const save = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/auth/register', form)
      setMsg('User created!'); setShowForm(false)
      setForm({ name:'', email:'', password:'', role:'operator', county:'', phone:'' })
      load()
    } catch (err) { setMsg(err.error || 'Failed') }
    finally { setSaving(false); setTimeout(() => setMsg(''), 4000) }
  }

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <UsersIcon size={24} color="#e8a020" /> User Management
          </h1>
          <p style={{ color: '#5f6368', marginTop: 4 }}>{users.length} registered users across all roles</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={16} /> Add User</button>
      </div>

      {msg && <div className={`alert-bar ${msg.includes('!') ? 'alert-bar-success' : 'alert-bar-error'}`}>{msg}</div>}

      {/* Role summary badges */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {ROLES.map(r => {
          const count = users.filter(u => u.role === r).length
          return (
            <div key={r} onClick={() => setFilterRole(filterRole === r ? '' : r)}
              style={{ padding: '6px 14px', borderRadius: 99, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background: filterRole === r ? '#1a7fd4' : '#f1f3f4',
                color: filterRole === r ? 'white' : '#3c4043', border: filterRole === r ? '1px solid #1a7fd4' : '1px solid #e8eaed' }}>
              {r.replace('_',' ')} ({count})
            </div>
          )
        })}
      </div>

      {/* Add user form */}
      {showForm && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700 }}>Add New User</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#9aa0a6', cursor: 'pointer' }}><X size={18} /></button>
          </div>
          <form onSubmit={save}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
              {[
                { k: 'name', ph: 'Full name', label: 'Name' },
                { k: 'email', ph: 'email@example.com', label: 'Email', type: 'email' },
                { k: 'password', ph: 'Min 6 chars', label: 'Password', type: 'password' },
                { k: 'phone', ph: '0712345678', label: 'Phone' },
              ].map(f => (
                <div className="form-group" key={f.k} style={{ marginBottom: 0 }}>
                  <label>{f.label}</label>
                  <input type={f.type || 'text'} placeholder={f.ph} value={form[f.k]}
                    onChange={e => setForm(x => ({ ...x, [f.k]: e.target.value }))}
                    required={['name','email','password'].includes(f.k)} />
                </div>
              ))}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Role</label>
                <select value={form.role} onChange={e => setForm(x => ({ ...x, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>County</label>
                <select value={form.county} onChange={e => setForm(x => ({ ...x, county: e.target.value }))}>
                  <option value="">Select county</option>
                  {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create User'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9aa0a6' }} />
        <input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
      </div>

      {/* Users table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e8eaed' }}>
                {['User', 'Email', 'Role', 'County', 'Phone', 'Joined'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 600, color: '#5f6368', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f3f4', background: i % 2 === 0 ? 'white' : '#fcfcfc' }}>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#e8f4fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#1a7fd4', flexShrink: 0 }}>
                        {u.name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px', color: '#5f6368' }}>{u.email}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span className={`badge badge-${ROLE_COLOR[u.role] || 'info'}`} style={{ fontSize: 11 }}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px', color: '#5f6368' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={11} />{u.county || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px', color: '#9aa0a6', fontFamily: 'monospace', fontSize: 12 }}>{u.phone || '—'}</td>
                  <td style={{ padding: '11px 14px', color: '#9aa0a6' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#9aa0a6' }}>No users found</div>}
        </div>
      </div>
    </div>
  )
}
