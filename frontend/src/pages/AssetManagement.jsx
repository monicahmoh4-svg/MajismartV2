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
                    <th style={
