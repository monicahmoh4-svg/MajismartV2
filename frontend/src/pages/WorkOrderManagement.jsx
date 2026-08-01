import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wrench, Plus, Search, Filter, X, CheckCircle, Clock, 
  AlertTriangle, User, FileText, ChevronDown, RefreshCw
} from 'lucide-react'
import api from '../api'

const STATUS_COLORS = {
  pending: { bg: '#fef3c7', text: '#d97706', label: 'Pending' },
  assigned: { bg: '#dbeafe', text: '#2563eb', label: 'Assigned' },
  in_progress: { bg: '#e0e7ff', text: '#4338ca', label: 'In Progress' },
  completed: { bg: '#d1fae5', text: '#059669', label: 'Completed' },
  verified: { bg: '#f1f5f9', text: '#64748b', label: 'Verified' }
}

const PRIORITY_COLORS = {
  urgent: { bg: '#fee2e2', text: '#dc2626', label: 'Urgent' },
  high: { bg: '#ffedd5', text: '#ea580c', label: 'High' },
  medium: { bg: '#fef9c3', text: '#ca8a04', label: 'Medium' },
  low: { bg: '#f1f5f9', text: '#64748b', label: 'Low' }
}

export default function WorkOrderManagement() {
  const [workOrders, setWorkOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedWO, setSelectedWO] = useState(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)

  const [newWO, setNewWO] = useState({ title: '', description: '', priority: 'medium', location: '', assigned_to: '', created_by: 'System' })
  const [updateForm, setUpdateForm] = useState({ status: '', assigned_to: '', completion_notes: '' })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (filterStatus) params.append('status', filterStatus)
      if (filterPriority) params.append('priority', filterPriority)
      
      const [woRes, statsRes] = await Promise.all([
        api.get(`/workorders?${params.toString()}`),
        api.get('/workorders/stats')
      ])
      setWorkOrders(woRes.work_orders || [])
      setStats(statsRes)
    } catch (err) {
      console.error('Fetch work orders error:', err)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, filterStatus, filterPriority])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreateWO = async (e) => {
    e.preventDefault()
    try {
      await api.post('/workorders', newWO)
      setShowCreateModal(false)
      setNewWO({ title: '', description: '', priority: 'medium', location: '', assigned_to: '', created_by: 'System' })
      fetchData()
    } catch (err) {
      alert('Failed to create work order: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleUpdateWO = async (e) => {
    e.preventDefault()
    if (!selectedWO) return
    try {
      await api.put(`/workorders/${selectedWO.id}`, updateForm)
      setShowUpdateModal(false)
      setSelectedWO(null)
      setUpdateForm({ status: '', assigned_to: '', completion_notes: '' })
      fetchData()
    } catch (err) {
      alert('Failed to update work order: ' + (err.response?.data?.message || err.message))
    }
  }

  const openUpdateModal = (wo) => {
    setSelectedWO(wo)
    setUpdateForm({ status: wo.status, assigned_to: wo.assigned_to || '', completion_notes: wo.completion_notes || '' })
    setShowUpdateModal(true)
  }

  const getStatusBadge = (status) => {
    const s = STATUS_COLORS[status] || STATUS_COLORS.pending
    return <span style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', background: s.bg, color: s.text }}>{s.label}</span>
  }

  const getPriorityBadge = (priority) => {
    const p = PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium
    return <span style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', background: p.bg, color: p.text }}>{p.label}</span>
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', background: '#f8fafc', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Wrench size={32} color="#f59e0b" /> Work Order Dispatch
            </h1>
            <p style={{ margin: 0, fontSize: '15px', color: '#64748b' }}>Manage, assign, and track field operations and maintenance tasks.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={fetchData} style={{ padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={() => setShowCreateModal(true)} style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '700', color: 'white', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' }}>
              <Plus size={14} /> Create Work Order
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <StatCard icon={FileText} title="Total Orders" value={stats.total || 0} color="#0891b2" />
            <StatCard icon={Clock} title="Pending" value={stats.pending || 0} color="#f59e0b" />
            <StatCard icon={User} title="In Progress" value={stats.in_progress || 0} color="#3b82f6" />
            <StatCard icon={CheckCircle} title="Completed" value={stats.completed || 0} color="#10b981" />
            <StatCard icon={AlertTriangle} title="High/Urgent" value={stats.high_priority || 0} color="#ef4444" />
          </div>
        )}

        {/* Filters */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
            <input type="text" placeholder="Search by title, ID, or location..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectStyle}>
            <option value="">All Statuses</option>
            {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{STATUS_COLORS[s].label}</option>)}
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={selectStyle}>
            <option value="">All Priorities</option>
            {Object.keys(PRIORITY_COLORS).map(p => <option key={p} value={p}>{PRIORITY_COLORS[p].label}</option>)}
          </select>
        </div>

        {/* List */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #f59e0b', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
              <p style={{ color: '#64748b' }}>Loading work orders...</p>
            </div>
          ) : workOrders.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <Wrench style={{ width: '48px', height: '48px', color: '#cbd5e1', margin: '0 auto 16px' }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#0f172a' }}>No work orders found</h3>
              <p style={{ margin: 0, color: '#64748b' }}>Try adjusting your filters or create a new work order.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['WO Number', 'Title', 'Location', 'Assigned To', 'Priority', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workOrders.map((wo) => (
                    <tr key={wo.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '13px', color: '#0891b2', fontWeight: '600' }}>{wo.wo_number}</td>
                      <td style={{ padding: '14px 16px', fontWeight: '600', color: '#0f172a' }}>{wo.title}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>{wo.location || '-'}</td>
                      <td style={{ padding: '14px 16px', color: '#475569' }}>{wo.assigned_to || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Unassigned</span>}</td>
                      <td style={{ padding: '14px 16px' }}>{getPriorityBadge(wo.priority)}</td>
                      <td style={{ padding: '14px 16px' }}>{getStatusBadge(wo.status)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <button onClick={() => openUpdateModal(wo)} style={{ padding: '6px 12px', background: '#eff6ff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', color: '#0891b2' }}>
                          <ChevronDown size={14} /> Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <ModalOverlay onClose={() => setShowCreateModal(false)}>
            <ModalContent title="Create New Work Order" onClose={() => setShowCreateModal(false)}>
              <form onSubmit={handleCreateWO} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <FormField label="Title *" required>
                  <input type="text" required value={newWO.title} onChange={(e) => setNewWO({...newWO, title: e.target.value})} placeholder="e.g., Repair burst pipe" style={inputStyle} />
                </FormField>
                <FormField label="Description *" required>
                  <textarea required value={newWO.description} onChange={(e) => setNewWO({...newWO, description: e.target.value})} rows={3} placeholder="Detailed description of the task" style={{...inputStyle, resize: 'vertical'}} />
                </FormField>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <FormField label="Priority">
                    <select value={newWO.priority} onChange={(e) => setNewWO({...newWO, priority: e.target.value})} style={inputStyle}>
                      {Object.keys(PRIORITY_COLORS).map(p => <option key={p} value={p}>{PRIORITY_COLORS[p].label}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Location">
                    <input type="text" value={newWO.location} onChange={(e) => setNewWO({...newWO, location: e.target.value})} placeholder="e.g., Westlands, Nairobi" style={inputStyle} />
                  </FormField>
                </div>
                <FormField label="Assign To (Optional)">
                  <input type="text" value={newWO.assigned_to} onChange={(e) => setNewWO({...newWO, assigned_to: e.target.value})} placeholder="e.g., John Kamau (Team A)" style={inputStyle} />
                </FormField>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Create Order</button>
                </div>
              </form>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Update Modal */}
      <AnimatePresence>
        {showUpdateModal && selectedWO && (
          <ModalOverlay onClose={() => { setShowUpdateModal(false); setSelectedWO(null); }}>
            <ModalContent title={`Manage: ${selectedWO.wo_number}`} onClose={() => { setShowUpdateModal(false); setSelectedWO(null); }}>
              <form onSubmit={handleUpdateWO} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{selectedWO.title}</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Current Status: {getStatusBadge(selectedWO.status)} | Priority: {getPriorityBadge(selectedWO.priority)}</p>
                </div>
                <FormField label="Update Status">
                  <select value={updateForm.status} onChange={(e) => setUpdateForm({...updateForm, status: e.target.value})} style={inputStyle}>
                    {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{STATUS_COLORS[s].label}</option>)}
                  </select>
                </FormField>
                <FormField label="Assign To">
                  <input type="text" value={updateForm.assigned_to} onChange={(e) => setUpdateForm({...updateForm, assigned_to: e.target.value})} placeholder="Technician or Team Name" style={inputStyle} />
                </FormField>
                {(updateForm.status === 'completed' || updateForm.status === 'verified') && (
                  <FormField label="Completion Notes">
                    <textarea value={updateForm.completion_notes} onChange={(e) => setUpdateForm({...updateForm, completion_notes: e.target.value})} rows={3} placeholder="Describe the work done and resolution..." style={{...inputStyle, resize: 'vertical'}} />
                  </FormField>
                )}
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => { setShowUpdateModal(false); setSelectedWO(null); }} style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Save Changes</button>
                </div>
              </form>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  )
}

// Sub-components
function StatCard({ icon: Icon, title, value, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
      <div style={{ width: '40px', height: '40px', background: `${color}15`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{value}</div>
    </motion.div>
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
        <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}><X size={18} /></button>
      </div>
      {children}
    </motion.div>
  )
}

const selectStyle = { padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white', cursor: 'pointer', minWidth: '140px' }
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }
