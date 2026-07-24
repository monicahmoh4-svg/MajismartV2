import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Droplets, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)

  const submit = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/app/dashboard')
    } catch (err) {
      setError(err.error || 'Login failed')
    } finally { setLoading(false) }
  }

  const fill = (email, pw) => setForm({ email, password: pw })

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0c1a2e,#0d3a6e)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Droplets size={26} color="white" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Welcome back</h1>
          <p style={{ color: '#5f6368', fontSize: 14 }}>Sign in to MajiSmart</p>
        </div>

        {error && <div className="alert-bar alert-bar-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Email address</label>
            <input type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
          </div>
          <div className="form-group" style={{ position: 'relative' }}>
            <label>Password</label>
            <input type={show ? 'text' : 'password'} placeholder="••••••••" value={form.password}
              onChange={e => setForm(f => ({...f, password: e.target.value}))} required
              style={{ paddingRight: 44 }} />
            <button type="button" onClick={() => setShow(!show)}
              style={{ position: 'absolute', right: 12, top: 34, background: 'none', border: 'none', color: '#9aa0a6', padding: 4 }}>
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 8, fontSize: 15 }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={{ margin: '20px 0', borderTop: '1px solid #e8eaed', paddingTop: 16 }}>
          <p style={{ fontSize: 12, color: '#9aa0a6', marginBottom: 8, textAlign: 'center' }}>Quick demo access</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[['Admin','admin@majismart.ke'],['County','county@majismart.ke'],['Operator','operator@majismart.ke']].map(([label, email]) => (
              <button key={label} onClick={() => fill(email, 'admin123')}
                style={{ padding: '6px 4px', fontSize: 12, background: '#f1f3f4', border: '1px solid #e8eaed', borderRadius: 6, cursor: 'pointer', color: '#3c4043' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#5f6368' }}>
          No account? <Link to="/register" style={{ color: '#1a7fd4', fontWeight: 600 }}>Register here</Link>
        </p>
      </div>
    </div>
  )
}
