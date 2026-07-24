import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, MapPin, Send, X, CheckCircle, AlertTriangle, Droplets, Wrench, Zap, HelpCircle } from 'lucide-react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

const ISSUE_TYPES = [
  { value: 'leak',               label: 'Water Leak',            icon: Droplets,      color: '#1a7fd4', bg: '#e8f4fd' },
  { value: 'broken_pipe',        label: 'Broken Pipe',           icon: Wrench,         color: '#d93025', bg: '#fce8e6' },
  { value: 'illegal_connection', label: 'Illegal Connection',    icon: Zap,            color: '#e8a020', bg: '#fef3d8' },
  { value: 'water_shortage',     label: 'Water Shortage',        icon: AlertTriangle,  color: '#7a3fb5', bg: '#f0e8fc' },
  { value: 'quality_complaint',  label: 'Water Quality Issue',   icon: AlertTriangle,  color: '#0d6e56', bg: '#e1f5ee' },
  { value: 'other',              label: 'Other Issue',           icon: HelpCircle,     color: '#5f6368', bg: '#f1f3f4' },
]

const KENYA_COUNTIES = [
  'Baringo','Bomet','Bungoma','Busia','Elgeyo-Marakwet','Embu','Garissa','Homa Bay',
  'Isiolo','Kajiado','Kakamega','Kericho','Kiambu','Kilifi','Kirinyaga','Kisii',
  'Kisumu','Kitui','Kwale','Laikipia','Lamu','Machakos','Makueni','Mandera',
  'Marsabit','Meru','Migori','Mombasa','Murang\'a','Nairobi','Nakuru','Nandi',
  'Narok','Nyamira','Nyandarua','Nyeri','Samburu','Siaya','Taita-Taveta','Tana River',
  'Tharaka-Nithi','Trans Nzoia','Turkana','Uasin Gishu','Vihiga','Wajir','West Pokot'
]

function TypeCard({ type, selected, onClick }) {
  const Icon = type.icon
  return (
    <button onClick={() => onClick(type.value)} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      padding: '14px 10px', borderRadius: 12, cursor: 'pointer', border: 'none',
      background: selected ? type.bg : 'var(--gray-50)',
      outline: selected ? `2.5px solid ${type.color}` : '2px solid var(--gray-200)',
      transition: 'all .15s', flex: '1 1 28%', minWidth: 90
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: selected ? type.color : 'var(--gray-200)'
      }}>
        <Icon size={18} color={selected ? 'white' : 'var(--gray-600)'} />
      </div>
      <span style={{ fontSize: 11, fontWeight: selected ? 700 : 500, color: selected ? type.color : 'var(--gray-600)', textAlign: 'center', lineHeight: 1.3 }}>
        {type.label}
      </span>
    </button>
  )
}

export default function ReportIssue() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    type: '',
    description: '',
    county: user?.county || '',
    location: '',
  })
  const [photo, setPhoto] = useState(null)       // base64 string
  const [photoPreview, setPhotoPreview] = useState(null)
  const [gps, setGps] = useState(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handlePhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5_000_000) { setError('Photo must be under 5 MB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPhoto(ev.target.result)
      setPhotoPreview(ev.target.result)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const detectGPS = () => {
    if (!navigator.geolocation) { setGpsError('GPS not supported on this device'); return }
    setGpsLoading(true); setGpsError('')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsLoading(false)
      },
      () => { setGpsError('Could not get location — you can still submit without it'); setGpsLoading(false) }
    )
  }

  const handleSubmit = async () => {
    if (!form.type) { setError('Please select an issue type'); return }
    if (!form.description.trim()) { setError('Please describe the issue'); return }
    if (!form.county) { setError('Please select your county'); return }
    setSubmitting(true); setError('')
    try {
      await api.post('/reports', {
        type: form.type,
        description: form.description.trim(),
        county: form.county,
        location: form.location.trim() || null,
        latitude: gps?.lat || null,
        longitude: gps?.lng || null,
        photo_data: photo || null,
      })
      setSubmitted(true)
    } catch (err) {
      setError(err?.error || 'Submission failed — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center', padding: '0 20px' }}>
        <div className="card fade-in" style={{ padding: '40px 32px' }}>
          <CheckCircle size={52} color="#0d9e75" style={{ display: 'block', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Report Submitted!</h2>
          <p style={{ color: 'var(--gray-600)', fontSize: 14, marginBottom: 24 }}>
            Thank you for reporting this issue. The responsible county water office has been notified and will follow up.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/app/community')}>View All Reports</button>
            <button className="btn btn-ghost" onClick={() => { setSubmitted(false); setForm({ type:'', description:'', county: user?.county||'', location:'' }); setPhoto(null); setPhotoPreview(null); setGps(null) }}>
              Report Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Report a Water Issue</h1>
        <p style={{ color: 'var(--gray-600)', fontSize: 14 }}>
          Help your community — report leaks, broken pipes, water shortages or quality problems. Reports are routed directly to your county water office.
        </p>
      </div>

      {/* Step 1 – Issue type */}
      <div className="card fade-in" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-600)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
          1 · What type of issue?
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ISSUE_TYPES.map(t => (
            <TypeCard key={t.value} type={t} selected={form.type === t.value} onClick={v => set('type', v)} />
          ))}
        </div>
      </div>

      {/* Step 2 – Description */}
      <div className="card fade-in" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-600)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
          2 · Describe the issue
        </h3>
        <textarea
          placeholder="e.g. There is a large pipe burst near the school gate. Water has been flowing since morning and is flooding the road."
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={4}
          style={{ resize: 'vertical', minHeight: 90 }}
        />
        <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>{form.description.length}/500 characters</div>
      </div>

      {/* Step 3 – Location */}
      <div className="card fade-in" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-600)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
          3 · Location
        </h3>
        <div className="form-group">
          <label>County *</label>
          <select value={form.county} onChange={e => set('county', e.target.value)}>
            <option value="">Select county…</option>
            {KENYA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Nearest landmark or street (optional)</label>
          <input
            placeholder="e.g. Behind Equity Bank on Thika Road"
            value={form.location}
            onChange={e => set('location', e.target.value)}
          />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-600)', display: 'block', marginBottom: 6 }}>
            GPS coordinates (optional but recommended)
          </label>
          {gps ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--teal-light)', borderRadius: 8, fontSize: 13 }}>
              <MapPin size={15} color="#0d9e75" />
              <span style={{ color: '#0a7a5c', fontWeight: 600 }}>
                {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
              </span>
              <button onClick={() => setGps(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={14} color="#0a7a5c" />
              </button>
            </div>
          ) : (
            <button className="btn btn-outline" onClick={detectGPS} disabled={gpsLoading} style={{ width: '100%' }}>
              <MapPin size={15} />
              {gpsLoading ? 'Getting your location…' : 'Detect my GPS location'}
            </button>
          )}
          {gpsError && <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 6 }}>{gpsError}</div>}
        </div>
      </div>

      {/* Step 4 – Photo */}
      <div className="card fade-in" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-600)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
          4 · Add a photo (optional but helpful)
        </h3>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: 'none' }} />
        {photoPreview ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src={photoPreview} alt="Issue" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 10 }} />
            <button onClick={() => { setPhoto(null); setPhotoPreview(null) }} style={{
              position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.5)',
              border: 'none', borderRadius: '50%', padding: 6, cursor: 'pointer', display: 'flex'
            }}>
              <X size={14} color="white" />
            </button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()} style={{
            width: '100%', padding: '28px 20px', background: 'var(--gray-50)',
            border: '2px dashed var(--gray-200)', borderRadius: 12, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
          }}>
            <Camera size={28} color="var(--gray-400)" />
            <span style={{ fontSize: 13, color: 'var(--gray-600)', fontWeight: 500 }}>Tap to take a photo or upload from gallery</span>
            <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>Max 5 MB · JPG, PNG</span>
          </button>
        )}
      </div>

      {error && (
        <div className="alert-bar alert-bar-error" style={{ marginBottom: 12 }}>
          <AlertTriangle size={14} style={{ display: 'inline', marginRight: 6 }} />{error}
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={submitting}
        style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, marginBottom: 32 }}
      >
        <Send size={16} />
        {submitting ? 'Submitting report…' : 'Submit Report'}
      </button>
    </div>
  )
}
