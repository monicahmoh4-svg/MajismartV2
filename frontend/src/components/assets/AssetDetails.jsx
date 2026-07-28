import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Wrench, ClipboardCheck, Paperclip, Plus, Package, MapPin, Calendar, DollarSign, User } from 'lucide-react'
import api from '../../api'
import MaintenanceForm from './MaintenanceForm'

export default function AssetDetails({ asset, onClose, onUpdate }) {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false)
  const [showInspectionForm, setShowInspectionForm] = useState(false)

  useEffect(() => {
    fetchDetails()
  }, [asset.id])

  const fetchDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/assets/${asset.id}`)
      setDetails(response)
    } catch (err) {
      console.error('Asset details error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMaintenanceLogged = () => {
    setShowMaintenanceForm(false)
    fetchDetails()
    if (onUpdate) onUpdate()
  }

  const handleInspectionLogged = async (data) => {
    try {
      await api.post(`/assets/${asset.id}/inspection`, data)
      setShowInspectionForm(false)
      fetchDetails()
      if (onUpdate) onUpdate()
    } catch (err) {
      alert('Failed to log inspection')
    }
  }

  const currentAsset = details?.asset || asset

  const getConditionColor = (condition) => {
    const colors = {
      good: { bg: '#d1fae5', text: '#059669' },
      fair: { bg: '#dbeafe', text: '#2563eb' },
      poor: { bg: '#fef3c7', text: '#d97706' },
      critical: { bg: '#fee2e2', text: '#dc2626' }
    }
    return colors[condition] || colors.good
  }

  return (
    <motion.div initial={{ x: 500 }} animate={{ x: 0 }} exit={{ x: 500 }} transition={{ type: 'spring', damping: 25 }}
      style={{ position: 'fixed', top: '70px', right: 0, width: '480px', height: 'calc(100vh - 70px)', background: 'white', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '800' }}>{currentAsset.name}</h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.25)', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                {(currentAsset.type || '').replace(/_/g, ' ').toUpperCase()}
              </span>
              {currentAsset.condition && (
                <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.25)', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                  {currentAsset.condition.toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'white' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ fontSize: '13px', opacity: 0.95, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {currentAsset.county && <span>📍 {currentAsset.county}</span>}
          {currentAsset.serial_number && <span>🔖 {currentAsset.serial_number}</span>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
        {[
          { id: 'overview', label: 'Overview', icon: Package },
          { id: 'maintenance', label: 'Maintenance', icon: Wrench },
          { id: 'inspections', label: 'Inspections', icon: ClipboardCheck },
          { id: 'attachments', label: 'Files', icon: Paperclip }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flex: 1, padding: '12px', background: activeTab === tab.id ? 'white' : 'transparent', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #0891b2' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: activeTab === tab.id ? '#0891b2' : '#64748b' }}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ width: '30px', height: '30px', border: '3px solid #e2e8f0', borderTop: '3px solid #0891b2', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <InfoRow icon={MapPin} label="GPS Coordinates" value={currentAsset.latitude && currentAsset.longitude ? `${Number(currentAsset.latitude).toFixed(6)}, ${Number(currentAsset.longitude).toFixed(6)}` : 'Not set'} />
                <InfoRow icon={Package} label="Manufacturer" value={currentAsset.manufacturer || 'Not specified'} />
                <InfoRow icon={Package} label="Capacity" value={currentAsset.capacity || 'N/A'} />
                <InfoRow icon={Package} label="Material" value={currentAsset.material || 'N/A'} />
                {currentAsset.diameter_mm && <InfoRow icon={Package} label="Diameter" value={`${currentAsset.diameter_mm}mm`} />}
                <InfoRow icon={Calendar} label="Expected Lifespan" value={currentAsset.expected_lifespan_years ? `${currentAsset.expected_lifespan_years} years` : 'Not specified'} />
                <InfoRow icon={Calendar} label="Last Maintenance" value={currentAsset.last_maintenance_date ? new Date(currentAsset.last_maintenance_date).toLocaleDateString() : 'Never'} />
                <InfoRow icon={Calendar} label="Next Inspection" value={currentAsset.next_inspection_date ? new Date(currentAsset.next_inspection_date).toLocaleDateString() : 'Not scheduled'} />
                {currentAsset.notes && (
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#475569' }}>
                    <strong>Notes:</strong> {currentAsset.notes}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div>
                <button onClick={() => setShowMaintenanceForm(true)}
                  style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '16px' }}>
                  <Plus size={16} /> Log Maintenance
                </button>
                {details?.maintenance?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {details.maintenance.map((m) => (
                      <div key={m.id} style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                            {m.maintenance_type.replace(/\b\w/g, l => l.toUpperCase())}
                          </strong>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {new Date(m.performed_at).toLocaleDateString()}
                          </span>
                        </div>
                        {m.description && <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#475569' }}>{m.description}</p>}
                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#64748b', flexWrap: 'wrap' }}>
                          {m.performed_by && <span><User size={12} style={{ display: 'inline' }} /> {m.performed_by}</span>}
                          {m.cost_ksh && <span><DollarSign size={12} style={{ display: 'inline' }} /> KES {Number(m.cost_ksh).toLocaleString()}</span>}
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
                <InspectionForm assetId={asset.id} onSubmit={handleInspectionLogged} show={showInspectionForm} onClose={() => setShowInspectionForm(false)} />
                {!showInspectionForm && (
                  <button onClick={() => setShowInspectionForm(true)}
                    style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '16px' }}>
                    <Plus size={16} /> Log Inspection
                  </button>
                )}
                {details?.inspections?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {details.inspections.map((i) => (
                      <div key={i.id} style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                            {i.condition_rating ? i.condition_rating.toUpperCase() : 'Inspection'}
                          </strong>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {new Date(i.inspected_at).toLocaleDateString()}
                          </span>
                        </div>
                        {i.inspector_name && <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#64748b' }}><User size={12} style={{ display: 'inline' }} /> {i.inspector_name}</p>}
                        {i.findings && <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#475569' }}>{i.findings}</p>}
                        {i.recommendations && <p style={{ margin: 0, fontSize: '12px', color: '#0891b2', fontStyle: 'italic' }}>💡 {i.recommendations}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  !showInspectionForm && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      <ClipboardCheck style={{ width: '40px', height: '40px', color: '#cbd5e1', margin: '0 auto 12px' }} />
                      <p>No inspections recorded yet</p>
                    </div>
                  )
                )}
              </div>
            )}

            {activeTab === 'attachments' && (
              <div>
                <AttachmentUpload assetId={asset.id} onUpload={() => fetchDetails()} />
                {details?.attachments?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                    {details.attachments.map((a) => (
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
          </>
        )}
      </div>

      {/* Maintenance Form Modal */}
      {showMaintenanceForm && (
        <MaintenanceForm assetId={asset.id} onSuccess={handleMaintenanceLogged} onClose={() => setShowMaintenanceForm(false)} />
      )}
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

function InspectionForm({ assetId, onSubmit, show, onClose }) {
  const [form, setForm] = useState({
    inspector_name: '', condition_rating: 'good', findings: '', recommendations: '', next_inspection_date: ''
  })

  if (!show) return null

  return (
    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
      <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '700' }}>Log Inspection</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input type="text" placeholder="Inspector Name" value={form.inspector_name} onChange={(e) => setForm({ ...form, inspector_name: e.target.value })}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
        <select value={form.condition_rating} onChange={(e) => setForm({ ...form, condition_rating: e.target.value })}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', background: 'white' }}>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="poor">Poor</option>
          <option value="critical">Critical</option>
        </select>
        <textarea placeholder="Findings..." value={form.findings} onChange={(e) => setForm({ ...form, findings: e.target.value })} rows={2}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', resize: 'vertical' }} />
        <textarea placeholder="Recommendations..." value={form.recommendations} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} rows={2}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', resize: 'vertical' }} />
        <input type="date" value={form.next_inspection_date} onChange={(e) => setForm({ ...form, next_inspection_date: e.target.value })}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '8px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
          <button onClick={() => onSubmit(form)} style={{ flex: 2, padding: '8px', background: '#0891b2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>Save</button>
        </div>
      </div>
    </div>
  )
}

function AttachmentUpload({ assetId, onUpload }) {
  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Max 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        await api.post(`/assets/${assetId}/attachments`, {
          filename: file.name,
          file_type: file.type,
          file_data: reader.result
        })
        onUpload()
      } catch (err) {
        alert('Upload failed')
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <label style={{ display: 'block', padding: '20px', border: '2px dashed #cbd5e1', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}>
      <Paperclip size={24} color="#94a3b8" style={{ margin: '0 auto 8px', display: 'block' }} />
      <div style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Click to upload file</div>
      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Max 5MB</div>
      <input type="file" onChange={handleFile} style={{ display: 'none' }} />
    </label>
  )
}
