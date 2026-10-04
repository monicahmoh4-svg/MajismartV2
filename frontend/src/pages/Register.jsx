import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Droplets, Mail, Lock, Eye, EyeOff, AlertCircle, UserPlus, User, MapPin, Phone, FileUp, LocateFixed } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

import { KENYA_COUNTIES, USER_ROLES } from '../lib/kenya'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    county: '',
    role: 'citizen',
    phone: '',
    national_id: '',
    id_document: '',
    certifications: '',
    base_latitude: '',
    base_longitude: '',
    base_location: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [locating, setLocating] = useState(false)
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

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this device — enter coordinates manually.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((d) => ({
          ...d,
          base_latitude: pos.coords.latitude.toFixed(6),
          base_longitude: pos.coords.longitude.toFixed(6),
        }))
        setLocating(false)
      },
      () => {
        setError('Could not detect location — enter coordinates manually.')
        setLocating(false)
      },
      { timeout: 15000 }
    )
  }
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const counties = KENYA_COUNTIES

  const handleSubmit = async (e) => {
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
      
      if (result.success) {
        // Navigate after successful registration
        navigate('/dashboard', { replace: true })
      } else {
        setError(result.error || 'Registration failed. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          background: 'white',
          borderRadius: '24px',
          padding: '40px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 25px 70px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Droplets style={{ color: 'white', width: '32px', height: '32px' }} />
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
            Create Your Account
          </h1>
          <p style={{ margin: 0, fontSize: '15px', color: '#64748b' }}>
            Join MajiSmart and take control of your water
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#dc2626',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94a3b8' }} />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                style={{ width: '100%', padding: '12px 12px 12px 44px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94a3b8' }} />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                style={{ width: '100%', padding: '12px 12px 12px 44px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94a3b8' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="At least 6 characters"
                style={{ width: '100%', padding: '12px 44px 12px 44px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '15px', boxSizing: 'border-box' }}
              />
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>I am joining as</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '15px', background: 'white', boxSizing: 'border-box' }}
            >
              {USER_ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>County/Admin roles are approved by your utility. Kenya DPA consent applies at signup.</p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Phone (M-Pesa)</label>
            <div style={{ position: 'relative' }}>
              <Phone style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94a3b8' }} />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0712 345 678"
                style={{ width: '100%', padding: '12px 12px 12px 44px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {isFieldStaff && (
            <div style={{ background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                Field verification (KYC) — an admin reviews this before you can take jobs
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>National ID number *</label>
                <input
                  type="text"
                  value={formData.national_id}
                  onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                  placeholder="e.g. 12345678"
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '15px', background: 'white', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                  <FileUp size={14} style={{ display: 'inline', marginRight: 4 }} /> National ID document * {formData.id_document && '✓ attached'}
                </label>
                <input type="file" accept="image/*,.pdf" onChange={fileToData('id_document')} style={{ width: '100%', fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                  Certifications {formData.certifications && '✓ attached'} <span style={{ fontWeight: 400, color: '#64748b' }}>(plumbing, electrical, water treatment — optional)</span>
                </label>
                <input type="file" accept="image/*,.pdf" onChange={fileToData('certifications')} style={{ width: '100%', fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                  <LocateFixed size={14} style={{ display: 'inline', marginRight: 4 }} /> Work base location
                </label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input value={formData.base_latitude} onChange={(e) => setFormData({ ...formData, base_latitude: e.target.value })} placeholder="Latitude" inputMode="decimal" style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', background: 'white', boxSizing: 'border-box' }} />
                  <input value={formData.base_longitude} onChange={(e) => setFormData({ ...formData, base_longitude: e.target.value })} placeholder="Longitude" inputMode="decimal" style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', background: 'white', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={formData.base_location} onChange={(e) => setFormData({ ...formData, base_location: e.target.value })} placeholder="Base description, e.g. Ruaka depot" style={{ flex: 2, padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', background: 'white', boxSizing: 'border-box' }} />
                  <button type="button" onClick={detectLocation} disabled={locating} style={{ flex: 1, padding: '12px 8px', borderRadius: '12px', border: '1.5px solid #0891b2', background: 'white', color: '#0891b2', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    {locating ? 'Locating…' : 'Detect me'}
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0 0' }}>Jobs near your base are offered to you first.</p>
              </div>
            </div>
          )}

          <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>County</label>
            <div style={{ position: 'relative' }}>
              <MapPin style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94a3b8' }} />
              <select
                required
                value={formData.county}
                onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                style={{ width: '100%', padding: '12px 12px 12px 44px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '15px', background: 'white', boxSizing: 'border-box' }}
              >
                <option value="">Select your county</option>
                {counties.map(county => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading ? 'Creating account...' : (
              <>
                <UserPlus size={18} />
                Create Account
              </>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#0891b2', fontWeight: '700', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
