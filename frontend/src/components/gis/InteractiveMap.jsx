import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix default marker icons for Vite production builds
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

function getMarkerIcon(status) {
  const color = status === 'active' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444'
  return L.divIcon({
    className: '',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -16]
  })
}

export default function InteractiveMap({ assets = [], activeLayers = {}, onAssetClick }) {
  const pointAssets = useMemo(() => assets.filter(a => a.type !== 'dma' && a.type !== 'pipeline' && a.latitude && a.longitude), [assets])
  const pipelineAssets = useMemo(() => activeLayers.pipelines ? assets.filter(a => a.type === 'pipeline' && a.coordinates) : [], [assets, activeLayers.pipelines])
  const dmaAssets = useMemo(() => activeLayers.dmas ? assets.filter(a => a.type === 'dma' && a.coordinates) : [], [assets, activeLayers.dmas])

  const visiblePoints = useMemo(() => {
    return pointAssets.filter(a => {
      if (a.type === 'sensor' && !activeLayers.sensors) return false
      if (a.type === 'reservoir' && !activeLayers.reservoirs) return false
      if (a.type === 'treatment_plant' && !activeLayers.treatmentPlants) return false
      if (a.type === 'water_tower' && !activeLayers.waterTowers) return false
      if (a.type === 'water_point' && !activeLayers.waterPoints) return false
      if (a.type === 'valve' && !activeLayers.valves) return false
      if (a.type === 'hydrant' && !activeLayers.hydrants) return false
      return true
    })
  }, [pointAssets, activeLayers])

  return (
    <MapContainer center={[-0.5, 37.5]} zoom={7} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
      <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {dmaAssets.map((dma, idx) => (
        <Polygon key={`dma-${idx}`} positions={dma.coordinates} pathOptions={{ color: '#8b5cf6', weight: 2, fillOpacity: 0.12, dashArray: '6, 4' }}>
          <Tooltip permanent direction="center" style={{ background: 'rgba(139, 92, 246, 0.9)', color: 'white', border: '2px solid #7c3aed', borderRadius: '6px', padding: '4px 10px', fontWeight: '700', fontSize: '12px' }}>
            {dma.name}
          </Tooltip>
        </Polygon>
      ))}

      {pipelineAssets.map((pipe, idx) => (
        <Polyline key={`pipe-${idx}`} positions={pipe.coordinates} pathOptions={{ color: pipe.status === 'active' ? '#0891b2' : '#ef4444', weight: 4, opacity: 0.8 }}>
          <Tooltip sticky><strong>{pipe.name}</strong><br/>{pipe.diameter_mm}mm</Tooltip>
        </Polyline>
      ))}

      {visiblePoints.map((asset, idx) => (
        <Marker 
          key={`${asset.type}-${asset.id || idx}`} 
          position={[asset.latitude, asset.longitude]}
          icon={getMarkerIcon(asset.status)}
          eventHandlers={{ click: () => onAssetClick && onAssetClick(asset) }}
        >
          {/* ✅ PERMANENT LABELS */}
          <Tooltip permanent direction="top" offset={[0, -8]} style={{ 
            background: 'rgba(255,255,255,0.95)', 
            border: '1px solid #e2e8f0', 
            borderRadius: '6px', 
            padding: '3px 8px', 
            fontSize: '11px', 
            fontWeight: '600', 
            color: '#0f172a',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }}>
            {asset.name}
          </Tooltip>

          <Popup maxWidth={320}>
            <div style={{ padding: '12px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: '700' }}>{asset.name}</h4>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>
                <strong>Type:</strong> {(asset.type || '').replace(/_/g, ' ')}
                {asset.county && <span> • <strong>County:</strong> {asset.county}</span>}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#94a3b8', background: '#f8fafc', padding: '6px', borderRadius: '4px' }}>
                📍 {Number(asset.latitude).toFixed(6)}, {Number(asset.longitude).toFixed(6)}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
