import { useState, useEffect } from 'react'
import { Settings as Gear, User, Bell, Shield, Database, Save, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function Settings() {
  const { user, login } = useAuth()
  const [profile, setProfile] = useState({ name: user?.name || '', phone: '', county: user?.county || '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [tab, setTab] = useState('profile')

  const saveProfile = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await api.patch(`/users/${user.id}`, profile)
      setMsg('Profile updated!')
    } catch { setMsg('Save failed') }
    finally { setSaving(false); setTimeout(() => setMsg(''), 3000) }
  }

  const COUNTIES = ['Nairobi','Mombasa','Kisumu','Nakuru','Kiambu','Machakos','Kakamega','Meru','Kilifi','Uasin Gishu','Other']

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Gear size={24} color="#5f6368" /> Settings
        </h1>
        <p style={{ color: '#5f6368', marginTop: 4 }}>Manage your account and system preferences</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Sidebar tabs */}
        <div className="card" style={{ padding: 8 }}>
          {[
            { id: 'profile', icon: User, label: 'Profile' },
            { id: 'notifications', icon: Bell, label: 'Notifications' },
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

        {/* Content */}
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
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Notification Preferences</h2>
              {[
                { label: 'Critical alerts (tank level below 20%)', desc: 'Receive SMS and email when water critically low', enabled: true },
                { label: 'Pump failure alerts', desc: 'Notify when flow rate drops to zero', enabled: true },
                { label: 'Water quality alerts', desc: 'Alert when turbidity exceeds WHO limits', enabled: true },
                { label: 'Payment confirmations', desc: 'Receive summary of daily M-Pesa transactions', enabled: false },
                { label: 'Maintenance reminders', desc: 'Monthly maintenance schedule notifications', enabled: false },
              ].map(n => (
                <div key={n.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 0', borderBottom: '1px solid #f1f3f4', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{n.label}</div>
                    <div style={{ fontSize: 13, color: '#5f6368', marginTop: 2 }}>{n.desc}</div>
                  </div>
                  <div style={{
                    width: 40, height: 22, borderRadius: 99, flexShrink: 0,
                    background: n.enabled ? '#0d9e75' : '#e8eaed', cursor: 'pointer',
                    position: 'relative', transition: 'background .2s'
                  }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', background: 'white',
                      position: 'absolute', top: 3, left: n.enabled ? 21 : 3, transition: 'left .2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,.2)'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'security' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Security</h2>
              <div style={{ background: '#f8f9fa', borderRadius: 10, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Change Password</div>
                <div style={{ fontSize: 13, color: '#5f6368', marginBottom: 16 }}>Use a strong password with at least 8 characters</div>
                <div style={{ display: 'grid', gap: 12 }}>
                  <input type="password" placeholder="Current password" />
                  <input type="password" placeholder="New password" />
                  <input type="password" placeholder="Confirm new password" />
                  <button className="btn btn-primary" style={{ width: 'fit-content' }}><Shield size={15} /> Update Password</button>
                </div>
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
                { label: 'Application', val: 'MajiSmart v1.0.0' },
                { label: 'Backend', val: 'Node.js + Express' },
                { label: 'Database', val: 'PostgreSQL (Railway)' },
                { label: 'Payment Gateway', val: 'M-Pesa Daraja API' },
                { label: 'SMS Provider', val: "Africa's Talking" },
                { label: 'IoT Protocol', val: 'GSM/2G + REST API' },
                { label: 'Hosting', val: 'Railway.app' },
                { label: 'API Version', val: 'v1' },
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
