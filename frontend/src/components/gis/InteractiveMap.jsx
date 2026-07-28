import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './gis-styles.css'
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
    html: `<div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -16]
  })
}

export default function InteractiveMap({ assets = [], activeLayers = {}, onAssetClick }) {
  const defaultCenter = [-0.5, 37.5]
  const defaultZoom = 7

  const pointAssets = useMemo(() => {
    return assets.filter(a => 
      a.type !== 'dma' && a.type !== 'pipeline' && a.latitude && a.longitude
    )
  }, [assets])

  const pipelineAssets = useMemo(() => {
    return activeLayers.pipelines ? assets.filter(a => a.type === 'pipeline' && a.coordinates) : []
  }, [assets, activeLayers.pipelines])

  const dmaAssets = useMemo(() => {
    return activeLayers.dmas ? assets.filter(a => a.type === 'dma' && a.coordinates) : []
  }, [assets, activeLayers.dmas])

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

  const formatVal = (v, u = '') => (v !== null && v !== undefined && v !== '') ? `${v}${u}` : null

  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={defaultZoom} 
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* DMA Polygons with permanent labels */}
      {dmaAssets.map((dma, idx) => (
        <Polygon 
          key={`dma-${dma.id || idx}`} 
          positions={dma.coordinates} 
          pathOptions={{ color: '#8b5cf6', weight: 2, fillOpacity: 0.12, dashArray: '6, 4' }}
        >
          <Tooltip permanent direction="center" className="dma-label">
            {dma.name}
          </Tooltip>
          <Popup>
            <div style={{ padding: '12px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{dma.name}</h4>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#64748b' }}><strong>County:</strong> {dma.county}</p>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#64748b' }}><strong>Coverage:</strong> {dma.coverage_km2} km²</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}><strong>Population:</strong> {(dma.population_served || 0).toLocaleString()}</p>
            </div>
          </Popup>
        </Polygon>
      ))}

      {/* Pipelines */}
      {pipelineAssets.map((pipe, idx) => (
        <Polyline 
          key={`pipe-${pipe.id || idx}`} 
          positions={pipe.coordinates} 
          pathOptions={{ color: pipe.status === 'active' ? '#0891b2' : '#ef4444', weight: 4, opacity: 0.8 }}
        >
          <Tooltip sticky>
            <strong>{pipe.name}</strong><br/>
            {pipe.diameter_mm}mm • {pipe.material} • {pipe.length_km}km
          </Tooltip>
          <Popup>
            <div style={{ padding: '12px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{pipe.name}</h4>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#64748b' }}><strong>Diameter:</strong> {pipe.diameter_mm}mm</p>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#64748b' }}><strong>Material:</strong> {pipe.material}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}><strong>Length:</strong> {pipe.length_km} km</p>
            </div>
          </Popup>
        </Polyline>
      ))}

      {/* Asset Markers with permanent name labels */}
      {visiblePoints.map((asset, idx) => (
        <Marker 
          key={`${asset.type}-${asset.id || idx}`} 
          position={[asset.latitude, asset.longitude]}
          icon={getMarkerIcon(asset.status)}
          eventHandlers={{ click: () => onAssetClick && onAssetClick(asset) }}
        >
          {/* Permanent name label above marker */}
          <Tooltip permanent direction="top" offset={[0, -8]} className="custom-label">
            {asset.name}
          </Tooltip>

          {/* Detailed popup on click */}
          <Popup maxWidth={320}>
            <div style={{ padding: '12px' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a', flex: 1 }}>{asset.name}</h4>
                <span style={{
                  padding: '3px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '700',
                  background: asset.status === 'active' ? '#d1fae5' : '#fee2e2',
                  color: asset.status === 'active' ? '#059669' : '#dc2626',
                  marginLeft: '8px', whiteSpace: 'nowrap'
                }}>
                  {asset.status?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>

              {/* Type and County */}
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
                <strong>Type:</strong> {(asset.type || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                {asset.county && <span> • <strong>County:</strong> {asset.county}</span>}
              </div>

              {/* Live Sensor Data */}
              {(formatVal(asset.water_level) || formatVal(asset.pressure) || formatVal(asset.flow_rate) || formatVal(asset.temperature) || formatVal(asset.quality_index) || formatVal(asset.ph)) && (
                <div style={{ background: '#f0f9ff', borderRadius: '8px', padding: '10px', marginBottom: '10px', border: '1px solid #bae6fd' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#0891b2', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '7px', height: '7px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span>
                    LIVE SENSOR DATA
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {formatVal(asset.water_level, '%') && (
                      <div style={{ background: 'white', padding: '6px 8px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '9px', color: '#94a3b8' }}>Water Level</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{asset.water_level}%</div>
                      </div>
                    )}
                    {formatVal(asset.pressure, ' PSI') && (
                      <div style={{ background: 'white', padding: '6px 8px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '9px', color: '#94a3b8' }}>Pressure</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{asset.pressure} PSI</div>
                      </div>
                    )}
                    {formatVal(asset.flow_rate, ' L/m') && (
                      <div style={{ background: 'white', padding: '6px 8px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '9px', color: '#94a3b8' }}>Flow Rate</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{asset.flow_rate} L/m</div>
                      </div>
                    )}
                    {formatVal(asset.temperature, '°C') && (
                      <div style={{ background: 'white', padding: '6px 8px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '9px', color: '#94a3b8' }}>Temperature</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{asset.temperature}°C</div>
                      </div>
                    )}
                    {formatVal(asset.quality_index, '%') && (
                      <div style={{ background: 'white', padding: '6px 8px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '9px', color: '#94a3b8' }}>Quality</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{asset.quality_index}%</div>
                      </div>
                    )}
                    {formatVal(asset.ph) && (
                      <div style={{ background: 'white', padding: '6px 8px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '9px', color: '#94a3b8' }}>pH</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{asset.ph}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Asset Details */}
              <div style={{ fontSize: '11px', color: '#475569' }}>
                {asset.capacity && <div style={{ marginBottom: '3px' }}><strong>Capacity:</strong> {asset.capacity}</div>}
                {asset.diameter_mm && <div style={{ marginBottom: '3px' }}><strong>Diameter:</strong> {asset.diameter_mm}mm</div>}
                {asset.material && <div style={{ marginBottom: '3px' }}><strong>Material:</strong> {asset.material}</div>}
                <div style={{ marginTop: '8px', fontFamily: 'monospace', fontSize: '10px', color: '#94a3b8', background: '#f8fafc', padding: '6px', borderRadius: '4px' }}>
                  📍 {Number(asset.latitude).toFixed(6)}, {Number(asset.longitude).toFixed(6)}
                </div>
                {asset.last_reading_at && (
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                    Last update: {new Date(asset.last_reading_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
