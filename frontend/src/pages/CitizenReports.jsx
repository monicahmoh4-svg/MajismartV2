import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Plus, X, Save, RefreshCw, MapPin, AlertTriangle, Calendar,
  Clock, CheckCircle, Eye, ThumbsUp, MessageCircle, Paperclip, Upload,
  Send, Filter, TrendingUp, Phone, Mail, User, Camera, FileText
} from 'lucide-react'
import api from '../api'

const REPORT_CATEGORIES = [
  { value: 'leak', label: 'Water Leak / Burst', icon: '💧', color: '#3b82f6' },
  { value: 'no_supply', label: 'No Water Supply', icon: '🚫', color: '#ef4444' },
  { value: 'low_pressure', label: 'Low Water Pressure', icon: '📉', color: '#f59e0b' },
  { value: 'water_quality', label: 'Water Quality Issue', icon: '🧪', color: '#8b5cf6' },
  { value: 'illegal_connection', label: 'Illegal Connection', icon: '⚠️', color: '#dc2626' },
  { value: 'meter_issue', label: 'Meter Problem', icon: '📊', color: '#06b6d4' },
  { value: 'billing', label: 'Billing Issue', icon: '💰', color: '#10b981' },
  { value: 'infrastructure_damage', label: 'Infrastructure Damage', icon: '🔨', color: '#f97316' },
  { value: 'service_request', label: 'Service Request', icon: '🛠️', color: '#6366f1' },
  { value: 'other', label: 'Other', icon: '📝', color: '#64748b' }
]

const PRIORITY_COLORS = {
  critical: { bg: '#7f1d1d', text: '#fecaca', label: 'Critical' },
  high: { bg: '#fee2e2', text: '#dc2626', label: 'High' },
  medium: { bg: '#fef3c7', text: '#d97706', label: 'Medium' },
  low: { bg: '#dbeafe', text: '#2563eb', label: 'Low' }
}

const STATUS_COLORS = {
  submitted: { bg: '#e0e7ff', text: '#4338ca', label: 'Submitted', icon: Clock },
  acknowledged: { bg: '#fef3c7', text: '#d97706', label: 'Acknowledged', icon: Eye },
  in_progress: { bg: '#dbeafe', text: '#2563eb', label: 'In Progress', icon: TrendingUp },
  resolved: { bg: '#d1fae5', text: '#059669', label: 'Resolved', icon: CheckCircle },
  closed: { bg: '#f1f5f9', text: '#64748b', label: 'Closed', icon: CheckCircle }
}

const ALL_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho',
  'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
  'Meru', 'Migori', 'Mombasa', 'Muranga', 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu', 'Siaya',
  'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans-Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
]

export default function CitizenReports() {
  const [reports, setReports] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterCounty, setFilterCounty] = useState('')
  const [selectedReport, setSelectedReport] = useState(null)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const [newReport, setNewReport] = useState({
    title: '', description: '', category: 'leak', priority: 'medium',
    reporter_name: '', reporter_email: '', reporter_phone: '',
    latitude: '', longitude: '', address: '', county: '', ward: '',
    is_anonymous: false
  })

  const [commentText, setCommentText] = useState('')

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (filterStatus) params.append('status', filterStatus)
      if (filterCategory) params.append('category', filterCategory)
      if (filterCounty) params.append('county', filterCounty)
      
      const response = await api.get(`/reports-enhanced?${params.toString()}`)
      setReports(response.reports || [])
    } catch (err) {
      console.error('Fetch reports error:', err)
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [searchQuery, filterStatus, filterCategory, filterCounty])

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/reports-enhanced/stats')
      setStats(response)
    } catch (err) {
      console.error('Fetch stats error:', err)
    }
  }, [])

  useEffect(() => {
    fetchReports()
    fetchStats()
  }, [fetchReports, fetchStats])

  const handleSubmitReport = async (e) => {
    e.preventDefault()
    try {
      const response = await api.post('/reports-enhanced', {
        ...newReport,
        latitude: newReport.latitude ? parseFloat(newReport.latitude) : null,
        longitude: newReport.longitude ? parseFloat(newReport.longitude) : null
      })
      alert(`✅ Report submitted successfully!\n\nYour report number is: ${response.report_number}\n\nPlease save this number for tracking.`)
      setShowSubmitModal(false)
      resetForm()
      fetchReports()
      fetchStats()
    } catch (err) {
      alert('Failed to submit report: ' + (err?.error || err?.message || 'Unknown error'))
    }
  }

  const resetForm = () => {
    setNewReport({
      title: '', description: '', category: 'leak', priority: 'medium',
      reporter_name: '', reporter_email: '', reporter_phone: '',
      latitude: '', longitude: '', address: '', county: '', ward: '',
      is_anonymous: false
    })
  }

  const fetchReportDetails = async (id) => {
    try {
      const response = await api.get(`/reports-enhanced/${id}`)
      setSelectedReport(response)
    } catch (err) {
      console.error('Fetch report details error:', err)
    }
  }

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedReport) return
    try {
      await api.post(`/reports-enhanced/${selectedReport.report.id}/comments`, {
        author_name: 'You',
        author_role: 'citizen',
        comment: commentText
      })
      setCommentText('')
      fetchReportDetails(selectedReport.report.id)
    } catch (err) {
      alert('Failed to add comment')
    }
  }

  const handleUpvote = async (id) => {
    try {
      await api.post(`/reports-enhanced/${id}/upvote`)
      fetchReports()
      if (selectedReport?.report?.id === id) fetchReportDetails(id)
    } catch (err) {
      console.error('Upvote error:', err)
    }
  }

  const getCategoryInfo = (category) => REPORT_CATEGORIES.find(c => c.value === category) || REPORT_CATEGORIES[9]
  const getStatusInfo = (status) => STATUS_COLORS[status] || STATUS_COLORS.submitted
  const getPriorityInfo = (priority) => PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium

  const currentReport = selectedReport?.report
  const reportComments = selectedReport?.comments || []

  const filteredReports = reports.filter(r => {
    if (activeTab === 'all') return true
    if (activeTab === 'open') return ['submitted', 'acknowledged', 'in_progress'].includes(r.status)
    if (activeTab === 'resolved') return ['resolved', 'closed'].includes(r.status)
    if (activeTab === 'high_priority') return ['critical', 'high'].includes(r.priority)
    return true
  })

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', background: '#f8fafc', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
              Citizen Reports
            </h1>
            <p style={{ margin: 0, fontSize: '15px', color: '#64748b' }}>
              Report water issues and track their resolution in real-time
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { fetchReports(); fetchStats(); }}
              style={{ padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={() => setShowSubmitModal(true)}
              style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #dc2626, #ef4444)', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '700', color: 'white', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)' }}>
              <Plus size={14} /> Submit Report
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <StatCard icon={FileText} title="Total Reports" value={stats.total_reports || 0} color="#0891b2" />
            <StatCard icon={Clock} title="Pending" value={(stats.submitted || 0) + (stats.acknowledged || 0)} color="#f59e0b" />
            <StatCard icon={TrendingUp} title="In Progress" value={stats.in_progress || 0} color="#3b82f6" />
            <StatCard icon={CheckCircle} title="Resolved" value={stats.resolved || 0} color="#10b981" />
            <StatCard icon={AlertTriangle} title="High Priority" value={stats.high_priority || 0} color="#ef4444" />
            <StatCard icon={Clock} title="Last 24h" value={stats.last_24h || 0} color="#8b5cf6" />
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'white', padding: '4px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', width: 'fit-content' }}>
          {[
            { id: 'all', label: 'All Reports' },
            { id: 'open', label: 'Open' },
            { id: 'resolved', label: 'Resolved' },
            { id: 'high_priority', label: 'High Priority' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: '8px 16px', background: activeTab === tab.id ? 'linear-gradient(135deg, #0891b2, #06b6d4)' : 'transparent', color: activeTab === tab.id ? 'white' : '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
            <input type="text" placeholder="Search reports..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectStyle}>
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={selectStyle}>
            <option value="">All Categories</option>
            {REPORT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          <select value={filterCounty} onChange={(e) => setFilterCounty(e.target.value)} style={selectStyle}>
            <option value="">All Counties</option>
            {ALL_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Reports List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: '12px' }}>
              <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #0891b2', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
              <p style={{ color: '#64748b' }}>Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: '12px' }}>
              <FileText style={{ width: '48px', height: '48px', color: '#cbd5e1', margin: '0 auto 16px' }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#0f172a' }}>No reports found</h3>
              <p style={{ margin: 0, color: '#64748b' }}>Try adjusting your filters or submit a new report</p>
            </div>
          ) : (
            filteredReports.map((report) => {
              const catInfo = getCategoryInfo(report.category)
              const statusInfo = getStatusInfo(report.status)
              const priorityInfo = getPriorityInfo(report.priority)
              const StatusIcon = statusInfo.icon
              const submittedDate = new Date(report.submitted_at)
              const hoursAgo = Math.floor((Date.now() - submittedDate.getTime()) / (1000 * 60 * 60))
              const timeAgo = hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo / 24)}d ago`

              return (
                <motion.div key={report.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => fetchReportDetails(report.id)}
                  style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer', borderLeft: `4px solid ${catInfo.color}`, transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '20px' }}>{catInfo.icon}</span>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', fontFamily: 'monospace' }}>{report.report_number}</span>
                        <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '700', background: priorityInfo.bg, color: priorityInfo.text }}>
                          {priorityInfo.label}
                        </span>
                        <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '700', background: statusInfo.bg, color: statusInfo.text, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <StatusIcon size={10} /> {statusInfo.label}
                        </span>
                      </div>
                      <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{report.title}</h3>
                      <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                        {report.description.length > 150 ? report.description.substring(0, 150) + '...' : report.description}
                      </p>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#94a3b8', flexWrap: 'wrap' }}>
                        {report.county && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} /> {report.county}{report.ward ? `, ${report.ward}` : ''}
                          </span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {timeAgo}
                        </span>
                        {report.reporter_name && !report.is_anonymous && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={12} /> {report.reporter_name}
                          </span>
                        )}
                        {report.assigned_to && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0891b2' }}>
                            👷 {report.assigned_to}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <button onClick={(e) => { e.stopPropagation(); handleUpvote(report.id); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                        <ThumbsUp size={12} /> {report.upvotes || 0}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>

      {/* Report Detail Panel */}
      <AnimatePresence>
        {selectedReport && currentReport && (
          <motion.div initial={{ x: 500 }} animate={{ x: 0 }} exit={{ x: 500 }} transition={{ type: 'spring', damping: 25 }}
            style={{ position: 'fixed', top: '70px', right: 0, width: '500px', height: 'calc(100vh - 70px)', background: 'white', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
            
            {/* Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: `linear-gradient(135deg, ${getCategoryInfo(currentReport.category).color}, ${getCategoryInfo(currentReport.category).color}dd)`, color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'monospace', background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '6px' }}>
                      {currentReport.report_number}
                    </span>
                  </div>
                  <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '800' }}>{currentReport.title}</h2>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.25)', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                      {getCategoryInfo(currentReport.category).label}
                    </span>
                    <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.25)', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                      {getPriorityInfo(currentReport.priority).label} Priority
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedReport(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'white' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {/* Status Badge */}
              <div style={{ background: getStatusInfo(currentReport.status).bg, padding: '12px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {(() => { const Icon = getStatusInfo(currentReport.status).icon; return <Icon size={20} color={getStatusInfo(currentReport.status).text} />; })()}
                <div>
                  <div style={{ fontSize: '11px', color: getStatusInfo(currentReport.status).text, fontWeight: '600' }}>Current Status</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: getStatusInfo(currentReport.status).text }}>{getStatusInfo(currentReport.status).label}</div>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Description</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#0f172a', lineHeight: '1.6', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  {currentReport.description}
                </p>
              </div>

              {/* Location */}
              {currentReport.latitude && currentReport.longitude && (
                <InfoRow icon={MapPin} label="Location" value={`${Number(currentReport.latitude).toFixed(6)}, ${Number(currentReport.longitude).toFixed(6)}`} />
              )}
              {currentReport.county && <InfoRow icon={MapPin} label="County / Ward" value={`${currentReport.county}${currentReport.ward ? `, ${currentReport.ward}` : ''}`} />}
              {currentReport.address && <InfoRow icon={MapPin} label="Address" value={currentReport.address} />}

              {/* Reporter */}
              <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Reporter Information</h4>
                {currentReport.is_anonymous ? (
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>Anonymous Report</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                    {currentReport.reporter_name && <span><User size={12} style={{ display: 'inline' }} /> {currentReport.reporter_name}</span>}
                    {currentReport.reporter_email && <span><Mail size={12} style={{ display: 'inline' }} /> {currentReport.reporter_email}</span>}
                    {currentReport.reporter_phone && <span><Phone size={12} style={{ display: 'inline' }} /> {currentReport.reporter_phone}</span>}
                  </div>
                )}
              </div>

              {/* Assignment */}
              {currentReport.assigned_to && (
                <div style={{ marginTop: '16px', padding: '12px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: '600', marginBottom: '4px' }}>Assigned To</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e3a8a' }}>👷 {currentReport.assigned_to}</div>
                  {currentReport.assigned_at && (
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      Assigned on {new Date(currentReport.assigned_at).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {/* Resolution */}
              {currentReport.resolution_notes && (
                <div style={{ marginTop: '16px', padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '11px', color: '#166534', fontWeight: '600', marginBottom: '4px' }}>Resolution Notes</div>
                  <div style={{ fontSize: '13px', color: '#14532d', lineHeight: '1.5' }}>{currentReport.resolution_notes}</div>
                  {currentReport.resolved_at && (
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                      Resolved on {new Date(currentReport.resolved_at).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {/* Timeline */}
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Timeline</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                  <div>📤 Submitted: {new Date(currentReport.submitted_at).toLocaleString()}</div>
                  {currentReport.acknowledged_at && <div>👁️ Acknowledged: {new Date(currentReport.acknowledged_at).toLocaleString()}</div>}
                  {currentReport.assigned_at && <div>👷 Assigned: {new Date(currentReport.assigned_at).toLocaleString()}</div>}
                  {currentReport.resolved_at && <div>✅ Resolved: {new Date(currentReport.resolved_at).toLocaleString()}</div>}
                  {currentReport.closed_at && <div>🔒 Closed: {new Date(currentReport.closed_at).toLocaleString()}</div>}
                </div>
              </div>

              {/* Comments */}
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageCircle size={14} /> Updates ({reportComments.length})
                </h4>
                {reportComments.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {reportComments.map((c) => (
                      <div key={c.id} style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #0891b2' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '12px', color: '#0f172a' }}>{c.author_name}</strong>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>{new Date(c.created_at).toLocaleString()}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>{c.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', marginBottom: '12px' }}>No updates yet</p>
                )}

                {/* Add Comment */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" placeholder="Add an update..." value={commentText} onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }} />
                  <button onClick={handleAddComment} disabled={!commentText.trim()}
                    style={{ padding: '10px 14px', background: '#0891b2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', opacity: commentText.trim() ? 1 : 0.5 }}>
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Report Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}
            onClick={() => setShowSubmitModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: 'white', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>Submit a Report</h2>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Help us improve water services in your area</p>
                </div>
                <button onClick={() => setShowSubmitModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Category Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#475569' }}>Issue Category *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                    {REPORT_CATEGORIES.map(cat => (
                      <button key={cat.value} type="button" onClick={() => setNewReport({ ...newReport, category: cat.value })}
                        style={{ padding: '10px', background: newReport.category === cat.value ? cat.color : '#f8fafc', color: newReport.category === cat.value ? 'white' : '#475569', border: newReport.category === cat.value ? `2px solid ${cat.color}` : '2px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                        <span style={{ fontSize: '16px' }}>{cat.icon}</span> {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <FormField label="Title *" required>
                  <input type="text" required value={newReport.title} onChange={(e) => setNewReport({ ...newReport, title: e.target.value })} placeholder="Brief description of the issue" style={inputStyle} />
                </FormField>

                <FormField label="Detailed Description *" required>
                  <textarea required value={newReport.description} onChange={(e) => setNewReport({ ...newReport, description: e.target.value })} placeholder="Please describe the issue in detail. Include any relevant information like when it started, how it's affecting you, etc." rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                </FormField>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <FormField label="Priority">
                    <select value={newReport.priority} onChange={(e) => setNewReport({ ...newReport, priority: e.target.value })} style={inputStyle}>
                      <option value="low">Low - Can wait</option>
                      <option value="medium">Medium - Needs attention</option>
                      <option value="high">High - Urgent</option>
                      <option value="critical">Critical - Emergency</option>
                    </select>
                  </FormField>
                  <FormField label="County">
                    <select value={newReport.county} onChange={(e) => setNewReport({ ...newReport, county: e.target.value })} style={inputStyle}>
                      <option value="">Select County</option>
                      {ALL_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </FormField>
                </div>

                <FormField label="Ward / Area">
                  <input type="text" value={newReport.ward} onChange={(e) => setNewReport({ ...newReport, ward: e.target.value })} placeholder="e.g., Kibera, Westlands" style={inputStyle} />
                </FormField>

                <FormField label="Specific Address / Landmark">
                  <input type="text" value={newReport.address} onChange={(e) => setNewReport({ ...newReport, address: e.target.value })} placeholder="e.g., Near Kibera Market, Opposite St. Mary's School" style={inputStyle} />
                </FormField>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <FormField label="Latitude (optional)">
                    <input type="number" step="any" value={newReport.latitude} onChange={(e) => setNewReport({ ...newReport, latitude: e.target.value })} placeholder="-1.2921" style={inputStyle} />
                  </FormField>
                  <FormField label="Longitude (optional)">
                    <input type="number" step="any" value={newReport.longitude} onChange={(e) => setNewReport({ ...newReport, longitude: e.target.value })} placeholder="36.8219" style={inputStyle} />
                  </FormField>
                </div>

                {/* Reporter Info */}
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <input type="checkbox" checked={newReport.is_anonymous} onChange={(e) => setNewReport({ ...newReport, is_anonymous: e.target.checked })} style={{ accentColor: '#0891b2' }} />
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Submit anonymously</label>
                  </div>
                  {!newReport.is_anonymous && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <input type="text" value={newReport.reporter_name} onChange={(e) => setNewReport({ ...newReport, reporter_name: e.target.value })} placeholder="Your name" style={inputStyle} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <input type="email" value={newReport.reporter_email} onChange={(e) => setNewReport({ ...newReport, reporter_email: e.target.value })} placeholder="Email (optional)" style={inputStyle} />
                        <input type="tel" value={newReport.reporter_phone} onChange={(e) => setNewReport({ ...newReport, reporter_phone: e.target.value })} placeholder="Phone (optional)" style={inputStyle} />
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowSubmitModal(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Send size={16} /> Submit Report
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

// ============================================
// REUSABLE COMPONENTS
// ============================================

function StatCard({ icon: Icon, title, value, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'white', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
        <div style={{ width: '36px', height: '36px', background: `${color}15`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} />
        </div>
      </div>
      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '3px' }}>{title}</div>
      <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{value}</div>
    </motion.div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', background: '#f8fafc', borderRadius: '6px', marginBottom: '6px' }}>
      <Icon size={14} color="#0891b2" />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>{label}</div>
        <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '500' }}>{value}</div>
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

const selectStyle = { padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white', cursor: 'pointer', minWidth: '140px' }
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }
