import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Eye, EyeOff, AlertCircle, UserPlus, LogIn, ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import AuthCard from '../components/auth/AuthCard'
import LocationPicker from '../components/ui/LocationPicker'
import { KENYA_COUNTIES } from '../lib/kenya'

const PUBLIC_ROLES = [
  { value: 'citizen', label: 'Citizen / Tenant — pay & report' },
  { value: 'operator', label: 'Operator — kiosks & meters' },
  { value: 'technician', label: 'Technician — repairs' },
]

function FieldError({ text }) {
  if (!text) return null
  return (
    <div style={{
      background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
      padding: '10px 14px', marginBottom: '14px', color: '#dc2626', fontSize: '13.5px',
      display: 'flex', alignItems: 'center', gap: '8px',
    }}>
      <AlertCircle size={15} /> {text}
    </div>
  )
}

// Ask Maji (global assistant widget) for password help.
function askMajiPasswordHelp() {
  try {
    window.dispatchEvent(new CustomEvent('maji:ask', {
      detail: 'I forgot my password. How do I recover my account?',
    }))
  } catch (e) { /* widget absent */ }
}

function SignInForm({ adminOnly = false }) {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (adminOnly) {
        // Dedicated admin gate: the server rejects non-admin roles here.
        const res = await api.post('/auth/admin-login', formData)
        if (res && res.token && res.user) {
          try {
            localStorage.setItem('token', res.token)
            localStorage.setItem('user', JSON.stringify(res.user))
          } catch (err) { /* private mode */
          }
          window.location.href = '/app/dashboard'
          return
        }
        setError('Unexpected response from server.')
      } else {
        const result = await login(formData.email, formData.password, remember)
        if (result.success) {
          navigate('/app/dashboard', { replace: true })
        } else {
          setError(result.error || 'Login failed. Please check your credentials.')
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <FieldError text={error} />
      <div className="auth-field">
        <label>Email address</label>
        <input type="email" required value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="you@example.com" autoComplete="email" />
      </div>
      <div className="auth-field">
        <label>Password</label>
        <div style={{ position: 'relative' }}>
          <input type={showPassword ? 'text' : 'password'} required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Enter your password" autoComplete="current-password"
            style={{ paddingRight: 44 }} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password"
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>
      {!adminOnly && (
        <div className="auth-meta-row">
          <label className="auth-check">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember me
          </label>
          <button type="button" className="auth-link" onClick={askMajiPasswordHelp}>
            Forgot password?
          </button>
        </div>
      )}
      <button type="submit" className="auth-cta" disabled={loading}>
        {loading ? (adminOnly ? 'Verifying…' : 'Signing in…') : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {adminOnly ? <ShieldCheck size={17} /> : <LogIn size={17} />}
            {adminOnly ? 'Unlock console' : 'Sign In'}
          </span>
        )}
      </button>
      {!adminOnly && (
        <p className="auth-alt">
          Citizens stay signed in on this device when Remember is on. Shared devices: turn it off.
        </p>
      )}
    </form>
  )
}

function SignUpForm() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', county: '', role: 'citizen', phone: '',
    national_id: '', id_document: '', certifications: '',
    base_latitude: '', base_longitude: '', base_location: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()
  const isFieldStaff = ['operator', 'technician'].includes(formData.role)

  const fileToData = (key) => (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    if (f.size > 2000000) {
      setError('Document too large — max 2MB per file.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setFormData((d) => ({ ...d, [key]: reader.result }))
    reader.readAsDataURL(f)
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (isFieldStaff && !formData.national_id.trim()) {
      setError('National ID number is required for operator/technician accounts.')
      return
    }
    if (isFieldStaff && !formData.id_document) {
      setError('Please upload your National ID document for verification.')
      return
    }
    setLoading(true)
    try {
      const result = await register(formData)
      if (result.success) navigate('/app/dashboard', { replace: true })
      else setError(result.error || 'Registration failed. Please try again.')
    } catch (err) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <FieldError text={error} />
      <div className="auth-field">
        <label>Full name</label>
        <input type="text" required value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="John Doe" autoComplete="name" />
      </div>
      <div className="auth-field">
        <label>Email address</label>
        <input type="email" required value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="you@example.com" autoComplete="email" />
      </div>
      <div className="auth-field">
        <label>Password</label>
        <div style={{ position: 'relative' }}>
          <input type={showPassword ? 'text' : 'password'} required minLength={6}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="At least 6 characters" autoComplete="new-password"
            style={{ paddingRight: 44 }} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password"
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>
      <div className="auth-field">
        <label>County</label>
        <select required value={formData.county} onChange={(e) => setFormData({ ...formData, county: e.target.value })}>
          <option value="">Select your county</option>
          {KENYA_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="auth-field">
        <label>I am joining as</label>
        <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
          {PUBLIC_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0 0' }}>
          Field roles are verified by an admin before jobs unlock. Kenya DPA consent applies at signup.
        </p>
      </div>
      <div className="auth-field">
        <label>Phone (M-Pesa)</label>
        <input type="tel" value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="0712 345 678" autoComplete="tel" />
      </div>

      {isFieldStaff && (
        <div style={{ background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: '12px', padding: '14px', marginBottom: 12 }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '800' }}>
            Field verification (KYC) — reviewed before jobs unlock
          </p>
          <div className="auth-field">
            <label>National ID number *</label>
            <input type="text" value={formData.national_id}
              onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
              placeholder="e.g. 12345678" />
          </div>
          <div className="auth-field">
            <label>National ID document * {formData.id_document && '✓ attached'}</label>
            <input type="file" accept="image/*,.pdf" onChange={fileToData('id_document')} />
          </div>
          <div className="auth-field">
            <label>Certifications {formData.certifications && '✓ attached'} <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <input type="file" accept="image/*,.pdf" onChange={fileToData('certifications')} />
          </div>
          <div className="auth-field" style={{ marginBottom: 0 }}>
            <label>Work base location</label>
            <LocationPicker
              compact
              onPick={(p) => {
                if (!p) return
                setFormData((d) => ({
                  ...d,
                  base_latitude: String(p.lat),
                  base_longitude: String(p.lng),
                  base_location: d.base_location || [p.name, p.details].filter(Boolean).join(', '),
                }))
              }}
            />
            {formData.base_location !== '' && (
              <input value={formData.base_location}
                onChange={(e) => setFormData({ ...formData, base_location: e.target.value })}
                placeholder="Base description, e.g. Ruaka depot"
                style={{ marginTop: 8 }} />
            )}
          </div>
        </div>
      )}

      <button type="submit" className="auth-cta" disabled={loading}>
        {loading ? 'Creating account…' : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <UserPlus size={17} /> Create Account
          </span>
        )}
      </button>
    </form>
  )
}

export default function Auth({ initialView = 'signin' }) {
  const [view, setView] = useState(initialView === 'admin' ? 'admin' : initialView === 'signup' ? 'signup' : 'signin')
  const adminOnly = view === 'admin'
  const navigate = useNavigate()
  const goView = (v) => {
    if (v === 'signin') navigate('/login')
    else if (v === 'signup') navigate('/register')
  }
  return (
    <div className="auth-stage mesh-dark">
      <div className="orb" style={{ width: 420, height: 420, top: '-120px', left: '-120px', background: 'rgba(34,211,238,.16)' }} />
      <div className="orb" style={{ width: 360, height: 360, bottom: '-140px', right: '-100px', background: 'rgba(13,158,117,.18)', animationDelay: '2s' }} />
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
        style={{ width: '100%', display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1 }}
      >
        <AuthCard view={view} onViewChange={goView}>
          <div className={'auth-pane' + (view === 'signin' ? ' on' : '')}>
            <h2 className="auth-title">Welcome back</h2>
            <p className="auth-sub">Sign in to your MajiSmart account</p>
            <SignInForm />
          </div>
          <div className={'auth-pane' + (view === 'signup' ? ' on' : '')}>
            <h2 className="auth-title">Create your account</h2>
            <p className="auth-sub">Take control of your water</p>
            <SignUpForm />
          </div>
          <div className={'auth-pane' + (view === 'admin' ? ' on' : '')}>
            <h2 className="auth-title">Admin console</h2>
            <p className="auth-sub">Restricted to system administrators</p>
            <SignInForm adminOnly />
          </div>
        </AuthCard>
      </motion.div>
    </div>
  )
}
