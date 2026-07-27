import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icons in Vite/React
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

// Component to handle map view updates
function MapController({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

export default function InteractiveMap({ assets = [], activeLayers = { sensors: true, pipelines: true, reservoirs: true, dmas: true } }) {
  const [mapCenter, setMapCenter] = useState([-1.2921, 36.8219]) // Default to Nairobi
  const [mapZoom, setMapZoom] = useState(12)

  // Filter assets based on active layers
  const sensors = activeLayers.sensors ? assets.filter(a => a.type === 'sensor') : []
  const reservoirs = activeLayers.reservoirs ? assets.filter(a => a.type === 'reservoir') : []
  const pipelines = activeLayers.pipelines ? assets.filter(a => a.type === 'pipeline') : []
  const dmas = activeLayers.dmas ? assets.filter(a => a.type === 'dma') : []

  // Custom marker colors based on status
  const getMarkerColor = (status) => {
    if (status === 'active' || status === 'normal') return '#10b981'
    if (status === 'warning' || status === 'leak') return '#f59e0b'
    return '#ef4444'
  }

  return (
    <MapContainer 
      center={mapCenter} 
      zoom={mapZoom} 
      style={{ height: '100%', width: '100%', borderRadius: '12px', zIndex: 1 }}
    >
      <MapController center={mapCenter} zoom={mapZoom} />
      
      {/* Base Layers */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution='Tiles &copy; Esri'
      />

      {/* DMAs (Polygons) */}
      {dmas.map((dma, idx) => (
        <Polygon 
          key={`dma-${idx}`} 
          positions={dma.coordinates} 
          pathOptions={{ color: '#8b5cf6', weight: 2, fillOpacity: 0.2 }}
        >
          <Popup>
            <div style={{ padding: '8px' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700' }}>{dma.name}</h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>District Metered Area</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Coverage: {dma.coverage_km2} km²</p>
            </div>
          </Popup>
        </Polygon>
      ))}

      {/* Pipelines (Polylines) */}
      {pipelines.map((pipe, idx) => (
        <Polyline 
          key={`pipe-${idx}`} 
          positions={pipe.coordinates} 
          pathOptions={{ color: getMarkerColor(pipe.status), weight: 4 }}
        >
          <Popup>
            <div style={{ padding: '8px' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700' }}>{pipe.name}</h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Diameter: {pipe.diameter_mm}mm</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Material: {pipe.material}</p>
            </div>
          </Popup>
        </Polyline>
      ))}

      {/* Reservoirs & Sensors (Markers) */}
      {[...sensors, ...reservoirs].map((asset, idx) => (
        <Marker 
          key={`${asset.type}-${idx}`} 
          position={[asset.latitude, asset.longitude]}
          icon={L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${getMarkerColor(asset.status)}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })}
        >
          <Popup>
            <div style={{ padding: '8px', minWidth: '150px' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{asset.name}</h4>
              <span style={{ 
                display: 'inline-block', padding: '2px 8px', borderRadius: '12px', 
                fontSize: '11px', fontWeight: '600', marginBottom: '8px',
                background: asset.status === 'active' ? '#d1fae5' : '#fee2e2',
                color: asset.status === 'active' ? '#059669' : '#dc2626'
              }}>
                {asset.status.toUpperCase()}
              </span>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#475569' }}>
                Type: {asset.type === 'sensor' ? 'IoT Sensor' : 'Reservoir'}
              </p>
              {asset.last_reading && (
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#475569' }}>
                  Last Reading: {asset.last_reading}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
