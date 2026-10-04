import { useState } from 'react'
import { MapPin, LocateFixed, ExternalLink, X } from 'lucide-react'
import {
  getPosition,
  permissionState,
  reverseGeocode,
  googleMapsEmbedUrl,
  googleMapsLink,
} from '../../lib/geo'

// Reusable "detect my real place" control: permission-aware GPS, reverse-
// geocoded place name + details, live Google Map embed, confirm callback.
// Props: onPick({ lat, lng, accuracy, name, details, countyGuess, country }),
// compact (hides the map until confirmed), initial {lat,lng} to preview.
export default function LocationPicker({ onPick, compact = false, initial = null }) {
  const [phase, setPhase] = useState(initial ? 'done' : 'idle')
  const [place, setPlace] = useState(
    initial ? { lat: initial.lat, lng: initial.lng, name: 'Pinned location', details: null } : null
  )
  const [error, setError] = useState('')
  const [showMap, setShowMap] = useState(false)

  const detect = async () => {
    setError('')
    setPhase('locating')
    try {
      const perm = await permissionState()
      if (perm === 'denied') {
        setPhase('denied')
        setError('Location permission is blocked for this site. Tap the lock/tune icon in the address bar → Location → Allow, then try again.')
        return
      }
      const pos = await getPosition()
      setPhase('naming')
      let resolved = null
      try {
        resolved = await reverseGeocode(pos.lat, pos.lng)
      } catch (e) {
        resolved = null
      }
      const done = {
        lat: Number(pos.lat.toFixed(6)),
        lng: Number(pos.lng.toFixed(6)),
        accuracy: pos.accuracy != null ? Math.round(pos.accuracy) : null,
        name: resolved?.name || 'Located point',
        details:
          resolved?.details ||
          'Place name unavailable offline — coordinates are exact and usable.',
        countyGuess: resolved?.countyGuess || null,
        country: resolved?.country || null,
      }
      setPlace(done)
      setPhase('done')
      if (onPick) onPick(done)
      if (!compact) setShowMap(true)
    } catch (e) {
      setPhase(e && e.code === 'DENIED' ? 'denied' : 'error')
      setError((e && e.message) || 'Could not detect location.')
    }
  }

  const clear = () => {
    setPlace(null)
    setPhase('idle')
    setError('')
    setShowMap(false)
    if (onPick) onPick(null)
  }

  return (
    <div>
      {phase !== 'done' && (
        <button
          type="button"
          onClick={detect}
          disabled={phase === 'locating' || phase === 'naming'}
          className="btn btn-outline btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <LocateFixed size={14} />
          {phase === 'locating'
            ? 'Requesting location… (watch for the browser permission prompt)'
            : phase === 'naming'
              ? 'Finding place name…'
              : 'Detect my location'}
        </button>
      )}

      {error && (
        <div className="alert-bar alert-bar-error" style={{ marginTop: 8 }}>{error}</div>
      )}

      {phase === 'done' && place && (
        <div className="card" style={{ marginTop: 10, padding: 12 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: 'var(--teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MapPin size={17} color="#0a7a5c" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{place.name}</div>
              {place.details && (
                <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>{place.details}</div>
              )}
              <div style={{ fontSize: 11.5, color: 'var(--gray-400)', marginTop: 2 }}>
                {place.lat}, {place.lng}
                {place.accuracy != null ? ` · ±${place.accuracy}m` : ''}
              </div>
            </div>
            <button type="button" onClick={clear} aria-label="Clear location"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: 4 }}>
              <X size={15} />
            </button>
          </div>

          {(showMap || !compact) && (
            <div style={{ marginTop: 10 }}>
              <iframe
                title={`Map of ${place.name}`}
                src={googleMapsEmbedUrl(place.lat, place.lng)}
                style={{ width: '100%', height: 200, border: 0, borderRadius: 10 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a
                href={googleMapsLink(place.lat, place.lng)}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: 'var(--blue)', marginTop: 8 }}
              >
                Open in Google Maps <ExternalLink size={13} />
              </a>
            </div>
          )}
          {compact && !showMap && (
            <button type="button" onClick={() => setShowMap(true)}
              style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', marginTop: 8, padding: 0 }}>
              Preview on map
            </button>
          )}
        </div>
      )}
    </div>
  )
}
