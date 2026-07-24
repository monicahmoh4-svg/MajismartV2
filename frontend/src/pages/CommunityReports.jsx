import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Map, List, Filter, Plus, CheckCircle,
  Clock, AlertTriangle, XCircle, Loader, MapPin, Camera
} from 'lucide-react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { useApiData } from '../hooks/useApiData'
import { Loading, ErrorState, EmptyState, LiveBadge } from '../components/ui/StateViews'

const STATUS_META = {
  open:         { label: 'Open',        color: '#d93025', bg: '#fce8e6', icon: AlertTriangle },
  acknowledged: { label: 'Acknowledged',color: '#1a7fd4', bg: '#e8f4fd', icon: Clock },
  in_progress:  { label: 'In Progress', color: '#e8a020', bg: '#fef3d8', icon: Loader },
  resolved:     { label: 'Resolved',    color: '#0d9e75', bg: '#e1f5ee', icon: CheckCircle },
  rejected:     { label: 'Rejected',    color: '#5f6368', bg: '#f1f3f4', icon: XCircle },
}

const TYPE_LABELS = {
  leak: 'Water Leak', broken_pipe: 'Broken Pipe',
  illegal_connection: 'Illegal Connection', water_shortage: 'Water Shortage',
  quality_complaint: 'Quality Issue', other: 'Other'
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.open
  const Icon = m.icon
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: m.bg, color: m.color }}>
      <Icon size={10} />{m.label}
    </span>
  )
}

function ReportCard({ report, onStatusChange, canManage }) {
  const [updating, setUpdating] = useState(false)

  const updateStatus = async (status) => {
    setUpdating(true)
    try {
      await api.patch(`/reports/${report.id}/status`, { status })
      onStatusChange(report.id, status)
    } catch (_) {}
    finally { setUpdating(false) }
  }

  return (
    <div className="card fade-in" style={{ padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{TYPE_LABELS[report.type] || report.type}</span>
            <StatusBadge status={report.status} />
          </div>
          <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 6, lineHeight: 1.5 }}>
            {report.description}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: 'var(--gray-400)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <MapPin size={10} />{report.county}{report.location ? ` · ${report.location}` : ''}
            </span>
            {report.reporter_name && <span>By {report.reporter_name}</span>}
            <span>{new Date(report.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
        {report.photo_data && (
          <img src={report.photo_data} alt="Issue" style={{ width: 62, height: 62, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: '1px solid var(--gray-200)' }} />
        )}
      </div>
      {report.latitude && report.longitude && (
        <a
          href={`https://maps.google.com/?q=${report.latitude},${report.longitude}`}
          target="_blank" rel="noreferrer"
          style={{ fontSize: 11, color: '#1a7fd4', display: 'inline-flex', alignItems: 'center', gap: 3, marginBottom: 8 }}
        >
          <MapPin size={11} />View on Google Maps
        </a>
      )}
      {canManage && report.status !== 'resolved' && report.status !== 'rejected' && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
          {report.status === 'open' && (
            <button className="btn btn-outline" onClick={() => updateStatus('acknowledged')} disabled={updating} style={{ fontSize: 11, padding: '5px 12px' }}>
              Acknowledge
            </button>
          )}
          {(report.status === 'open' || report.status === 'acknowledged') && (
            <button className="btn btn-success" onClick={() => updateStatus('in_progress')} disabled={updating} style={{ fontSize: 11, padding: '5px 12px' }}>
              Start Work
            </button>
          )}
          {report.status === 'in_progress' && (
            <button className="btn btn-success" onClick={() => updateStatus('resolved')} disabled={updating} style={{ fontSize: 11, padding: '5px 12px' }}>
              <CheckCircle size={12} /> Mark Resolved
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => updateStatus('rejected')} disabled={updating} style={{ fontSize: 11, padding: '5px 12px', color: 'var(--gray-400)' }}>
            Reject
          </button>
        </div>
      )}
    </div>
  )
}

// Lightweight map using Leaflet loaded from CDN (no npm install needed)
function ReportsMap({ reports }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return

    // Load leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Load leaflet JS then init map
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      const L = window.L
      const map = L.map(mapRef.current).setView([-0.0236, 37.9062], 6) // Kenya center
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)

      const colorMap = { open: '#d93025', acknowledged: '#1a7fd4', in_progress: '#e8a020', resolved: '#0d9e75', rejected: '#9aa0a6' }

      reports.filter(r => r.latitude && r.longitude).forEach(r => {
        const color = colorMap[r.status] || '#5f6368'
        const icon = L.divIcon({
          html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`,
          className: '', iconSize: [14, 14], iconAnchor: [7, 7]
        })
        L.marker([r.latitude, r.longitude], { icon })
          .addTo(map)
          .bindPopup(`<b>${TYPE_LABELS[r.type] || r.type}</b><br>${r.county}${r.location ? ' · ' + r.location : ''}<br><span style="font-size:11px">${r.description.slice(0, 100)}</span>`)
      })

      mapInstanceRef.current = map
    }
    document.head.appendChild(script)
    return () => { /* Leaflet doesn't unmount cleanly in React StrictMode — leave it */ }
  }, [reports])

  const gpsReports = reports.filter(r => r.latitude && r.longitude)
  if (gpsReports.length === 0) {
    return (
      <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', borderRadius: 10, border: '1px solid var(--gray-200)' }}>
        <EmptyState icon={Map} title="No GPS-tagged reports yet" subtitle="Reports with location data will appear here" />
      </div>
    )
  }

  return <div ref={mapRef} style={{ height: 320, borderRadius: 10, border: '1px solid var(--gray-200)', zIndex: 1 }} />
}

export default function CommunityReports() {
  const { user } = useAuth()
  const canManage = ['admin', 'county_officer', 'operator'].includes(user?.role)

  const [view, setView] = useState('list')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')

  const { data: reports, loading, error, lastUpdated, refetch, setData } = useApiData(
    () => api.get('/reports'),
    { pollMs: 60000, isEmpty: d => !d?.length }
  )

  const { data: stats } = useApiData(() => api.get('/reports/stats/summary'))

  const handleStatusChange = (id, newStatus) => {
    if (!reports) return
    const updated = reports.map(r => r.id === id ? { ...r, status: newStatus } : r)
    // optimistic update — we call setData indirectly via refetch after a moment
    refetch()
  }

  const filtered = (reports || []).filter(r => {
    if (filterStatus && r.status !== filterStatus) return false
    if (filterType && r.type !== filterType) return false
    return true
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Community Reports</h1>
          <p style={{ fontSize: 14, color: 'var(--gray-600)' }}>
            {canManage ? 'Manage citizen water issue reports in your area' : 'Track your submitted reports'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <LiveBadge lastUpdated={lastUpdated} />
          <Link to="/app/report" className="btn btn-primary" style={{ fontSize: 13 }}>
            <Plus size={15} /> Report Issue
          </Link>
        </div>
      </div>

      {/* Summary stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Reports', val: stats.total,       color: '#1a7fd4', bg: '#e8f4fd' },
            { label: 'Open',          val: stats.open,        color: '#d93025', bg: '#fce8e6' },
            { label: 'In Progress',   val: stats.in_progress, color: '#e8a020', bg: '#fef3d8' },
            { label: 'Resolved',      val: stats.resolved,    color: '#0d9e75', bg: '#e1f5ee' },
          ].map(s => (
            <div key={s.label} className="card fade-in" style={{ padding: '14px 16px', borderLeft: `4px solid ${s.color}` }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', border: '1.5px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
          {[['list', List, 'List'], ['map', Map, 'Map']].map(([v, Icon, lbl]) => (
            <button key={v} onClick={() => setView(v)} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px',
              background: view === v ? '#1a7fd4' : 'white', color: view === v ? 'white' : 'var(--gray-600)',
              border: 'none', cursor: 'pointer', fontSize: 13
            }}>
              <Icon size={14} />{lbl}
            </button>
          ))}
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto', minWidth: 140 }}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 'auto', minWidth: 160 }}>
          <option value="">All issue types</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {(filterStatus || filterType) && (
          <button className="btn btn-ghost" onClick={() => { setFilterStatus(''); setFilterType('') }} style={{ fontSize: 12 }}>
            <XCircle size={13} /> Clear filters
          </button>
        )}
      </div>

      {loading ? <Loading rows={4} /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
        <>
          {view === 'map' && (
            <div className="card fade-in" style={{ padding: 16, marginBottom: 16 }}>
              <ReportsMap reports={reports || []} />
              <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 8, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {[['#d93025','Open'],['#1a7fd4','Acknowledged'],['#e8a020','In Progress'],['#0d9e75','Resolved']].map(([c,l]) => (
                  <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'inline-block' }} />{l}
                  </span>
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <EmptyState
              title="No reports found"
              subtitle={filterStatus || filterType ? 'Try clearing your filters' : 'No water issues have been reported yet'}
            />
          ) : filtered.map(r => (
            <ReportCard key={r.id} report={r} onStatusChange={handleStatusChange} canManage={canManage} />
          ))}
        </>
      )}
    </div>
  )
}
