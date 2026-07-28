import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

function MapController({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

export default function InteractiveMap({ assets = [], activeLayers = {}, onAssetClick }) {
  const [mapCenter, setMapCenter] = useState([-0.0236, 37.9209])
  const [mapZoom, setMapZoom] = useState(7)

  const sensors = activeLayers.sensors ? assets.filter(a => a.type === 'sensor') : []
  const reservoirs = activeLayers.reservoirs ? assets.filter(a => a.type === 'reservoir') : []
  const treatmentPlants = activeLayers.treatmentPlants ? assets.filter(a => a.type === 'treatment_plant') : []
  const waterTowers = activeLayers.waterTowers ? assets.filter(a => a.type === 'water_tower') : []
  const waterPoints = activeLayers.waterPoints ? assets.filter(a => a.type === 'water_point') : []
  const valves = activeLayers.valves ? assets.filter(a => a.type === 'valve') : []
  const hydrants = activeLayers.hydrants ? assets.filter(a => a.type === 'hydrant') : []
  const pipelines = activeLayers.pipelines ? assets.filter(a => a.type === 'pipeline') : []
  const dmas = activeLayers.dmas ? assets.filter(a => a.type === 'dma') : []

  const getMarkerColor = (status) => {
    if (status === 'active') return '#10b981'
    if (status === 'warning') return '#f59e0b'
    return '#ef4444'
  }

  const getAssetIcon = (type, status) => {
    const color = getMarkerColor(status)
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
        <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
      </div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    })
  }

  const handleMarkerClick = (asset) => {
    if (onAssetClick) onAssetClick(asset)
  }

  return (
    <MapContainer 
      center={mapCenter} 
      zoom={mapZoom} 
      style={{ height: '100%', width: '100%', borderRadius: '12px', zIndex: 1 }}
    >
      <MapController center={mapCenter} zoom={mapZoom} />
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {dmas.map((dma, idx) => (
        <Polygon 
          key={`dma-${idx}`} 
          positions={dma.coordinates} 
          pathOptions={{ color: '#8b5cf6', weight: 3, fillOpacity: 0.15, dashArray: '5, 5' }}
        >
          <Popup>
            <div style={{ padding: '8px', minWidth: '200px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{dma.name}</h4>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                <strong>County:</strong> {dma.county}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                <strong>Coverage:</strong> {dma.coverage_km2} km²
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                <strong>Population:</strong> {(dma.population_served || 0).toLocaleString()}
              </div>
            </div>
          </Popup>
        </Polygon>
      ))}

      {pipelines.map((pipe, idx) => (
        <Polyline 
          key={`pipe-${idx}`} 
          positions={pipe.coordinates} 
          pathOptions={{ color: getMarkerColor(pipe.status), weight: 5, opacity: 0.8 }}
        >
          <Popup>
            <div style={{ padding: '8px', minWidth: '200px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{pipe.name}</h4>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                <strong>Diameter:</strong> {pipe.diameter_mm}mm
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                <strong>Material:</strong> {pipe.material}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                <strong>Length:</strong> {pipe.length_km} km
              </div>
            </div>
          </Popup>
        </Polyline>
      ))}

      {[...sensors, ...reservoirs, ...treatmentPlants, ...waterTowers, ...waterPoints, ...valves, ...hydrants].map((asset, idx) => (
        <Marker 
          key={`${asset.type}-${asset.id || idx}`} 
          position={[asset.latitude, asset.longitude]}
          icon={getAssetIcon(asset.type, asset.status)}
          eventHandlers={{
            click: () => handleMarkerClick(asset)
          }}
        >
          <Popup>
            <div style={{ padding: '8px', minWidth: '220px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{asset.name}</h4>
              <span style={{ 
                display: 'inline-block', 
                padding: '3px 10px', 
                borderRadius: '12px', 
                fontSize: '11px', 
                fontWeight: '700', 
                marginBottom: '8px',
                background: asset.status === 'active' ? '#d1fae5' : '#fee2e2',
                color: asset.status === 'active' ? '#059669' : '#dc2626'
              }}>
                {asset.status.toUpperCase()}
              </span>
              <div style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
                <strong>Type:</strong> {asset.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </div>
              {asset.county && (
                <div style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
                  <strong>County:</strong> {asset.county}
                </div>
              )}
              {asset.capacity && (
                <div style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
                  <strong>Capacity:</strong> {asset.capacity}
                </div>
              )}
              {asset.diameter_mm && (
                <div style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
                  <strong>Diameter:</strong> {asset.diameter_mm}mm
                </div>
              )}
              {asset.material && (
                <div style={{ fontSize: '12px', color: '#475569' }}>
                  <strong>Material:</strong> {asset.material}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
