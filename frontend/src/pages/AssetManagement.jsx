import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Plus, X, Save, Trash2, RefreshCw, Filter, Package, Activity, 
  MapPin, AlertTriangle, Calendar, DollarSign, Wrench, ClipboardCheck, 
  Paperclip, Download, Upload, Eye, FileText, QrCode, CheckCircle,
  TrendingUp, TrendingDown, Clock, Shield, AlertCircle
} from 'lucide-react'
import api from '../api'

const ALL_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho',
  'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
  'Meru', 'Migori', 'Mombasa', 'Muranga', 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu', 'Siaya',
  'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans-Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
]

const ASSET_TYPES = [
  { value: 'sensor', label: 'IoT Sensor', icon: '📡' },
  { value: 'reservoir', label: 'Reservoir', icon: '💧' },
  { value: 'treatment_plant', label: 'Treatment Plant', icon: '🏭' },
  { value: 'water_tower', label: 'Water Tower', icon: '🗼' },
  { value: 'water_point', label: 'Water Point', icon: '🚰' },
  { value: 'valve', label: 'Valve', icon: '🔧' },
  { value: 'hydrant', label: 'Hydrant', icon: '🚒' },
  { value: 'pipeline', label: 'Pipeline', icon: '🔵' },
  { value: 'meter', label: 'Water Meter', icon: '📊' },
  { value: 'pump', label: 'Pump', icon: '⚙️' },
  { value: 'tank', label: 'Tank', icon: '🛢️' }
]

const CONDITION_COLORS = {
  good: { bg: '#d1fae5', text: '#059669', label: 'Good' },
  fair: { bg: '#dbeafe', text: '#2563eb', label: 'Fair' },
  poor: { bg: '#fef3c7', text: '#d97706', label: 'Poor' },
  critical: { bg: '#fee2e2', text: '#dc2626', label: 'Critical' }
}

const STATUS_COLORS = {
  active: { bg: '#d1fae5', text: '#059669' },
  maintenance: { bg: '#fef3c7', text: '#d97706' },
  offline: { bg: '#fee2e2', text: '#dc2626' }
}

export default function AssetManagement() {
  const [assets, setAssets] = useState([])
  const [stats, setStats] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCounty, setFilterCounty] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCondition, setFilterCondition] = useState('')
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [showInspectionModal, setShowInspectionModal] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [exporting, setExporting] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)

  const [newAsset, setNewAsset] = useState({
    name: '', type: 'sensor', county: 'Nairobi', status: 'active',
    latitude: '', longitude: '', manufacturer: '', serial_number: '',
    capacity: '', diameter_mm: '', material: '', expected_lifespan_years: '25',
    installation_date: '', warranty_expires: '', notes: ''
  })

  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenance_type: 'preventive', description: '', performed_by: '',
    cost_ksh: '', parts_used: '', next_due_date: ''
  })

  const [inspectionForm, setInspectionForm] = useState({
    inspector_name: '', condition_rating: 'good', findings: '',
    recommendations: '', next_inspection_date: ''
  })

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (filterCounty) params.append('county', filterCounty)
      if (filterType) params.append('type', filterType)
      if (filterStatus) params.append('status', filterStatus)
      if (filterCondition) params.append('condition', filterCondition)
      
      const response = await api.get(`/assets?${params.toString()}`)
      setAssets(response.assets || [])
    } catch (err) {
      console.error('Fetch assets error:', err)
      setAssets([])
    } finally {
      setLoading(false)
    }
  }, [searchQuery, filterCounty, filterType, filterStatus, filterCondition])

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/assets/stats')
      setStats(response)
    } catch (err) {
      console.error('Fetch stats error:', err)
    }
  }, [])

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await api.get('/assets/alerts')
      setAlerts(response.alerts || [])
    } catch (err) {
      console.error('Fetch alerts error:', err)
      setAlerts([])
    }
  }, [])

  useEffect(() => {
    fetchAssets()
    fetchStats()
    fetchAlerts()
  }, [fetchAssets, fetchStats, fetchAlerts])

  const handleAddAsset = async (e) => {
    e.preventDefault()
    try {
      await api.post('/assets', {
        ...newAsset,
        latitude: newAsset.latitude ? parseFloat(newAsset.latitude) : null,
        longitude: newAsset.longitude ? parseFloat(newAsset.longitude) : null,
        diameter_mm: newAsset.diameter_mm ? parseInt(newAsset.diameter_mm) : null,
        expected_lifespan_years: newAsset.expected_lifespan_years ? parseInt(newAsset.expected_lifespan_years) : null
      })
      setShowAddModal(false)
      resetNewAssetForm()
      fetchAssets()
      fetchStats()
      fetchAlerts()
    } catch (err) {
      alert('Failed to add asset: ' + (err?.error || err?.message || 'Unknown error'))
    }
  }

  const resetNewAssetForm = () => {
    setNewAsset({
      name: '', type: 'sensor', county: 'Nairobi', status: 'active',
      latitude: '', longitude: '', manufacturer: '', serial_number: '',
      capacity: '', diameter_mm: '', material: '', expected_lifespan_years: '25',
      installation_date: '', warranty_expires: '', notes: ''
    })
  }

  const handleDeleteAsset = async (id) => {
    if (!confirm('Delete this asset permanently? This action cannot be undone.')) return
    try {
      await api.delete(`/assets/${id}`)
      setSelectedAsset(null)
      fetchAssets()
      fetchStats()
      fetchAlerts()
    } catch (err) {
      alert('Failed to delete asset')
    }
  }

  const handleLogMaintenance = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/assets/${selectedAsset.asset?.id || selectedAsset.id}/maintenance`, {
        ...maintenanceForm,
        cost_ksh: maintenanceForm.cost_ksh ? parseFloat(maintenanceForm.cost_ksh) : null
      })
      setShowMaintenanceModal(false)
      setMaintenanceForm({ maintenance_type: 'preventive', description: '', performed_by: '', cost_ksh: '', parts_used: '', next_due_date: '' })
      fetchAssetDetails(selectedAsset.asset?.id || selectedAsset.id)
      fetchStats()
      fetchAlerts()
    } catch (err) {
      alert('Failed to log maintenance')
    }
  }

  const handleLogInspection = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/assets/${selectedAsset.asset?.id || selectedAsset.id}/inspection`, inspectionForm)
      setShowInspectionModal(false)
      setInspectionForm({ inspector_name: '', condition_rating: 'good', findings: '', recommendations: '', next_inspection_date: '' })
      fetchAssetDetails(selectedAsset.asset?.id || selectedAsset.id)
      fetchStats()
      fetchAlerts()
    } catch (err) {
      alert('Failed to log inspection')
    }
  }

  const fetchAssetDetails = async (id) => {
    try {
      const response = await api.get(`/assets/${id}`)
      setSelectedAsset(response)
    } catch (err) {
      console.error('Fetch asset details error:', err)
    }
  }

  const handleExportCSV = async () => {
    try {
      setExporting(true)
      const response = await fetch(`${api.defaults.baseURL}/assets/export/csv`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `majismart-assets-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to export CSV: ' + (err.message || 'Unknown error'))
    } finally {
      setExporting(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      setExportingPDF(true)
      const { generateAssetReport } = await import('../utils/pdfGenerator')
      const filename = await generateAssetReport(assets, stats)
      alert(`✅ PDF generated: ${filename}`)
    } catch (err) {
      console.error('PDF export error:', err)
      alert('Failed to generate PDF: ' + (err.message || 'Unknown error'))
    } finally {
      setExportingPDF(false)
    }
  }

  const handleExportSingleAssetPDF = async () => {
    if (!selectedAsset) return
    try {
      setExportingPDF(true)
      const { generateSingleAssetReport } = await import('../utils/pdfGenerator')
      const filename = await generateSingleAssetReport(selectedAsset)
      alert(`✅ Asset PDF generated: ${filename}`)
    } catch (err) {
      console.error('Single asset PDF error:', err)
      alert('Failed to generate asset PDF: ' + (err.message || 'Unknown error'))
    } finally {
      setExportingPDF(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !selectedAsset) return
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Max 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        await api.post(`/assets/${selectedAsset.asset?.id || selectedAsset.id}/attachments`, {
          filename: file.name,
          file_type: file.type,
          file_data: reader.result,
          uploaded_by: 'User'
        })
        fetchAssetDetails(selectedAsset.asset?.id || selectedAsset.id)
      } catch (err) {
        alert('Upload failed')
      }
    }
    reader.readAsDataURL(file)
  }

  const getConditionBadge = (condition) => {
    const c = CONDITION_COLORS[condition] || CONDITION_COLORS.good
    return (
      <span style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', background: c.bg, color: c.text }}>
        {c.label.toUpperCase()}
      </span>
    )
  }

  const getStatusBadge = (status) => {
    const s = STATUS_COLORS[status] || STATUS_COLORS.active
    return (
      <span style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', background: s.bg, color: s.text }}>
        {(status || 'unknown').toUpperCase()}
      </span>
    )
  }

  const daysUntil = (date) => {
    if (!date) return null
    const diff = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const currentAsset = selectedAsset?.asset || selectedAsset
  const maintenanceHistory = selectedAsset?.maintenance || []
  const inspectionHistory = selectedAsset?.inspections || []
  const attachments = selectedAsset?.attachments || []

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', background: '#f8fafc', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>Asset Management</h1>
            <p style={{ margin: 0, fontSize: '15px', color: '#64748b' }}>Complete lifecycle tracking for water infrastructure across Kenya</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={handleExportCSV} disabled={exporting}
              style={{ padding: '10px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: exporting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#475569', opacity: exporting ? 0.6 : 1 }}>
              <Download size={14} /> {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button onClick={handleExportPDF} disabled={exportingPDF}
              style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #dc2626, #ef4444)', border: 'none', borderRadius: '8px', cursor: exportingPDF ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '700', color: 'white', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)', opacity: exportingPDF ? 0.6 : 1 }}>
              <FileText size={14} /> {exportingPDF ? 'Generating...' : 'Export PDF'}
            </button>
            <button onClick={() => { fetchAssets(); fetchStats(); fetchAlerts(); }}
              style={{ padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={() => setShowAddModal(true)}
              style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '700', color: 'white', boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)' }}>
              <Plus size={14} /> Add Asset
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <StatCard icon={Package} title="Total Assets" value={stats.total_assets || 0} color="#0891b2" />
            <StatCard icon={CheckCircle} title="Active" value={stats.active || 0} color="#10b981" />
            <StatCard icon={AlertTriangle} title="Critical" value={stats.critical_condition || 0} color="#ef4444" />
            <StatCard icon={Wrench} title="Overdue Maint." value={stats.overdue_maintenance || 0} color="#f59e0b" />
            <StatCard icon={ClipboardCheck} title="Overdue Inspections" value={stats.overdue_inspections || 0} color="#8b5cf6" />
            <StatCard icon={DollarSign} title="Total Maint. Cost" value={`KES ${Number(stats.total_maintenance_cost || 0).toLocaleString()}`} color="#06b6d4" />
          </div>
        )}

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: '12px', padding: '16px', marginBottom: '24px', border: '1px solid #fbbf24' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <AlertCircle size={20} color="#d97706" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#92400e' }}>
                Attention Required ({alerts.length} assets)
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
              {alerts.slice(0, 6).map((alert) => (
                <div key={alert.id} onClick={() => { setSelectedAsset({ asset: alert }); setActiveTab('overview'); }}
                  style={{ background: 'white', padding: '12px', borderRadius: '8px', cursor: 'pointer', border: '1px solid #fde68a', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{alert.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={10} /> {alert.county}
                  </div>
                  {alert.days_overdue_maintenance > 0 && (
                    <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', fontWeight: '600' }}>
                      🔧 Maintenance overdue by {Math.floor(alert.days_overdue_maintenance)} days
                    </div>
                  )}
                  {alert.days_overdue_inspection > 0 && (
                    <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px', fontWeight: '600' }}>
                      📋 Inspection overdue by {Math.floor(alert.days_overdue_inspection)} days
                    </div>
                  )}
                  {alert.condition === 'critical' && (
                    <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', fontWeight: '700' }}>
                      ⚠️ CRITICAL CONDITION
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
            <input type="text" placeholder="Search by name or serial..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <select value={filterCounty} onChange={(e) => setFilterCounty(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white', cursor: 'pointer', minWidth: '150px' }}>
            <option value="">All Counties</option>
            {ALL_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white', cursor: 'pointer', minWidth: '140px' }}>
            <option value="">All Types</option>
            {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white', cursor: 'pointer', minWidth: '130px' }}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="offline">Offline</option>
          </select>

          <select value={filterCondition} onChange={(e) => setFilterCondition(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white', cursor: 'pointer', minWidth: '140px' }}>
            <option value="">All Conditions</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Assets Table */}
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
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>County</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Condition</th>
                    <th style={thStyle}>Age</th>
                    <th style={thStyle}>Next Maintenance</th>
                    <th style={thStyle}>Serial</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => {
                    const nextMaintDays = daysUntil(asset.next_maintenance_date)
                    const isOverdueMaint = nextMaintDays !== null && nextMaintDays < 0
                    return (
                      <tr key={asset.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s', cursor: 'pointer' }}
                        onClick={() => { setSelectedAsset({ asset }); setActiveTab('overview'); }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                        <td style={{ padding: '14px 16px', fontWeight: '600', color: '#0f172a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {asset.latitude && asset.longitude && <MapPin size={14} color="#0891b2" />}
                            {asset.name}
                            {asset.qr_code && <QrCode size={12} color="#94a3b8" />}
                          </div>
                        </td>
                        <td style={tdStyle}>{(asset.type || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                        <td style={tdStyle}>{asset.county || '-'}</td>
                        <td style={tdStyle}>{getStatusBadge(asset.status)}</td>
                        <td style={tdStyle}>{getConditionBadge(asset.condition)}</td>
                        <td style={tdStyle}>{asset.age_years ? `${asset.age_years} yrs` : '-'}</td>
                        <td style={tdStyle}>
                          {asset.next_maintenance_date ? (
                            <span style={{ 
                              padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600',
                              background: isOverdueMaint ? '#fee2e2' : '#f0fdf4',
                              color: isOverdueMaint ? '#dc2626' : '#166534'
                            }}>
                              {isOverdueMaint ? `Overdue ${Math.abs(nextMaintDays)}d` : `${nextMaintDays}d`}
                            </span>
                          ) : '-'}
                        </td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>{asset.serial_number || '-'}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedAsset({ asset }); setActiveTab('overview'); }}
                            style={{ padding: '6px 12px', background: '#eff6ff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', color: '#0891b2' }}>
                            <Eye size={14} /> View
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

      {/* Asset Detail Panel */}
      <AnimatePresence>
        {selectedAsset && currentAsset && (
          <motion.div initial={{ x: 500 }} animate={{ x: 0 }} exit={{ x: 500 }} transition={{ type: 'spring', damping: 25 }}
            style={{ position: 'fixed', top: '70px', right: 0, width: '500px', height: 'calc(100vh - 70px)', background: 'white', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
            
            {/* Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '800' }}>{currentAsset.name}</h2>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.25)', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                      {(currentAsset.type || '').replace(/_/g, ' ').toUpperCase()}
                    </span>
                    {currentAsset.condition && getConditionBadge(currentAsset.condition)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={handleExportSingleAssetPDF} disabled={exportingPDF}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', padding: '6px', cursor: exportingPDF ? 'not-allowed' : 'pointer', color: 'white' }} 
                    title="Export Asset PDF">
                    <FileText size={16} />
                  </button>
                  <button onClick={() => setShowMaintenanceModal(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'white' }} title="Log Maintenance">
                    <Wrench size={16} />
                  </button>
                  <button onClick={() => setShowInspectionModal(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'white' }} title="Log Inspection">
                    <ClipboardCheck size={16} />
                  </button>
                  <button onClick={() => handleDeleteAsset(currentAsset.id)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'white' }} title="Delete">
                    <Trash2 size={16} />
                  </button>
                  <button onClick={() => setSelectedAsset(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'white' }}>
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '13px', opacity: 0.95, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {currentAsset.county && <span>📍 {currentAsset.county}</span>}
                {currentAsset.serial_number && <span>🔖 {currentAsset.serial_number}</span>}
                {currentAsset.age_years && <span>📅 {currentAsset.age_years} years old</span>}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              {[
                { id: 'overview', label: 'Overview', icon: Package },
                { id: 'maintenance', label: 'Maintenance', icon: Wrench },
                { id: 'inspections', label: 'Inspections', icon: ClipboardCheck },
                { id: 'files', label: 'Files', icon: Paperclip }
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ flex: 1, padding: '12px', background: activeTab === tab.id ? 'white' : 'transparent', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #0891b2' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: activeTab === tab.id ? '#0891b2' : '#64748b' }}>
                  <tab.icon size={14} /> {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <InfoRow icon={MapPin} label="GPS Coordinates" value={currentAsset.latitude && currentAsset.longitude ? `${Number(currentAsset.latitude).toFixed(6)}, ${Number(currentAsset.longitude).toFixed(6)}` : 'Not set'} />
                  <InfoRow icon={Package} label="Manufacturer" value={currentAsset.manufacturer || 'Not specified'} />
                  <InfoRow icon={Package} label="Material" value={currentAsset.material || 'N/A'} />
                  <InfoRow icon={Package} label="Capacity" value={currentAsset.capacity || 'N/A'} />
                  {currentAsset.diameter_mm && <InfoRow icon={Package} label="Diameter" value={`${currentAsset.diameter_mm}mm`} />}
                  <InfoRow icon={Calendar} label="Installation Date" value={currentAsset.installation_date ? new Date(currentAsset.installation_date).toLocaleDateString() : 'Not recorded'} />
                  <InfoRow icon={Calendar} label="Expected Lifespan" value={currentAsset.expected_lifespan_years ? `${currentAsset.expected_lifespan_years} years` : 'Not specified'} />
                  <InfoRow icon={Shield} label="Warranty Expires" value={currentAsset.warranty_expires ? new Date(currentAsset.warranty_expires).toLocaleDateString() : 'Not specified'} />
                  <InfoRow icon={Wrench} label="Last Maintenance" value={currentAsset.last_maintenance_date ? new Date(currentAsset.last_maintenance_date).toLocaleDateString() : 'Never'} />
                  <InfoRow icon={Wrench} label="Next Maintenance" value={currentAsset.next_maintenance_date ? new Date(currentAsset.next_maintenance_date).toLocaleDateString() : 'Not scheduled'} />
                  <InfoRow icon={ClipboardCheck} label="Next Inspection" value={currentAsset.next_inspection_date ? new Date(currentAsset.next_inspection_date).toLocaleDateString() : 'Not scheduled'} />
                  {currentAsset.total_maintenance_cost > 0 && (
                    <InfoRow icon={DollarSign} label="Total Maintenance Cost" value={`KES ${Number(currentAsset.total_maintenance_cost).toLocaleString()}`} />
                  )}
                  {currentAsset.qr_code && (
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>QR Code ID</div>
                      <div style={{ fontSize: '12px', color: '#0f172a', fontFamily: 'monospace', wordBreak: 'break-all' }}>{currentAsset.qr_code}</div>
                    </div>
                  )}
                  {currentAsset.notes && (
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#475569' }}>
                      <strong>Notes:</strong> {currentAsset.notes}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'maintenance' && (
                <div>
                  <button onClick={() => setShowMaintenanceModal(true)}
                    style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '16px' }}>
                    <Plus size={16} /> Log Maintenance
                  </button>
                  {maintenanceHistory.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {maintenanceHistory.map((m) => (
                        <div key={m.id} style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                            <strong style={{ fontSize: '14px', color: '#0f172a', textTransform: 'capitalize' }}>{m.maintenance_type}</strong>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{new Date(m.performed_at).toLocaleDateString()}</span>
                          </div>
                          {m.description && <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#475569' }}>{m.description}</p>}
                          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#64748b', flexWrap: 'wrap' }}>
                            {m.performed_by && <span>👷 {m.performed_by}</span>}
                            {m.cost_ksh && <span>💰 KES {Number(m.cost_ksh).toLocaleString()}</span>}
                            {m.parts_used && <span>🔧 {m.parts_used}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      <Wrench style={{ width: '40px', height: '40px', color: '#cbd5e1', margin: '0 auto 12px' }} />
                      <p>No maintenance records yet</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'inspections' && (
                <div>
                  <button onClick={() => setShowInspectionModal(true)}
                    style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '16px' }}>
                    <Plus size={16} /> Log Inspection
                  </button>
                  {inspectionHistory.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {inspectionHistory.map((i) => (
                        <div key={i.id} style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              {i.condition_rating && getConditionBadge(i.condition_rating)}
                            </div>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{new Date(i.inspected_at).toLocaleDateString()}</span>
                          </div>
                          {i.inspector_name && <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#64748b' }}>👷 {i.inspector_name}</p>}
                          {i.findings && <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#475569' }}>{i.findings}</p>}
                          {i.recommendations && <p style={{ margin: 0, fontSize: '12px', color: '#0891b2', fontStyle: 'italic' }}>💡 {i.recommendations}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      <ClipboardCheck style={{ width: '40px', height: '40px', color: '#cbd5e1', margin: '0 auto 12px' }} />
                      <p>No inspections recorded yet</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'files' && (
                <div>
                  <label style={{ display: 'block', padding: '24px', border: '2px dashed #cbd5e1', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', background: '#fafafa', marginBottom: '16px' }}>
                    <Upload size={28} color="#94a3b8" style={{ margin: '0 auto 8px', display: 'block' }} />
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Click to upload file</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Max 5MB • Photos, manuals, certificates</div>
                    <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                  {attachments.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {attachments.map((a) => (
                        <div key={a.id} style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Paperclip size={16} color="#0891b2" />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{a.filename}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{new Date(a.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      <Paperclip style={{ width: '40px', height: '40px', color: '#cbd5e1', margin: '0 auto 12px' }} />
                      <p>No attachments yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Asset Modal */}
      <AnimatePresence>
        {showAddModal && (
          <ModalOverlay onClose={() => setShowAddModal(false)}>
            <ModalContent title="Add New Asset" onClose={() => setShowAddModal(false)}>
              <form onSubmit={handleAddAsset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <FormField label="Asset Name *" required>
                  <input type="text" required value={newAsset.name} onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })} placeholder="e.g., Kibera Sensor Node 2" style={inputStyle} />
                </FormField>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <FormField label="Type *">
                    <select required value={newAsset.type} onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })} style={inputStyle}>
                      {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </FormField>
                  <FormField label="County *">
                    <select required value={newAsset.county} onChange={(e) => setNewAsset({ ...newAsset, county: e.target.value })} style={inputStyle}>
                      {ALL_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </FormField>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <FormField label="Latitude *">
                    <input type="number" step="any" required value={newAsset.latitude} onChange={(e) => setNewAsset({ ...newAsset, latitude: e.target.value })} placeholder="-1.2921" style={inputStyle} />
                  </FormField>
                  <FormField label="Longitude *">
                    <input type="number" step="any" required value={newAsset.longitude} onChange={(e) => setNewAsset({ ...newAsset, longitude: e.target.value })} placeholder="36.8219" style={inputStyle} />
                  </FormField>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <FormField label="Manufacturer">
                    <input type="text" value={newAsset.manufacturer} onChange={(e) => setNewAsset({ ...newAsset, manufacturer: e.target.value })} placeholder="e.g., Siemens" style={inputStyle} />
                  </FormField>
                  <FormField label="Serial Number">
                    <input type="text" value={newAsset.serial_number} onChange={(e) => setNewAsset({ ...newAsset, serial_number: e.target.value })} placeholder="e.g., SN-2024-001" style={inputStyle} />
                  </FormField>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <FormField label="Capacity">
                    <input type="text" value={newAsset.capacity} onChange={(e) => setNewAsset({ ...newAsset, capacity: e.target.value })} placeholder="e.g., 50M liters" style={inputStyle} />
                  </FormField>
                  <FormField label="Diameter (mm)">
                    <input type="number" value={newAsset.diameter_mm} onChange={(e) => setNewAsset({ ...newAsset, diameter_mm: e.target.value })} placeholder="e.g., 500" style={inputStyle} />
                  </FormField>
                  <FormField label="Material">
                    <input type="text" value={newAsset.material} onChange={(e) => setNewAsset({ ...newAsset, material: e.target.value })} placeholder="e.g., Ductile Iron" style={inputStyle} />
                  </FormField>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <FormField label="Installation Date">
                    <input type="date" value={newAsset.installation_date} onChange={(e) => setNewAsset({ ...newAsset, installation_date: e.target.value })} style={inputStyle} />
                  </FormField>
                  <FormField label="Lifespan (years)">
                    <input type="number" value={newAsset.expected_lifespan_years} onChange={(e) => setNewAsset({ ...newAsset, expected_lifespan_years: e.target.value })} placeholder="25" style={inputStyle} />
                  </FormField>
                  <FormField label="Warranty Expires">
                    <input type="date" value={newAsset.warranty_expires} onChange={(e) => setNewAsset({ ...newAsset, warranty_expires: e.target.value })} style={inputStyle} />
                  </FormField>
                </div>
                <FormField label="Notes">
                  <textarea value={newAsset.notes} onChange={(e) => setNewAsset({ ...newAsset, notes: e.target.value })} placeholder="Additional notes..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                </FormField>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Save size={16} /> Add Asset
                  </button>
                </div>
              </form>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Maintenance Modal */}
      <AnimatePresence>
        {showMaintenanceModal && (
          <ModalOverlay onClose={() => setShowMaintenanceModal(false)}>
            <ModalContent title="Log Maintenance" onClose={() => setShowMaintenanceModal(false)}>
              <form onSubmit={handleLogMaintenance} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <FormField label="Maintenance Type *">
                  <select required value={maintenanceForm.maintenance_type} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, maintenance_type: e.target.value })} style={inputStyle}>
                    <option value="preventive">Preventive</option>
                    <option value="corrective">Corrective</option>
                    <option value="emergency">Emergency</option>
                    <option value="inspection">Inspection</option>
                  </select>
                </FormField>
                <FormField label="Description">
                  <textarea value={maintenanceForm.description} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })} placeholder="What was done..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                </FormField>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <FormField label="Performed By">
                    <input type="text" value={maintenanceForm.performed_by} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, performed_by: e.target.value })} placeholder="Technician name" style={inputStyle} />
                  </FormField>
                  <FormField label="Cost (KES)">
                    <input type="number" value={maintenanceForm.cost_ksh} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost_ksh: e.target.value })} placeholder="0" style={inputStyle} />
                  </FormField>
                </div>
                <FormField label="Parts Used">
                  <input type="text" value={maintenanceForm.parts_used} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, parts_used: e.target.value })} placeholder="e.g., Filter, Seal, Bearing" style={inputStyle} />
                </FormField>
                <FormField label="Next Maintenance Due">
                  <input type="date" value={maintenanceForm.next_due_date} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, next_due_date: e.target.value })} style={inputStyle} />
                </FormField>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowMaintenanceModal(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Save size={16} /> Log Maintenance
                  </button>
                </div>
              </form>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Inspection Modal */}
      <AnimatePresence>
        {showInspectionModal && (
          <ModalOverlay onClose={() => setShowInspectionModal(false)}>
            <ModalContent title="Log Inspection" onClose={() => setShowInspectionModal(false)}>
              <form onSubmit={handleLogInspection} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <FormField label="Inspector Name">
                  <input type="text" value={inspectionForm.inspector_name} onChange={(e) => setInspectionForm({ ...inspectionForm, inspector_name: e.target.value })} placeholder="Inspector name" style={inputStyle} />
                </FormField>
                <FormField label="Condition Rating">
                  <select value={inspectionForm.condition_rating} onChange={(e) => setInspectionForm({ ...inspectionForm, condition_rating: e.target.value })} style={inputStyle}>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                    <option value="critical">Critical</option>
                  </select>
                </FormField>
                <FormField label="Findings">
                  <textarea value={inspectionForm.findings} onChange={(e) => setInspectionForm({ ...inspectionForm, findings: e.target.value })} placeholder="What was observed..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                </FormField>
                <FormField label="Recommendations">
                  <textarea value={inspectionForm.recommendations} onChange={(e) => setInspectionForm({ ...inspectionForm, recommendations: e.target.value })} placeholder="Suggested actions..." rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                </FormField>
                <FormField label="Next Inspection Date">
                  <input type="date" value={inspectionForm.next_inspection_date} onChange={(e) => setInspectionForm({ ...inspectionForm, next_inspection_date: e.target.value })} style={inputStyle} />
                </FormField>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowInspectionModal(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Save size={16} /> Log Inspection
                  </button>
                </div>
              </form>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================
// REUSABLE COMPONENTS
// ============================================

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

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
      <Icon size={16} color="#0891b2" />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{label}</div>
        <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{value}</div>
      </div>
    </div>
  )
}

function FormField({ label, required, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#475569' }}>
        {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

function ModalOverlay({ children, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}
      onClick={onClose}>
      {children}
    </motion.div>
  )
}

function ModalContent({ children, title, onClose }) {
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      style={{ background: 'white', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{title}</h2>
        <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}>
          <X size={18} />
        </button>
      </div>
      {children}
    </motion.div>
  )
}

// ============================================
// STYLES
// ============================================

const thStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  fontWeight: '700',
  color: '#475569',
  fontSize: '12px',
  textTransform: 'uppercase'
}

const tdStyle = {
  padding: '14px 16px',
  color: '#475569'
}

const inputStyle = {
  width: '100%',
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '14px',
  boxSizing: 'border-box',
  outline: 'none'
}
