import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, Layers, Search, Download, Upload, Maximize2, 
  Filter, RefreshCw, Database, Plus, X, Save, Edit2, Trash2
} from 'lucide-react'
import InteractiveMap from '../components/gis/InteractiveMap'
import api from '../api'

export default function GISDashboard() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCounty, setSelectedCounty] = useState('')
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [stats, setStats] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [newAsset, setNewAsset] = useState({
    name: '',
    type: 'sensor',
    latitude: '',
    longitude: '',
    county: '',
    status: 'active',
    capacity: '',
    diameter_mm: '',
    material: ''
  })

  const [activeLayers, setActiveLayers] = useState({
    sensors: true,
    reservoirs: true,
    treatmentPlants: true,
    waterTowers: true,
    waterPoints: true,
    valves: true,
    hydrants: true,
    pipelines: true,
    dmas: true
  })

  useEffect(() => {
    fetchGISData()
    fetchStats()
  }, [])

  const fetchGISData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCounty) params.append('county', selectedCounty)
      
      const response = await api.get(`/gis/assets?${params.toString()}`)
      setAssets(Array.isArray(response) ? response : [])
    } catch (error) {
      console.error('Failed to fetch GIS data:', error)
      setAssets([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/gis/stats')
      setStats(response)
    } catch (error) {
      console.error('Failed to fetch GIS stats:', error)
    }
  }

  const toggleLayer = (layer) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }))
  }

  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (asset.id && asset.id.toString().includes(searchQuery)) ||
    (asset.county && asset.county.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const counties = [...new Set(assets.map(a => a.county).filter(Boolean))].sort()

  const handleExportGeoJSON = () => {
    const geoJSON = {
      type: 'FeatureCollection',
      features: filteredAssets
        .filter(a => a.type !== 'dma' && a.type !== 'pipeline')
        .map(asset => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [asset.longitude, asset.latitude]
          },
          properties: {
            id: asset.id,
            name: asset.name,
            type: asset.type,
            status: asset.status,
            county: asset.county
          }
        }))
    }

    const blob = new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `majismart-gis-export-${new Date().toISOString().split('T')[0]}.geojson`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleAddAsset = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...newAsset,
        latitude: parseFloat(newAsset.latitude),
        longitude: parseFloat(newAsset.longitude),
        diameter_mm: newAsset.diameter_mm ? parseInt(newAsset.diameter_mm) : null,
        capacity: newAsset.capacity || null
      }
      
      await api.post('/gis/assets', payload)
      setShowAddModal(false)
      setNewAsset({
        name: '',
        type: 'sensor',
        latitude: '',
        longitude: '',
        county: '',
        status: 'active',
        capacity: '',
        diameter_mm: '',
        material: ''
      })
      fetchGISData()
      fetchStats()
      alert('Asset added successfully!')
    } catch (error) {
      console.error('Failed to add asset:', error)
      alert('Failed to add asset. Please try again.')
    }
  }

  const handleDeleteAsset = async (id) => {
    if (!confirm('Are you sure you want to delete this asset?')) return
    
    try {
      await api.delete(`/gis/assets/${id}`)
      setSelectedAsset(null)
      fetchGISData()
      fetchStats()
      alert('Asset deleted successfully!')
    } catch (error) {
      console.error('Failed to delete asset:', error)
      alert('Failed to delete asset. Please try again.')
    }
  }

  return (
    <div style={{ height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      {/* GIS Toolbar */}
      <div style={{ 
        background: 'white', 
        borderBottom: '1px solid #e2e8f0', 
        padding: '16px 24px',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search assets by name, ID, or county..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px 10px 10px 40px', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0', 
                fontSize: '14px', 
                outline: 'none'
              }}
            />
          </div>
          
          <select 
            value={selectedCounty}
            onChange={(e) => setSelectedCounty(e.target.value)}
            style={{ 
              padding: '10px 16px', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0', 
              fontSize: '14px', 
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="">All Counties</option>
            {counties.map(county => (
              <option key={county} value={county}>{county}</option>
            ))}
          </select>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchGISData} 
            style={{ 
              padding: '10px 16px', 
              background: '#f1f5f9', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#475569'
            }}
          >
            <RefreshCw style={{ width: '16px', height: '16px' }} /> Refresh
          </motion.button>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            style={{ 
              padding: '10px 16px', 
              background: 'linear-gradient(135deg, #0891b2, #06b6d4)', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontSize: '14px', 
              fontWeight: '700', 
              color: 'white',
              boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)'
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} /> Add Node
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportGeoJSON}
            style={{ 
              padding: '10px 16px', 
              background: 'white', 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#475569'
            }}
          >
            <Download style={{ width: '16px', height: '16px' }} /> Export
          </motion.button>
        </div>
      </div>

      {/* Main GIS Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Layer Control Sidebar */}
        <motion.div 
          initial={{ x: -300 }} 
          animate={{ x: 0 }} 
          style={{ 
            width: '280px', 
            background: 'white', 
            borderRight: '1px solid #e2e8f0', 
            padding: '20px', 
            overflowY: 'auto' 
          }}
        >
          {/* Statistics */}
          {stats && (
            <div style={{ 
              background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', 
              borderRadius: '12px', 
              padding: '16px', 
              marginBottom: '20px',
              color: 'white'
            }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700' }}>Network Overview</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '800' }}>{stats.total_assets}</div>
                  <div style={{ fontSize: '11px', opacity: 0.9 }}>Total Assets</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '800' }}>{stats.total_active}</div>
                  <div style={{ fontSize: '11px', opacity: 0.9 }}>Active</div>
                </div>
              </div>
            </div>
          )}

          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers style={{ width: '18px', height: '18px', color: '#0891b2' }} /> Map Layers
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { key: 'sensors', label: 'IoT Sensors', icon: '📡' },
              { key: 'reservoirs', label: 'Reservoirs', icon: '💧' },
              { key: 'treatmentPlants', label: 'Treatment Plants', icon: '🏭' },
              { key: 'waterTowers', label: 'Water Towers', icon: '🗼' },
              { key: 'waterPoints', label: 'Water Points', icon: '🚰' },
              { key: 'valves', label: 'Valves', icon: '🔧' },
              { key: 'hydrants', label: 'Hydrants', icon: '🚒' },
              { key: 'pipelines', label: 'Pipelines', icon: '🔵' },
              { key: 'dmas', label: 'District Metered Areas', icon: '📍' }
            ].map(layer => (
              <label key={layer.key} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '10px 12px', 
                background: activeLayers[layer.key] ? '#f0f9ff' : 'transparent', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                border: activeLayers[layer.key] ? '1px solid #bae6fd' : '1px solid transparent',
                transition: 'all 0.2s'
              }}>
                <input 
                  type="checkbox" 
                  checked={activeLayers[layer.key]} 
                  onChange={() => toggleLayer(layer.key)}
                  style={{ width: '18px', height: '18px', accentColor: '#0891b2', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '18px' }}>{layer.icon}</span>
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: activeLayers[layer.key] ? '#0891b2' : '#475569',
                  flex: 1
                }}>
                  {layer.label}
                </span>
              </label>
            ))}
          </div>

          <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Asset Legend</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#10b981', border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></div>
                <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>Active / Operational</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#f59e0b', border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></div>
                <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>Warning / Maintenance</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#ef4444', border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></div>
                <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>Offline / Critical</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Map Container */}
        <div style={{ flex: 1, position: 'relative', background: '#e2e8f0' }}>
          {loading && (
            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              background: 'rgba(255,255,255,0.9)', 
              zIndex: 10 
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '50px', 
                  height: '50px', 
                  border: '4px solid #e2e8f0', 
                  borderTop: '4px solid #0891b2', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px'
                }}></div>
                <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Loading GIS data...</p>
              </div>
            </div>
          )}
          <InteractiveMap 
            assets={filteredAssets} 
            activeLayers={activeLayers} 
            onAssetClick={setSelectedAsset}
          />
        </div>
      </div>

      {/* Asset Details Panel */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              width: '350px',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              padding: '24px',
              zIndex: 1000,
              maxHeight: '500px',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                  {selectedAsset.name}
                </h3>
                <span style={{ 
                  display: 'inline-block', 
                  padding: '4px 12px', 
                  borderRadius: '12px', 
                  fontSize: '11px', 
                  fontWeight: '700',
                  background: selectedAsset.status === 'active' ? '#d1fae5' : '#fee2e2',
                  color: selectedAsset.status === 'active' ? '#059669' : '#dc2626'
                }}>
                  {selectedAsset.status.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => handleDeleteAsset(selectedAsset.id)}
                  style={{
                    background: '#fee2e2',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={16} color="#dc2626" />
                </button>
                <button 
                  onClick={() => setSelectedAsset(null)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Type</div>
                <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>
                  {selectedAsset.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              </div>
              
              {selectedAsset.county && (
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>County</div>
                  <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{selectedAsset.county}</div>
                </div>
              )}

              {selectedAsset.capacity && (
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Capacity</div>
                  <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{selectedAsset.capacity}</div>
                </div>
              )}

              {selectedAsset.diameter_mm && (
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Diameter</div>
                  <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{selectedAsset.diameter_mm}mm</div>
                </div>
              )}

              {selectedAsset.material && (
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Material</div>
                  <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{selectedAsset.material}</div>
                </div>
              )}

              <div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Coordinates</div>
                <div style={{ fontSize: '13px', color: '#0f172a', fontFamily: 'monospace' }}>
                  {selectedAsset.latitude.toFixed(6)}, {selectedAsset.longitude.toFixed(6)}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Asset Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '20px'
            }}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '32px',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
                  Add New Node
                </h2>
                <button 
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddAsset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                    placeholder="e.g., Kibera Sensor Node 2"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                      Type *
                    </label>
                    <select
                      required
                      value={newAsset.type}
                      onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        fontSize: '14px',
                        background: 'white',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="sensor">Sensor</option>
                      <option value="reservoir">Reservoir</option>
                      <option value="treatment_plant">Treatment Plant</option>
                      <option value="water_tower">Water Tower</option>
                      <option value="water_point">Water Point</option>
                      <option value="valve">Valve</option>
                      <option value="hydrant">Hydrant</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                      County
                    </label>
                    <input
                      type="text"
                      value={newAsset.county}
                      onChange={(e) => setNewAsset({ ...newAsset, county: e.target.value })}
                      placeholder="e.g., Nairobi"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                      Latitude *
                    </label>
                    <input
                      type="number"
                      step="0.00000001"
                      required
                      value={newAsset.latitude}
                      onChange={(e) => setNewAsset({ ...newAsset, latitude: e.target.value })}
                      placeholder="-1.2921"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                      Longitude *
                    </label>
                    <input
                      type="number"
                      step="0.00000001"
                      required
                      value={newAsset.longitude}
                      onChange={(e) => setNewAsset({ ...newAsset, longitude: e.target.value })}
                      placeholder="36.8219"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    Capacity (optional)
                  </label>
                  <input
                    type="text"
                    value={newAsset.capacity}
                    onChange={(e) => setNewAsset({ ...newAsset, capacity: e.target.value })}
                    placeholder="e.g., 50M liters"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: '700',
                      fontSize: '15px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 2,
                      padding: '14px',
                      background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: '700',
                      fontSize: '15px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Save size={18} />
                    Add Node
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
