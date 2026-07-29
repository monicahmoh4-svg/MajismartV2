import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, X, Save, Trash2, RefreshCw, Filter, Package, Activity, MapPin } from 'lucide-react'
import api from '../api'

const ALL_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho',
  'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
  'Meru', 'Migori', 'Mombasa', 'Muranga', 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu', 'Siaya',
  'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans-Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
]

const ASSET_TYPES = [
  { value: 'sensor', label: 'IoT Sensor' }, { value: 'reservoir', label: 'Reservoir' },
  { value: 'treatment_plant', label: 'Treatment Plant' }, { value: 'water_tower', label: 'Water Tower' },
  { value: 'water_point', label: 'Water Point' }, { value: 'valve', label: 'Valve' }, { value: 'hydrant', label: 'Hydrant' }
]

export default function AssetManagement() {
  const [assets, setAssets] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCounty, setFilterCounty] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newAsset, setNewAsset] = useState({
    name: '', type: 'sensor', county: 'Nairobi', status: 'active',
    latitude: '', longitude: '', manufacturer: '', serial_number: '', capacity: ''
  })

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (filterCounty) params.append('county', filterCounty)
      if (filterType) params.append('type', filterType)
      if (filterStatus) params.append('status', filterStatus)
      
      const response = await api.get(`/assets?${params.toString()}`)
      setAssets(response.assets || [])
    } catch (err) {
      console.error('Fetch assets error:', err)
      setAssets([])
    } finally {
      setLoading(false)
    }
  }, [searchQuery, filterCounty, filterType, filterStatus])

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/assets/stats')
      setStats(response)
    } catch (err) {
      console.error('Fetch stats error:', err)
    }
  }, [])

  useEffect(() => {
    fetchAssets()
    fetchStats()
  }, [fetchAssets, fetchStats])

  const handleAddAsset = async (e) => {
    e.preventDefault()
    try {
      await api.post('/assets', {
        ...newAsset,
        latitude: newAsset.latitude ? parseFloat(newAsset.latitude) : null,
        longitude: newAsset.longitude ? parseFloat(newAsset.longitude) : null
      })
      setShowAddModal(false)
      setNewAsset({ name: '', type: 'sensor', county: 'Nairobi', status: 'active', latitude: '', longitude: '', manufacturer: '', serial_number: '', capacity: '' })
      fetchAssets()
      fetchStats()
    } catch (err) {
      alert('Failed to add asset: ' + (err?.error || err?.message || 'Unknown error'))
    }
  }

  const handleDeleteAsset = async (id) => {
    if (!confirm('Delete this asset permanently?')) return
    try {
      await api.delete(`/assets/${id}`)
      fetchAssets()
      fetchStats()
    } catch (err) {
      alert('Failed to delete asset')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      active: { bg: '#d1fae5', text: '#059669' },
      maintenance: { bg: '#fef3c7', text: '#d97706' },
      offline: { bg: '#fee2e2', text: '#dc2626' }
    }
    return colors[status] || colors.active
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', background: '#f8fafc', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>Asset Management</h1>
          <p style={{ margin: 0, fontSize: '15px', color: '#64748b' }}>Track and manage all water infrastructure assets across Kenya</p>
        </div>

        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <StatCard icon={Package} title="Total Assets" value={stats.total_assets || 0} color="#0891b2" />
            <StatCard icon={Activity} title="Active" value={stats.active || 0} color="#10b981" />
            <StatCard icon={MapPin} title="Asset Types" value={stats.by_type?.length || 0} color="#8b5cf6" />
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
            <input type="text" placeholder="Search by name or serial..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <select value={filterCounty} onChange={(e) => setFilterCounty(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white', cursor: 'pointer', minWidth: '160px' }}>
            <option value="">All Counties</option>
            {ALL_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white', cursor: 'pointer', minWidth: '160px' }}>
            <option value="">All Types</option>
            {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white', cursor: 'pointer', minWidth: '160px' }}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="offline">Offline</option>
          </select>

          <button onClick={fetchAssets} style={{ padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
            <RefreshCw size={14} /> Refresh
          </button>

          <button onClick={() => setShowAddModal(true)} style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '700', color: 'white', boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)' }}>
            <Plus size={14} /> Add Asset
          </button>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #0891b2', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
              <p style={{ color: '#64748b' }}>Loading assets...</p>
            </div>
          ) : assets.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <Package style={{ width: '48px', height: '48px', color: '#cbd5e1', margin: '0 auto 16px' }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#0f172a' }}>No assets found</h3>
              <p style={{ margin: 0, color: '#64748b' }}>Try adjusting your filters or add a new asset</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>Name</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>Type</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>County</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>Serial</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => {
                    const statusColor = getStatusColor(asset.status)
                    return (
                      <tr key={asset.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                        <td style={{ padding: '14px 16px', fontWeight: '600', color: '#0f172a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {asset.latitude && asset.longitude && <MapPin size={14} color="#0891b2" />}
                            {asset.name}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#475569' }}>{(asset.type || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                        <td style={{ padding: '14px 16px', color: '#475569' }}>{asset.county || '-'}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', background: statusColor.bg, color: statusColor.text }}>
                            {(asset.status || 'unknown').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#64748b', fontFamily: 'monospace', fontSize: '12px' }}>{asset.serial_number || '-'}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <button onClick={() => handleDeleteAsset(asset.id)} style={{ padding: '6px 12px', background: '#fee2e2', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', color: '#dc2626' }}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}
            onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: 'white', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>Add New Asset</h2>
                <button onClick={() => setShowAddModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <form onSubmit={handleAddAsset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Asset Name *</label>
                  <input type="text" required value={newAsset.name} onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })} placeholder="e.g., Kibera Sensor Node 2"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Type *</label>
                    <select required value={newAsset.type} onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white', boxSizing: 'border-box' }}>
                      {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>County *</label>
                    <select required value={newAsset.county} onChange={(e) => setNewAsset({ ...newAsset, county: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white', boxSizing: 'border-box' }}>
                      {ALL_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Latitude *</label>
                    <input type="number" step="any" required value={newAsset.latitude} onChange={(e) => setNewAsset({ ...newAsset, latitude: e.target.value })} placeholder="-1.2921"
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Longitude *</label>
                    <input type="number" step="any" required value={newAsset.longitude} onChange={(e) => setNewAsset({ ...newAsset, longitude: e.target.value })} placeholder="36.8219"
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Serial Number</label>
                    <input type="text" value={newAsset.serial_number} onChange={(e) => setNewAsset({ ...newAsset, serial_number: e.target.value })} placeholder="e.g., SN-2024-001"
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Capacity</label>
                    <input type="text" value={newAsset.capacity} onChange={(e) => setNewAsset({ ...newAsset, capacity: e.target.value })} placeholder="e.g., 50M liters"
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Add Asset</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatCard({ icon: Icon, title, value, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
        <div style={{ width: '40px', height: '40px', background: `${color}15`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
      </div>
      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{value}</div>
    </motion.div>
  )
}
