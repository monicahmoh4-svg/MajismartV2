import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Droplets, Mail, Lock, User, Phone, MapPin, Briefcase } from 'lucide-react';

const COUNTIES = ['Nairobi','Mombasa','Kisumu','Nakuru','Kiambu','Machakos','Kakamega','Meru','Kilifi','Uasin Gishu','Other'];
const ROLES = [
  { value: 'admin', label: 'System Admin' },
  { value: 'county_officer', label: 'County Water Officer' },
  { value: 'operator', label: 'Node Operator' },
  { value: 'community', label: 'Community Manager' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'operator', county:'', phone:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/app/dashboard');
    } catch (err) {
      setError(err?.error || err?.response?.data?.error || err?.message || 'Registration failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px 12px 44px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px'
  };

  const iconContainerStyle = {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            background: '#eff6ff',
            borderRadius: '50%',
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Droplets style={{ color: '#2563eb', width: '32px', height: '32px' }} />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' }}>Create Account</h2>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '15px' }}>Join MajiSmart Kenya water intelligence network</p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            borderLeft: '4px solid #ef4444',
            padding: '12px 16px',
            marginBottom: '24px',
            borderRadius: '0 8px 8px 0'
          }}>
            <p style={{ color: '#991b1b', margin: 0, fontSize: '14px' }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User style={iconContainerStyle} size={20} />
              <input
                type="text"
                value={form.name}
                onChange={handleChange('name')}
                required
                style={inputStyle}
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail style={iconContainerStyle} size={20} />
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                required
                style={inputStyle}
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Phone Number</label>
            <div style={{ position: 'relative' }}>
              <Phone style={iconContainerStyle} size={20} />
              <input
                type="tel"
                value={form.phone}
                onChange={handleChange('phone')}
                style={inputStyle}
                placeholder="+254 700 000 000"
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock style={iconContainerStyle} size={20} />
              <input
                type="password"
                value={form.password}
                onChange={handleChange('password')}
                required
                style={inputStyle}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Role</label>
              <div style={{ position: 'relative' }}>
                <Briefcase style={iconContainerStyle} size={20} />
                <select
                  value={form.role}
                  onChange={handleChange('role')}
                  style={{ ...inputStyle, appearance: 'none', backgroundColor: 'white' }}
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>County</label>
              <div style={{ position: 'relative' }}>
                <MapPin style={iconContainerStyle} size={20} />
                <select
                  value={form.county}
                  onChange={handleChange('county')}
                  style={{ ...inputStyle, appearance: 'none', backgroundColor: 'white' }}
                >
                  <option value="">Select County</option>
                  {COUNTIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(90deg, #2563eb, #06b6d4)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.2s',
              marginTop: '8px'
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
