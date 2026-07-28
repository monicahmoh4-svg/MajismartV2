import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, Layers, Search, Download, Plus, X, Save, Trash2, 
  RefreshCw, FileText, Activity, Filter
} from 'lucide-react'
import InteractiveMap from '../components/gis/InteractiveMap'
import api from '../api'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const MAJISMART_LOGO = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMwZWE1ZTkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwNmI2ZDQiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0idXJsKCNnKSIgcng9IjEwMCIvPjxwYXRoIGQ9Ik0yNTYgODAgQzI1NiA4MCAxMjAgMjQwIDEyMCAzMjAgQTEzNiAxMzYgMCAwIDAgMzkyIDMyMCBDMzkyIDI0MCAyNTYgODAgMjU2IDgwIFoiIGZpbGw9IiNmZmZmZmYiLz48L3N2Zz4='

// All 47 Kenyan counties
const ALL_COUNTIES = [
  'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita-Taveta',
  'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru',
  'Tharaka-Nithi', 'Embu', 'Kitui', 'Machakos', 'Makueni', 'Nyandarua',
  'Nyeri', 'Kirinyaga', 'Muranga', 'Kiambu', 'Turkana', 'West Pokot',
  'Samburu', 'Trans-Nzoia', 'Uasin Gishu', 'Elgeyo-Marakwet', 'Nandi',
  'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 'Kericho',
  'Bomet', 'Kakamega', 'Vihiga', 'Bungoma', 'Busia', 'Siaya',
  'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira', 'Nairobi'
]

export default function GISDashboard() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCounty, setSelectedCounty] = useState('')
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [stats, setStats] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [newAsset, setNewAsset] = useState({
    name: '', type: 'sensor', latitude: '', longitude: '',
    county: '', status: 'active', capacity: '', diameter_mm: '', material: ''
  })

  const [activeLayers, setActiveLayers] = useState({
    sensors: true, reservoirs: true, treatmentPlants: true,
    waterTowers: true, waterPoints: true, valves: true,
    hydrants: true, pipelines: true, dmas: true
  })

  useEffect(() => {
    fetchGISData()
    fetchStats()
    const interval = setInterval(() => {
      fetchGISData()
    }, 30000)
    return () => clearInterval(interval)
  }, [selectedCounty])

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
    asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (asset.id && asset.id.toString().includes(searchQuery)) ||
    (asset.county && asset.county.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const counties = [...new Set(assets.map(a => a.county).filter(Boolean))].sort()

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
      setNewAsset({ name: '', type: 'sensor', latitude: '', longitude: '', county: '', status: 'active', capacity: '', diameter_mm: '', material: '' })
      fetchGISData()
      fetchStats()
      alert('✅ Node added successfully!')
    } catch (error) {
      console.error('Failed to add asset:', error)
      alert('❌ Failed to add asset. Please try again.')
    }
  }

  const handleDeleteAsset = async (id) => {
    if (!confirm('Are you sure you want to delete this asset?')) return
    try {
      await api.delete(`/gis/assets/${id}`)
      setSelectedAsset(null)
      fetchGISData()
      fetchStats()
      alert('✅ Asset deleted successfully!')
    } catch (error) {
      console.error('Failed to delete asset:', error)
      alert('❌ Failed to delete asset.')
    }
  }

  const generatePDFReport = async () => {
    setGeneratingPDF(true)
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const now = new Date()
      
      doc.setFillColor(8, 145, 178)
      doc.rect(0, 0, pageWidth, 40, 'F')
      
      try {
        doc.addImage(MAJISMART_LOGO, 'PNG', 15, 8, 24, 24)
      } catch (e) {
        console.warn('Logo embedding failed')
      }
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text('MajiSmart', 45, 18)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Enterprise GIS Infrastructure Report', 45, 26)
      
      doc.setFontSize(9)
      doc.text(`Generated: ${now.toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - 15, 18, { align: 'right' })
      doc.text(`Time: ${now.toLocaleTimeString('en-KE')}`, pageWidth - 15, 24, { align: 'right' })
      
      let yPos = 55
      
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Executive Summary', 15, yPos)
      yPos += 3
      
      doc.setDrawColor(8, 145, 178)
      doc.setLineWidth(0.8)
      doc.line(15, yPos, pageWidth - 15, yPos)
      yPos += 10
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(71, 85, 105)
      doc.text(
        `This report provides a comprehensive overview of MajiSmart's water infrastructure network${selectedCounty ? ` in ${selectedCounty}` : ' across Kenya'}. The system monitors ${stats?.total_assets || 0} total assets, with ${stats?.total_active || 0} currently operational.`,
        15, yPos, { maxWidth: pageWidth - 30 }
      )
      yPos += 18
      
      const metrics = [
        { label: 'Total Assets', value: stats?.total_assets || 0, color: [8, 145, 178] },
        { label: 'Active', value: stats?.total_active || 0, color: [16, 185, 129] },
        { label: 'Counties', value: counties.length || 1, color: [139, 92, 246] },
        { label: 'Live Sensors', value: stats?.live_sensors || 0, color: [245, 158, 11] }
      ]
      
      const boxWidth = (pageWidth - 45) / 4
      metrics.forEach((metric, i) => {
        const x = 15 + (i * (boxWidth + 5))
        doc.setFillColor(...metric.color)
        doc.roundedRect(x, yPos, boxWidth, 25, 2, 2, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text(metric.value.toString(), x + boxWidth / 2, yPos + 11, { align: 'center' })
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text(metric.label, x + boxWidth / 2, yPos + 19, { align: 'center' })
      })
      yPos += 40
      
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Asset Breakdown by Type', 15, yPos)
      yPos += 3
      doc.setDrawColor(8, 145, 178)
      doc.line(15, yPos, pageWidth - 15, yPos)
      yPos += 8
      
      const typeData = (stats?.by_type || []).map(t => [
        t.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        t.count.toString(),
        t.active_count.toString(),
        t.offline_count.toString()
      ])
      
      if (typeData.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Asset Type', 'Total', 'Active', 'Offline']],
          body: typeData,
          theme: 'striped',
          headStyles: { fillColor: [8, 145, 178], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 9, cellPadding: 4 },
          alternateRowStyles: { fillColor: [240, 249, 255] }
        })
        yPos = doc.lastAutoTable.finalY + 15
      }
      
      if (yPos > 240) {
        doc.addPage()
        yPos = 20
      }
      
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('County Distribution', 15, yPos)
      yPos += 3
      doc.setDrawColor(8, 145, 178)
      doc.line(15, yPos, pageWidth - 15, yPos)
      yPos += 8
      
      const countyData = (stats?.by_county || []).map(c => [
        c.county,
        c.total_assets.toString()
      ])
      
      if (countyData.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['County', 'Total Assets']],
          body: countyData,
          theme: 'striped',
          headStyles: { fillColor: [8, 145, 178], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 9, cellPadding: 4 },
          alternateRowStyles: { fillColor: [240, 249, 255] }
        })
        yPos = doc.lastAutoTable.finalY + 15
      }
      
      if (yPos > 200) {
        doc.addPage()
        yPos = 20
      }
      
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Detailed Asset Inventory', 15, yPos)
      yPos += 3
      doc.setDrawColor(8, 145, 178)
      doc.line(15, yPos, pageWidth - 15, yPos)
      yPos += 8
      
      const assetData = filteredAssets
        .filter(a => a.type !== 'dma' && a.type !== 'pipeline')
        .slice(0, 100)
        .map(a => [
          a.name || 'Unnamed',
          (a.type || '').replace('_', ' '),
          a.county || '-',
          (a.status || 'unknown').toUpperCase(),
          `${(a.latitude || 0).toFixed(4)}, ${(a.longitude || 0).toFixed(4)}`
        ])
      
      if (assetData.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Name', 'Type', 'County', 'Status', 'Coordinates']],
          body: assetData,
          theme: 'striped',
          headStyles: { fillColor: [8, 145, 178], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
          styles: { fontSize: 7, cellPadding: 3 },
          alternateRowStyles: { fillColor: [240, 249, 255] },
          columnStyles: {
            0: { cellWidth: 55 },
            1: { cellWidth: 30 },
            2: { cellWidth: 30 },
            3: { cellWidth: 22 },
            4: { cellWidth: 45, fontStyle: 'italic' }
          },
          didParseCell: function(data) {
            if (data.section === 'body' && data.column.index === 3) {
              if (data.cell.raw === 'ACTIVE') data.cell.styles.textColor = [16, 185, 129]
              else if (data.cell.raw === 'OFFLINE') data.cell.styles.textColor = [239, 68, 68]
              else if (data.cell.raw === 'WARNING') data.cell.styles.textColor = [245, 158, 11]
            }
          }
        })
      }
      
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFillColor(15, 23, 42)
        doc.rect(0, doc.internal.pageSize.getHeight() - 15, pageWidth, 15, 'F')
        doc.setTextColor(148, 163, 184)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text('MajiSmart Kenya • Smart Water Intelligence', 15, doc.internal.pageSize.getHeight() - 6)
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, doc.internal.pageSize.getHeight() - 6, { align: 'right' })
        doc.text('Confidential • For Official Use Only', pageWidth / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' })
      }
      
      const filename = `MajiSmart_GIS_Report_${selectedCounty ? selectedCounty.replace(/\s+/g, '_') + '_' : ''}${now.toISOString().split('T')[0]}.pdf`
      doc.save(filename)
      alert(`✅ Report generated: ${filename}`)
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert(' Failed to generate PDF report.')
    } finally {
      setGeneratingPDF(false)
    }
  }

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
              placeholder="Search assets by name, ID, or county..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter style={{ width: '18px', height: '18px', color: '#64748b' }} />
            <select 
              value={selectedCounty}
              onChange={(e) => setSelectedCounty(e.target.value)}
              style={{ 
                padding: '10px 16px', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0', 
                fontSize: '14px', 
                background: 'white',
                cursor: 'pointer',
                minWidth: '200px',
                fontWeight: '600',
                color: selectedCounty ? '#0891b2' : '#475569'
              }}
            >
              <option value="">All 47 Counties</option>
              {ALL_COUNTIES.map(county => (
                <option key={county} value={county}>{county}</option>
              ))}
            </select>
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={fetchGISData} 
            style={{ padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#475569' }}
          >
            <RefreshCw style={{ width: '16px', height: '16px' }} /> Refresh
          </motion.button>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={generatePDFReport}
            disabled={generatingPDF}
            style={{ 
              padding: '10px 16px', background: 'linear-gradient(135deg, #dc2626, #ef4444)', border: 'none', borderRadius: '8px', 
              cursor: generatingPDF ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', 
              fontSize: '14px', fontWeight: '700', color: 'white', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
              opacity: generatingPDF ? 0.7 : 1
            }}
          >
            <FileText style={{ width: '16px', height: '16px' }} /> 
            {generatingPDF ? 'Generating...' : 'Export PDF'}
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            style={{ 
              padding: '10px 16px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', border: 'none', borderRadius: '8px', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', 
              color: 'white', boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)'
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} /> Add Node
          </motion.button>
        </div>
      </div>

      {/* Main GIS Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Layer Control Sidebar */}
        <motion.div 
          initial={{ x: -300 }} animate={{ x: 0 }} 
          style={{ width: '280px', background: 'white', borderRight: '1px solid #e2e8f0', padding: '20px', overflowY: 'auto' }}
        >
          {stats && (
            <div style={{ 
              background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', borderRadius: '12px', padding: '16px', 
              marginBottom: '20px', color: 'white'
            }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700' }}>
                Network Overview{selectedCounty && ` - ${selectedCounty}`}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '800' }}>{stats.total_assets}</div>
                  <div style={{ fontSize: '11px', opacity: 0.9 }}>Total Assets</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '800' }}>{stats.total_active}</div>
                  <div style={{ fontSize: '11px', opacity: 0.9 }}>Active</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '800' }}>{counties.length || 1}</div>
                  <div style={{ fontSize: '11px', opacity: 0.9 }}>Counties</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '800' }}>
                    <Activity style={{ width: '20px', height: '20px', animation: 'pulse 2s infinite' }} />
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.9 }}>Live Data</div>
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
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', 
                background: activeLayers[layer.key] ? '#f0f9ff' : 'transparent', borderRadius: '8px', 
                cursor: 'pointer', border: activeLayers[layer.key] ? '1px solid #bae6fd' : '1px solid transparent'
              }}>
                <input 
                  type="checkbox" checked={activeLayers[layer.key]} onChange={() => toggleLayer(layer.key)}
                  style={{ width: '18px', height: '18px', accentColor: '#0891b2', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '18px' }}>{layer.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: activeLayers[layer.key] ? '#0891b2' : '#475569', flex: 1 }}>
                  {layer.label}
                </span>
              </label>
            ))}
          </div>
        </motion.div>

        {/* Map Container */}
        <div style={{ flex: 1, position: 'relative', background: '#e2e8f0' }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.9)', zIndex: 10 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '50px', height: '50px', border: '4px solid #e2e8f0', borderTop: '4px solid #0891b2', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Loading GIS data...</p>
              </div>
            </div>
          )}
          <InteractiveMap assets={filteredAssets} activeLayers={activeLayers} onAssetClick={setSelectedAsset} />
        </div>
      </div>

      {/* Asset Details Panel */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            initial={{ y: 300, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 300, opacity: 0 }}
            style={{
              position: 'fixed', bottom: '20px', right: '20px', width: '380px', background: 'white',
              borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', padding: '24px',
              zIndex: 1000, maxHeight: '600px', overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                  {selectedAsset.name}
                </h3>
                <span style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '12px', 
                  fontSize: '11px', fontWeight: '700',
                  background: selectedAsset.status === 'active' ? '#d1fae5' : '#fee2e2',
                  color: selectedAsset.status === 'active' ? '#059669' : '#dc2626'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: selectedAsset.status === 'active' ? '#10b981' : '#ef4444', animation: 'pulse 2s infinite' }}></span>
                  {selectedAsset.status.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleDeleteAsset(selectedAsset.id)} style={{ background: '#fee2e2', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
                  <Trash2 size={16} color="#dc2626" />
                </button>
                <button onClick={() => setSelectedAsset(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {(selectedAsset.water_level !== null || selectedAsset.pressure !== null || selectedAsset.flow_rate !== null) && (
              <div style={{ 
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
                borderRadius: '12px', padding: '16px', marginBottom: '16px',
                border: '1px solid #bae6fd'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#0891b2' }}>LIVE SENSOR READINGS</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {selectedAsset.water_level !== null && selectedAsset.water_level !== undefined && (
                    <div style={{ background: 'white', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Water Level</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{selectedAsset.water_level}%</div>
                    </div>
                  )}
                  {selectedAsset.pressure !== null && selectedAsset.pressure !== undefined && (
                    <div style={{ background: 'white', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Pressure</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{selectedAsset.pressure} PSI</div>
                    </div>
                  )}
                  {selectedAsset.flow_rate !== null && selectedAsset.flow_rate !== undefined && (
                    <div style={{ background: 'white', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Flow Rate</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{selectedAsset.flow_rate} L/m</div>
                    </div>
                  )}
                  {selectedAsset.temperature !== null && selectedAsset.temperature !== undefined && (
                    <div style={{ background: 'white', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Temperature</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{selectedAsset.temperature}°C</div>
                    </div>
                  )}
                  {selectedAsset.quality_index !== null && selectedAsset.quality_index !== undefined && (
                    <div style={{ background: 'white', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Quality Index</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{selectedAsset.quality_index}%</div>
                    </div>
                  )}
                  {selectedAsset.ph !== null && selectedAsset.ph !== undefined && (
                    <div style={{ background: 'white', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>pH Level</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{selectedAsset.ph}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Type</div>
                <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>
                  {selectedAsset.type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
              {selectedAsset.manufacturer && (
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Manufacturer</div>
                  <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{selectedAsset.manufacturer}</div>
                </div>
              )}
              {selectedAsset.serial_number && (
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Serial Number</div>
                  <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500', fontFamily: 'monospace' }}>{selectedAsset.serial_number}</div>
                </div>
              )}
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>GPS Coordinates</div>
                <div style={{ fontSize: '13px', color: '#0f172a', fontFamily: 'monospace' }}>
                  {selectedAsset.latitude?.toFixed(6)}, {selectedAsset.longitude?.toFixed(6)}
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: 'white', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>Add New Node</h2>
                <button onClick={() => setShowAddModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddAsset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Name *</label>
                  <input type="text" required value={newAsset.name} onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })} placeholder="e.g., Kibera Sensor Node 2"
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Type *</label>
                    <select required value={newAsset.type} onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })}
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white', boxSizing: 'border-box' }}>
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
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>County *</label>
                    <select required value={newAsset.county} onChange={(e) => setNewAsset({ ...newAsset, county: e.target.value })}
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white', boxSizing: 'border-box' }}>
                      <option value="">Select County</option>
                      {ALL_COUNTIES.map(county => (
                        <option key={county} value={county}>{county}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Latitude *</label>
                    <input type="number" step="0.00000001" required value={newAsset.latitude} onChange={(e) => setNewAsset({ ...newAsset, latitude: e.target.value })} placeholder="-1.2921"
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Longitude *</label>
                    <input type="number" step="0.00000001" required value={newAsset.longitude} onChange={(e) => setNewAsset({ ...newAsset, longitude: e.target.value })} placeholder="36.8219"
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Capacity (optional)</label>
                  <input type="text" value={newAsset.capacity} onChange={(e) => setNewAsset({ ...newAsset, capacity: e.target.value })} placeholder="e.g., 50M liters"
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowAddModal(false)}
                    style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit"
                    style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Save size={18} /> Add Node
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
