import { useState, useEffect } from 'react'
import { Settings as Gear, User, Bell, Shield, Database, Save, CheckCircle, MessageCircle, Send } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api'
export default function Settings() {
  const { user, login } = useAuth()
  const [profile, setProfile] = useState({ name: user?.name || '', phone: '', county: user?.county || '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [tab, setTab] = useState('profile')
  // Security tab (wired to POST /api/auth/change-password)
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [pwBusy, setPwBusy] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)
  // Inbox tab (real notifications)
  const [inbox, setInbox] = useState([])
  // Support tab (messages to admins)
  const [supForm, setSupForm] = useState({ subject: '', body: '' })
  const [supBusy, setSupBusy] = useState(false)
  const [supMsg, setSupMsg] = useState(null)
  const [sentMsgs, setSentMsgs] = useState([])
  const saveProfile = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await api.patch(`/users/${user.id}`, profile)
      setMsg('Profile updated!')
    } catch { setMsg('Save failed') }
    finally { setSaving(false); setTimeout(() => setMsg(''), 3000) }
  }
  const COUNTIES = ['Nairobi','Mombasa','Kisumu','Nakuru','Kiambu','Machakos','Kakamega','Meru','Kilifi','Uasin Gishu','Other']

  useEffect(() => {
    if (tab !== 'notifications' && tab !== 'support') return
    let alive = true
    api.get('/notifications/mine').then((r) => {
      if (alive && tab === 'notifications' && Array.isArray(r)) setInbox(r)
    }).catch(() => {})
    api.get('/messages/mine').then((r) => {
      if (alive && tab === 'support' && Array.isArray(r)) setSentMsgs(r)
    }).catch(() => {})
    return () => { alive = false }
  }, [tab])

  const changePassword = async (e) => {
    e.preventDefault()
    setPwMsg(null)
    if (pwForm.new_password !== pwForm.confirm) {
      setPwMsg({ ok: false, text: 'New passwords do not match.' })
      return
    }
    setPwBusy(true)
    try {
      const res = await api.post('/auth/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      })
      setPwMsg({ ok: true, text: res.message || 'Password updated.' })
      setPwForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err) {
      setPwMsg({ ok: false, text: err.message || 'Update failed' })
    } finally {
      setPwBusy(false)
    }
  }

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`, {})
      setInbox((list) => list.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    } catch (e) { /* noop */ }
  }

  const sendSupport = async (e) => {
    e.preventDefault()
    if (!supForm.body.trim()) return
    setSupBusy(true)
    setSupMsg(null)
    try {
      await api.post('/messages', { subject: supForm.subject.trim() || undefined, body: supForm.body.trim() })
      setSupMsg({ ok: true, text: 'Sent — the admin team replies as a notification.' })
      setSupForm({ subject: '', body: '' })
      const fresh = await api.get('/messages/mine').catch(() => [])
      if (Array.isArray(fresh)) setSentMsgs(fresh)
    } catch (err) {
      setSupMsg({ ok: false, text: err.message || 'Send failed' })
    } finally {
      setSupBusy(false)
    }
  }
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Gear size={24} color="#5f6368" /> Settings
        </h1>
        <p style={{ color: '#5f6368', marginTop: 4 }}>Manage your account and system preferences</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20, alignItems: 'start' }}>
        <div className="card" style={{ padding: 8 }}>
          {[
            { id: 'profile', icon: User, label: 'Profile' },
            { id: 'notifications', icon: Bell, label: 'Inbox' },
            { id: 'support', icon: MessageCircle, label: 'Support' },
            { id: 'security', icon: Shield, label: 'Security' },
            { id: 'system', icon: Database, label: 'System Info' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 8, border: 'none', textAlign: 'left',
                fontSize: 14, cursor: 'pointer', marginBottom: 2,
                background: tab === t.id ? '#e8f4fd' : 'transparent',
                color: tab === t.id ? '#1a7fd4' : '#5f6368', fontWeight: tab === t.id ? 600 : 400
              }}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>
        <div className="card" style={{ padding: 28 }}>
          {msg && <div className={`alert-bar ${msg.includes('!') ? 'alert-bar-success' : 'alert-bar-error'}`} style={{ marginBottom: 20 }}>{msg}</div>}
          {tab === 'profile' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Profile Settings</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 800, fontSize: 24
                }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.name}</div>
                  <div style={{ color: '#5f6368', fontSize: 14 }}>{user?.email}</div>
                  <span className={`badge badge-info`} style={{ marginTop: 4 }}>{user?.role?.replace('_',' ')}</span>
                </div>
              </div>
              <form onSubmit={saveProfile}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
                  <div className="form-group">
                    <label>Full name</label>
                    <input value={profile.name} onChange={e => setProfile(p => ({...p, name: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label>Email (read-only)</label>
                    <input value={user?.email} readOnly style={{ background: '#f8f9fa', color: '#9aa0a6' }} />
                  </div>
                  <div className="form-group">
                    <label>Phone number</label>
                    <input placeholder="0712345678" value={profile.phone} onChange={e => setProfile(p => ({...p, phone: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label>County</label>
                    <select value={profile.county} onChange={e => setProfile(p => ({...p, county: e.target.value}))}>
                      <option value="">Select county</option>
                      {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 8 }}>
                  <Save size={15} /> {saving ? 'Saving…' : 'Save Profile'}
                </button>
              </form>
            </div>
          )}
          {tab === 'notifications' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Inbox</h2>
              {inbox.length === 0 && (
                <p style={{ fontSize: 14, color: '#64748b' }}>No notifications yet. Admin broadcasts and replies appear here.</p>
              )}
              {inbox.map((n) => (
                <div key={n.id} style={{ padding: '14px 0', borderBottom: '1px solid #f1f5f9', opacity: n.is_read ? 0.7 : 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center' }}>
                    {!n.is_read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', flexShrink: 0 }} />}
                    {n.title}
                  </div>
                  <p style={{ fontSize: 13, color: '#475569', margin: '6px 0' }}>{n.message}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(n.created_at).toLocaleString()}</span>
                    {!n.is_read && (
                      <button onClick={() => markRead(n.id)} style={{ background: 'none', border: 'none', color: '#1a7fd4', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 'support' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Contact support</h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px 0' }}>Write to the admin team — replies arrive as notifications.</p>
              {supMsg && <div className={`alert-bar ${supMsg.ok ? 'alert-bar-success' : 'alert-bar-error'}`} style={{ marginBottom: 16 }}>{supMsg.text}</div>}
              <form onSubmit={sendSupport} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                <input value={supForm.subject} onChange={(e) => setSupForm({ ...supForm, subject: e.target.value })} placeholder="Subject (optional)" maxLength={200} />
                <textarea value={supForm.body} onChange={(e) => setSupForm({ ...supForm, body: e.target.value })} required placeholder="How can we help?" rows={4} maxLength={4000} />
                <button type="submit" className="btn btn-primary" disabled={supBusy} style={{ width: 'fit-content' }}>
                  <Send size={15} /> {supBusy ? 'Sending…' : 'Send message'}
                </button>
              </form>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>My messages</h3>
              {sentMsgs.length === 0 && <p style={{ fontSize: 14, color: '#64748b' }}>No messages sent yet.</p>}
              {sentMsgs.map((m) => (
                <div key={m.id} style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{m.subject || '(no subject)'}</div>
                  <p style={{ fontSize: 13, color: '#475569', margin: '4px 0' }}>{m.body}</p>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(m.created_at).toLocaleString()} · {m.is_read ? 'seen by admin' : 'sent'}</span>
                </div>
              ))}
            </div>
          )}
          {tab === 'security' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Security</h2>
              <div style={{ background: '#f8f9fa', borderRadius: 10, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Change Password</div>
                <div style={{ fontSize: 13, color: '#5f6368', marginBottom: 16 }}>Use a strong password with at least 6 characters</div>
                {pwMsg && <div className={`alert-bar ${pwMsg.ok ? 'alert-bar-success' : 'alert-bar-error'}`} style={{ marginBottom: 12 }}>{pwMsg.text}</div>}
                <form onSubmit={changePassword} style={{ display: 'grid', gap: 12 }}>
                  <input type="password" placeholder="Current password" value={pwForm.current_password} onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })} required />
                  <input type="password" placeholder="New password" value={pwForm.new_password} onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} required minLength={6} />
                  <input type="password" placeholder="Confirm new password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} required />
                  <button type="submit" className="btn btn-primary" disabled={pwBusy} style={{ width: 'fit-content' }}><Shield size={15} /> {pwBusy ? 'Updating…' : 'Update Password'}</button>
                </form>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: '#e1f5ee', borderRadius: 10 }}>
                <CheckCircle size={18} color="#0d9e75" />
                <span style={{ fontSize: 14, color: '#0a7a5c' }}>Your account is secured with JWT authentication</span>
              </div>
            </div>
          )}
          {tab === 'system' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>System Information</h2>
              {[
                { label: 'Application', val: 'MajiSmart OS v6.1' },
                { label: 'Backend', val: 'Node.js + Express' },
                { label: 'Database', val: 'PostgreSQL (Render)' },
                { label: 'Payment Gateway', val: 'M-Pesa Daraja API' },
                { label: 'SMS Provider', val: "Africa's Talking" },
                { label: 'IoT Protocol', val: 'GSM/4G + key-authenticated REST ingest' },
                { label: 'Hosting', val: 'Render (API) · Vercel (app)' },
                { label: 'API Version', val: 'v6' },
              ].map(i => (
                <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f3f4', fontSize: 14 }}>
                  <span style={{ color: '#5f6368' }}>{i.label}</span>
                  <span style={{ fontWeight: 600, color: '#202124' }}>{i.val}</span>
                </div>
              ))}
              <div style={{ marginTop: 20, padding: '14px 16px', background: '#e8f4fd', borderRadius: 10, fontSize: 13, color: '#185fa5' }}>
                API Base URL: <code style={{ fontFamily: 'monospace', background: '#c5dff5', padding: '2px 6px', borderRadius: 4 }}>/api</code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
