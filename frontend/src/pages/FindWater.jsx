import { useState } from 'react'
import { Navigation, MapPin, Droplets, Wifi, WifiOff, ChevronRight } from 'lucide-react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { useApiData } from '../hooks/useApiData'
import { Loading, ErrorState, EmptyState } from '../components/ui/StateViews'

const TYPE_LABEL = { borehole: 'Borehole', tank: 'Water Tank', kiosk: 'Water Kiosk', river_intake: 'River Intake' }

function WaterPointCard({ point }) {
  const level = point.water_level || 0
  const isOpen = point.status === 'active'
  return (
    <div className="card fade-in" style={{ padding: 16, marginBottom: 12, opacity: isOpen ? 1 : 0.65 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12, flexShrink: 0,
          background: isOpen ? '#e8f4fd' : '#f1f3f4',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {isOpen ? <Droplets size={22} color="#1a7fd4" /> : <WifiOff size={20} color="#9aa0a6" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{point.name}</span>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
              background: isOpen ? '#e1f5ee' : '#f1f3f4',
              color: isOpen ? '#0d9e75' : '#9aa0a6'
            }}>
              {isOpen ? 'Open' : point.status}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#9aa0a6', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={11} />
            {point.location || point.county}
            {point.distance_km !== null && <span>· {point.distance_km} km</span>}
            <span>· {TYPE_LABEL[point.type] || point.type}</span>
          </div>

          {/* Water level bar */}
          {point.water_level !== null ? (
            <div>
              <div style={{ height: 7, background: '#f1f3f4', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{
                  height: '100%', width: `${level}%`, borderRadius: 99,
                  background: level > 50 ? '#0d9e75' : level > 20 ? '#e8a020' : '#d93025',
                  transition: 'width 1s'
                }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: point.level_color }}>{point.level_label}</div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#9aa0a6' }}>No sensor data yet</div>
          )}
        </div>

        {point.latitude && point.longitude && (
          <a
            href={`https://maps.google.com/?q=${point.latitude},${point.longitude}`}
            target="_blank" rel="noreferrer"
            style={{
              background: isOpen ? '#1a7fd4' : '#f1f3f4',
              color: isOpen ? 'white' : '#9aa0a6',
              padding: '10px 12px', borderRadius: 8,
              textDecoration: 'none', flexShrink: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3
            }}
          >
            <Navigation size={16} />
            <span style={{ fontSize: 10, fontWeight: 600 }}>Go</span>
          </a>
        )}
      </div>
    </div>
  )
}

export default function FindWater() {
  const { user } = useAuth()
  const [county, setCounty] = useState(user?.county || 'Nairobi')
  const [gps, setGps] = useState(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [filterOpen, setFilterOpen] = useState(true) // show open only by default

  const url = `/citizen/water-points?county=${encodeURIComponent(county)}${gps ? `&lat=${gps.lat}&lng=${gps.lng}` : ''}`
  const { data: points, loading, error, refetch } = useApiData(
    () => api.get(url),
    { deps: [county, gps], isEmpty: d => !d?.length }
  )

  const detectGPS = () => {
    if (!navigator.geolocation) return
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => { setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsLoading(false) },
      () => setGpsLoading(false)
    )
  }

  const filtered = (points || []).filter(p => filterOpen ? p.status === 'active' : true)

  const COUNTIES = ['Nairobi','Kiambu','Machakos','Nakuru','Mombasa','Kisumu','Nyeri','Meru','Kakamega','Uasin Gishu']

  return (
    <div style={{ maxWidth: 540, margin: '0 auto' }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Find Water Near You</h1>
        <p style={{ fontSize: 14, color: '#5f6368' }}>
          See every working water point in your area — tap any one for directions.
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <select value={county} onChange={e => setCounty(e.target.value)} style={{ flex: 1, minWidth: 140 }}>
          {COUNTIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <button
          className="btn btn-outline"
          onClick={detectGPS}
          disabled={gpsLoading}
          style={{ fontSize: 13, padding: '8px 14px', flexShrink: 0 }}
        >
          <Navigation size={14} />
          {gps ? 'Location on' : gpsLoading ? '...' : 'Sort by distance'}
        </button>
      </div>

      {/* Filter toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[
          { val: true,  label: 'Open only' },
          { val: false, label: 'All water points' },
        ].map(opt => (
          <button key={String(opt.val)} onClick={() => setFilterOpen(opt.val)} style={{
            padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
            background: filterOpen === opt.val ? '#1a7fd4' : 'white',
            color: filterOpen === opt.val ? 'white' : '#5f6368',
            border: '1.5px solid ' + (filterOpen === opt.val ? '#1a7fd4' : 'var(--gray-200)'),
            cursor: 'pointer'
          }}>
            {opt.label}
          </button>
        ))}
        {gps && <span style={{ fontSize: 11, color: '#0d9e75', alignSelf: 'center', fontWeight: 600 }}>📍 Sorted by distance</span>}
      </div>

      {loading ? <Loading rows={4} /> :
       error ? <ErrorState message={error} onRetry={refetch} /> :
       filtered.length === 0 ? (
        <EmptyState
          icon={Droplets}
          title="No water points found"
          subtitle={filterOpen ? 'Try showing all water points, including offline ones' : `No water points registered in ${county} yet`}
        />
       ) : (
        <>
          <div style={{ fontSize: 12, color: '#9aa0a6', marginBottom: 10 }}>
            {filtered.length} water point{filtered.length !== 1 ? 's' : ''} in {county}
          </div>
          {filtered.map(p => <WaterPointCard key={p.id} point={p} />)}
        </>
       )}
    </div>
  )
}
