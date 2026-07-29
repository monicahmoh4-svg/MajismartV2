import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Search, Plus, X, Save, Trash2, RefreshCw, Filter } from 'lucide-react'
import InteractiveMap from '../components/gis/InteractiveMap'
import api from '../api'

const ALL_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho',
  'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
  'Meru', 'Migori', 'Mombasa', 'Muranga', 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu', 'Siaya',
  'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans-Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
]

export default function GISDashboard() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCounty, setSelectedCounty] = useState('')
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [stats, setStats] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [backendError, setBackendError] = useState(null)
  const [newAsset, setNewAsset] = useState({ name: '', type: 'sensor', latitude: '', longitude: '', county: 'Nairobi', status: 'active', capacity: '' })

  const [activeLayers, setActiveLayers] = useState({
    sensors: true, reservoirs: true, treatmentPlants: true, waterTowers: true,
    waterPoints: true, valves: true, hydrants: true, pipelines: true, dmas: true
  })

  const fetchGISData = useCallback(async () => {
    try {
      setLoading(true)
      setBackendError(null)
      const params = new URLSearchParams()
      if (selectedCounty) params.append('county', selectedCounty)
      
      // ✅ FIX: Only append ? if there are actual parameters
      const queryString = params.toString()
      const url = queryString ? `/gis/assets?${queryString}` : '/gis/assets'
      
      const response = await api.get(url)
      
      if (response && response.error) {
        setBackendError(response.message)
        setAssets([])
      } else {
        setAssets(Array.isArray(response) ? response : [])
      }
    } catch (err) {
      console.error('GIS fetch error:', err)
      setBackendError(err.message || 'Failed to connect to the backend server.')
      setAssets([])
    } finally {
      setLoading(false)
    }
  }, [selectedCounty])

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/gis/stats')
      setStats(response)
    } catch (err) {
      setStats({ total_assets: 0, total_active: 0 })
    }
  }, [])

  useEffect(() => {
    fetchGISData()
    fetchStats()
    const interval = setInterval(fetchGISData, 30000)
    return () => clearInterval(interval)
  }, [fetchGISData, fetchStats])

  const toggleLayer = (layer) => setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }))

  const filteredAssets = assets.filter(asset => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return asset.name?.toLowerCase().includes(q) || asset.id?.toString().includes(q) || asset.county?.toLowerCase().includes(q)
  })

  const handleAddAsset = async (e) => {
    e.preventDefault()
    try {
      await api.post('/gis/assets', {
        ...newAsset,
        latitude: parseFloat(newAsset.latitude),
        longitude: parseFloat(newAsset.longitude),
        capacity: newAsset.capacity || null
      })
      setShowAddModal(false)
      setNewAsset({ name: '', type: 'sensor', latitude: '', longitude: '', county: 'Nairobi', status: 'active', capacity: '' })
      fetchGISData()
    } catch (err) { alert('Failed to add asset') }
  }

  const handleDeleteAsset = async (id) => {
    if (!confirm('Delete this asset?')) return
    try {
      await api.delete(`/gis/assets/${id}`)
      setSelectedAsset(null)
      fetchGISData()
    } catch (err) { alert('Failed to delete') }
  }

  const layerList = [
    { key: 'sensors', label: 'IoT Sensors', icon: '📡' }, { key: 'reservoirs', label: 'Reservoirs', icon: '💧' },
    { key: 'treatmentPlants', label: 'Treatment Plants', icon: '🏭' }, { key: 'waterTowers', label: 'Water Towers', icon: '🗼' },
    { key: 'waterPoints', label: 'Water Points', icon: '🚰' }, { key: 'valves', label: 'Valves', icon: '🔧' },
    { key: 'hydrants', label: 'Hydrants', icon: '🚒' }, { key: 'pipelines', label: 'Pipelines', icon: '🔵' },
    { key: 'dmas', label: 'DMA Zones', icon: '📍' }
  ]

  return (
    <div style={{ height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '350px' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
            <input type="text" placeholder="Search assets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '8px 8px 8px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <select value={selectedCounty} onChange={(e) => setSelectedCounty(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', background: 'white', cursor: 'pointer', minWidth: '180px', fontWeight: selectedCounty ? '700' : '400', color: selectedCounty ? '#0891b2' : '#475569' }}>
            <option value="">All 47 Counties</option>
            {ALL_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={fetchGISData} style={{ padding: '8px 14px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
        <button onClick={() => setShowAddModal(true)} style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={14} /> Add Node
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: '260px', background: 'white', borderRight: '1px solid #e2e8f0', padding: '16px', overflowY: 'auto', flexShrink: 0 }}>
          {stats && (
            <div style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '12px', padding: '14px', marginBottom: '16px', color: 'white' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700' }}>{selectedCounty || 'Network Overview'}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><div style={{ fontSize: '22px', fontWeight: '800' }}>{stats.total_assets || 0}</div><div style={{ fontSize: '10px', opacity: 0.9 }}>Total</div></div>
                <div><div style={{ fontSize: '22px', fontWeight: '800' }}>{stats.total_active || 0}</div><div style={{ fontSize: '10px', opacity: 0.9 }}>Active</div></div>
              </div>
            </div>
          )}
          <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={16} color="#0891b2" /> Layers
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {layerList.map(layer => (
              <label key={layer.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: activeLayers[layer.key] ? '#f0f9ff' : 'transparent', borderRadius: '6px', cursor: 'pointer', border: activeLayers[layer.key] ? '1px solid #bae6fd' : '1px solid transparent' }}>
                <input type="checkbox" checked={activeLayers[layer.key]} onChange={() => toggleLayer(layer.key)} style={{ accentColor: '#0891b2' }} />
                <span>{layer.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: activeLayers[layer.key] ? '#0891b2' : '#475569' }}>{layer.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.85)', zIndex: 10 }}>
              <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #0891b2', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
          )}
          
          {!loading && assets.length === 0 && (
            <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', background: '#fef2f2', border: '1px solid #fecaca', padding: '16px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 5, textAlign: 'center', maxWidth: '500px' }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>⚠️ {backendError || 'No assets found.'}</p>
            </div>
          )}

          <InteractiveMap assets={filteredAssets} activeLayers={activeLayers} onAssetClick={setSelectedAsset} />
        </div>
      </div>

      <AnimatePresence>
        {selectedAsset && (
          <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} style={{ position: 'fixed', top: '70px', right: 0, width: '360px', height: 'calc(100vh - 70px)', background: 'white', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', zIndex: 1000, overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700' }}>{selectedAsset.name}</h3>
                <span style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', background: selectedAsset.status === 'active' ? '#d1fae5' : '#fee2e2', color: selectedAsset.status === 'active' ? '#059669' : '#dc2626' }}>
                  {selectedAsset.status?.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => handleDeleteAsset(selectedAsset.id)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}><Trash2 size={14} color="#dc2626" /></button>
                <button onClick={() => setSelectedAsset(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}><X size={14} /></button>
              </div>
            </div>
            <div style={{ fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div><strong>Type:</strong> {(selectedAsset.type || '').replace(/_/g, ' ')}</div>
              {selectedAsset.county && <div><strong>County:</strong> {selectedAsset.county}</div>}
              <div style={{ fontFamily: 'monospace', fontSize: '11px', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                📍 {Number(selectedAsset.latitude).toFixed(6)}, {Number(selectedAsset.longitude).toFixed(6)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '460px' }}>
              <h2 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: '800' }}>Add New Node</h2>
              <form onSubmit={handleAddAsset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input type="text" required placeholder="Node Name *" value={newAsset.name} onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <select required value={newAsset.type} onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <option value="sensor">Sensor</option><option value="reservoir">Reservoir</option><option value="treatment_plant">Treatment Plant</option>
                    <option value="water_tower">Water Tower</option><option value="water_point">Water Point</option><option value="valve">Valve</option><option value="hydrant">Hydrant</option>
                  </select>
                  <select required value={newAsset.county} onChange={(e) => setNewAsset({ ...newAsset, county: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {ALL_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input type="number" step="any" required placeholder="Latitude *" value={newAsset.latitude} onChange={(e) => setNewAsset({ ...newAsset, latitude: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <input type="number" step="any" required placeholder="Longitude *" value={newAsset.longitude} onChange={(e) => setNewAsset({ ...newAsset, longitude: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ flex: 2, padding: '12px', background: '#0891b2', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Add Node</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
