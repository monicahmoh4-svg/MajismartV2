import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Droplets, Mail, Lock, Eye, EyeOff, AlertCircle, UserPlus, User, MapPin } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    county: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const counties = [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret',
    'Machakos', 'Kiambu', 'Kajiado', 'Meru', 'Nyeri',
    'Uasin Gishu', 'Kakamega', 'Bungoma', 'Kilifi', 'Kwale'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await register(formData)
    
    if (!result.success) {
      setError(result.error)
      setLoading(false)
    }
    // ✅ Successful registration redirects to /dashboard inside AuthContext
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '400px',
        height: '400px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-150px',
        left: '-150px',
        width: '500px',
        height: '500px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '50%'
      }} />

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
          boxShadow: '0 25px 70px rgba(0,0,0,0.2)',
          position: 'relative',
          zIndex: 1
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
            margin: '0 auto 16px',
            boxShadow: '0 8px 20px rgba(8, 145, 178, 0.3)'
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
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#dc2626',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <User style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94a3b8' }} />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 44px',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0891b2'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94a3b8' }} />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 44px',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0891b2'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94a3b8' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="At least 6 characters"
                style={{
                  width: '100%',
                  padding: '12px 44px 12px 44px',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0891b2'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
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
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showPassword 
                  ? <EyeOff style={{ width: '18px', height: '18px', color: '#94a3b8' }} />
                  : <Eye style={{ width: '18px', height: '18px', color: '#94a3b8' }} />
                }
              </button>
            </div>
          </div>

          {/* County */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>
              County
            </label>
            <div style={{ position: 'relative' }}>
              <MapPin style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94a3b8' }} />
              <select
                required
                value={formData.county}
                onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 44px',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '15px',
                  outline: 'none',
                  background: 'white',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0891b2'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              >
                <option value="">Select your county</option>
                {counties.map(county => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
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
              boxShadow: '0 4px 16px rgba(8, 145, 178, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '8px'
            }}
          >
            {loading ? (
              <>Creating account...</>
            ) : (
              <>
                <UserPlus style={{ width: '18px', height: '18px' }} />
                Create Account
              </>
            )}
          </motion.button>
        </form>

        <p style={{ 
          textAlign: 'center', 
          marginTop: '24px', 
          fontSize: '14px', 
          color: '#64748b' 
        }}>
          Already have an account?{' '}
          <Link 
            to="/login" 
            style={{ 
              color: '#0891b2', 
              fontWeight: '700', 
              textDecoration: 'none' 
            }}
          >
            Sign in
          </Link>
        </p>

        <p style={{ 
          textAlign: 'center', 
          marginTop: '12px', 
          fontSize: '13px' 
        }}>
          <Link 
            to="/" 
            style={{ 
              color: '#94a3b8', 
              textDecoration: 'none' 
            }}
          >
            ← Back to home
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
