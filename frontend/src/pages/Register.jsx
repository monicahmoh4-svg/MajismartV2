import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Droplets } from 'lucide-react'

const COUNTIES = ['Nairobi','Mombasa','Kisumu','Nakuru','Kiambu','Machakos','Kakamega','Meru','Kilifi','Uasin Gishu','Other']
const ROLES = [
  { value: 'admin', label: 'System Admin' },
  { value: 'county_officer', label: 'County Water Officer' },
  { value: 'operator', label: 'Node Operator' },
  { value: 'community', label: 'Community Manager' },
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'operator', county:'', phone:'' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({...f, [k]: e.target.value}))

  const submit = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await register(form)
      navigate('/app/dashboard')
    } catch (err) {
      setError(err.error || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0c1a2e,#0d3a6e)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Droplets size={26} color="white" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Create account</h1>
          <p style={{ color: '#5f6368', fontSize: 14 }}>Join MajiSmart Kenya</p>
        </div>

        {error && <div className="alert-bar alert-bar-error">{error}</div>}

        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Full name</label>
              <input placeholder="Jane Wanjiku" value={form.name} onChange={set('name')} required />
            </div>
            <div className="form-group">
              <label>Phone number</label>
              <input placeholder="0712345678" value={form.phone} onChange={set('phone')} />
            </div>
          </div>
          <div className="form-group">
            <label>Email address</label>
            <input type="email" placeholder="jane@county.go.ke" value={form.email} onChange={set('email')} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Role</label>
              <select value={form.role} onChange={set('role')}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>County</label>
              <select value={form.county} onChange={set('county')}>
                <option value="">Select county</option>
                {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12, fontSize: 15 }} disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#5f6368', marginTop: 20 }}>
          Already registered? <Link to="/login" style={{ color: '#1a7fd4', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
