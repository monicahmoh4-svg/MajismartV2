import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Layers, Search, Download, Upload, Maximize2 } from 'lucide-react'
import InteractiveMap from '../components/gis/InteractiveMap'
import api from '../api'

export default function GISDashboard() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeLayers, setActiveLayers] = useState({
    sensors: true,
    pipelines: true,
    reservoirs: true,
    dmas: true
  })

  useEffect(() => {
    fetchGISData()
  }, [])

  const fetchGISData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/gis/assets')
      setAssets(response.data || [])
    } catch (error) {
      console.error('Failed to fetch GIS data:', error)
      // Fallback mock data for demonstration if API is not yet fully populated
      setAssets([
        { id: 1, type: 'sensor', name: 'Sensor Node A1', latitude: -1.2921, longitude: 36.8219, status: 'active', last_reading: '45 PSI' },
        { id: 2, type: 'reservoir', name: 'Kibera Reservoir', latitude: -1.3031, longitude: 36.7989, status: 'active', last_reading: '85% Capacity' },
        { id: 3, type: 'pipeline', name: 'Main Line 4', coordinates: [[-1.2921, 36.8219], [-1.3031, 36.7989]], status: 'active', diameter_mm: 300, material: 'PVC' },
        { id: 4, type: 'dma', name: 'DMA Zone 1', coordinates: [[-1.2900, 36.8200], [-1.2900, 36.8300], [-1.3000, 36.8300], [-1.3000, 36.8200]], coverage_km2: 12.5 }
      ])
    } finally {
      setLoading(false)
    }
  }

  const toggleLayer = (layer) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }))
  }

  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.id.toString().includes(searchQuery)
  )

  return (
    <div style={{ height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      {/* GIS Toolbar */}
      <div style={{ 
        background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search assets by name, ID, or GPS..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', 
                border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none'
              }}
            />
          </div>
          <button onClick={fetchGISData} style={{ 
            padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', 
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#475569'
          }}>
            Refresh Data
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ 
            padding: '10px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', 
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#475569'
          }}>
            <Upload style={{ width: '16px', height: '16px' }} /> Import GeoJSON
          </button>
          <button style={{ 
            padding: '10px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', 
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#475569'
          }}>
            <Download style={{ width: '16px', height: '16px' }} /> Export Map
          </button>
       6</button>
        </div>
      </div>

      {/* Main GIS Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Layer Control Sidebar */}
        <motion.div 
          initial={{ x: -300 }} animate={{ x: 0 }} 
          style={{ width: '280px', background: 'white', borderRight: '1px solid #e2e8f0', padding: '20px', overflowY: 'auto' }}
        >
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers style={{ width: '18px', height: '18px', color: '#0891b2' }} /> Map Layers
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(activeLayers).map(([layer, isActive]) => (
              <label key={layer} style={{ 
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', 
                background: isActive ? '#f0f9ff' : 'transparent', borderRadius: '8px', 
                cursor: 'pointer', border: isActive ? '1px solid #bae6fd' : '1px solid transparent',
                transition: 'all 0.2s'
              }}>
                <input 
                  type="checkbox" 
                  checked={isActive} 
                  onChange={() => toggleLayer(layer)}
                  style={{ width: '18px', height: '18px', accentColor: '#0891b2', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '600', color: isActive ? '#0891b2' : '#475569', textTransform: 'capitalize' }}>
                  {layer === 'dmas' ? 'District Metered Areas' : layer}
                </span>
              </label>
            ))}
          </div>

          <div style={{ marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Asset Legend</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></div>
                <span style={{ fontSize: '13px', color: '#475569' }}>Active / Normal</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></div>
                <span style={{ fontSize: '13px', color: '#475569' }}>Warning / Leak</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></div>
                <span style={{ fontSize: '13px', color: '#475569' }}>Offline / Critical</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Map Container */}
        <div style={{ flex: 1, position: 'relative', background: '#e2e8f0' }}>
          {loading ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.8)', zIndex: 10 }}>
              <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #0891b2', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
          ) : null}
          <InteractiveMap assets={filteredAssets} activeLayers={activeLayers} />
        </div>
      </div>
    </div>
  )
}
