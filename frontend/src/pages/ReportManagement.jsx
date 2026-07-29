import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, X, RefreshCw, MapPin, AlertTriangle, Clock, CheckCircle,
  Eye, ThumbsUp, MessageCircle, TrendingUp, User, Filter,
  BarChart3, PieChart, Activity, FileText, Users, Wrench
} from 'lucide-react'
import api from '../api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, Legend } from 'recharts'

const STATUS_COLORS = {
  submitted: { bg: '#e0e7ff', text: '#4338ca', label: 'Submitted' },
  acknowledged: { bg: '#fef3c7', text: '#d97706', label: 'Acknowledged' },
  in_progress: { bg: '#dbeafe', text: '#2563eb', label: 'In Progress' },
  resolved: { bg: '#d1fae5', text: '#059669', label: 'Resolved' },
  closed: { bg: '#f1f5f9', text: '#64748b', label: 'Closed' }
}

const PRIORITY_COLORS = {
  critical: { bg: '#7f1d1d', text: '#fecaca' },
  high: { bg: '#fee2e2', text: '#dc2626' },
  medium: { bg: '#fef3c7', text: '#d97706' },
  low: { bg: '#dbeafe', text: '#2563eb' }
}

const CHART_COLORS = ['#0891b2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#6366f1']

export default function ReportManagement() {
  const [reports, setReports] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterCounty, setFilterCounty] = useState('')
  const [selectedReport, setSelectedReport] = useState(null)
  const [activeView, setActiveView] = useState('list')

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

  const fetchReportDetails = async (id) => {
    try {
      const response = await api.get(`/reports-enhanced/${id}`)
      setSelectedReport(response)
    } catch (err) {
      console.error('Fetch report details error:', err)
    }
  }

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.put(`/reports-enhanced/${id}`, { status: newStatus })
      fetchReports()
      fetchStats()
      if (selectedReport?.report?.id === id) fetchReportDetails(id)
    } catch (err) {
      alert('Failed to update status')
    }
  }

  const handleAssignment = async (id, assignedTo) => {
    if (!assignedTo.trim()) return
    try {
      await api.put(`/reports-enhanced/${id}`, { 
        assigned_to: assignedTo,
        status: 'in_progress'
      })
      fetchReports()
      if (selectedReport?.report?.id === id) fetchReportDetails(id)
    } catch (err) {
      alert('Failed to assign report')
    }
  }

  const getStatusInfo = (status) => STATUS_COLORS[status] || STATUS_COLORS.submitted
  const getPriorityInfo = (priority) => PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium

  const currentReport = selectedReport?.report
  const reportComments = selectedReport?.comments || []

  // Prepare chart data
  const statusChartData = stats?.by_status?.map(s => ({ name: s.status.replace('_', ' '), value: parseInt(s.count) })) || []
  const categoryChartData = stats?.by_category?.slice(0, 8).map(c => ({ name: c.category.replace('_', ' '), value: parseInt(c.count) })) || []
  const countyChartData = stats?.by_county?.slice(0, 10).map(c => ({ name: c.county, count: parseInt(c.count) })) || []

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', background: '#f8fafc', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
              Report Management Dashboard
            </h1>
            <p style={{ margin: 0, fontSize: '15px', color: '#64748b' }}>
              Manage and resolve citizen reports efficiently
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ display: 'flex', background: 'white', padding: '4px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <button onClick={() => setActiveView('list')}
                style={{ padding: '8px 14px', background: activeView === 'list' ? '#0891b2' : 'transparent', color: activeView === 'list' ? 'white' : '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                📋 List
              </button>
              <button onClick={() => setActiveView('analytics')}
                style={{ padding: '8px 14px', background: activeView === 'analytics' ? '#0891b2' : 'transparent', color: activeView === 'analytics' ? 'white' : '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                📊 Analytics
              </button>
            </div>
            <button onClick={() => { fetchReports(); fetchStats(); }}
              style={{ padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <StatCard icon={FileText} title="Total Reports" value={stats.total_reports || 0} color="#0891b2" />
            <StatCard icon={Clock} title="Pending" value={(stats.submitted || 0)} color="#f59e0b" />
            <StatCard icon={TrendingUp} title="In Progress" value={stats.in_progress || 0} color="#3b82f6" />
            <StatCard icon={CheckCircle} title="Resolved" value={stats.resolved || 0} color="#10b981" />
            <StatCard icon={AlertTriangle} title="High Priority" value={stats.high_priority || 0} color="#ef4444" />
            <StatCard icon={Activity} title="Avg. Resolution" value={stats.avg_resolution_hours ? `${Math.round(stats.avg_resolution_hours)}h` : 'N/A'} color="#8b5cf6" />
          </div>
        )}

        {activeView === 'analytics' && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            {/* Status Distribution */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChart size={18} color="#0891b2" /> Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <RPieChart>
                  <Pie data={statusChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RPieChart>
              </ResponsiveContainer>
            </div>

            {/* Category Distribution */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} color="#0891b2" /> Reports by Category
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0891b2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* County Distribution */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', gridColumn: '1 / -1' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} color="#0891b2" /> Top Counties by Report Volume
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={countyChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

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

          <select value={filterCounty} onChange={(e) => setFilterCounty(e.target.value)} style={selectStyle}>
            <option value="">All Counties</option>
            {[...new Set(reports.map(r => r.county).filter(Boolean))].sort().map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Reports List */}
        {activeView === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: '12px' }}>
                <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #0891b2', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
              </div>
            ) : reports.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: '12px' }}>
                <FileText style={{ width: '48px', height: '48px', color: '#cbd5e1', margin: '0 auto 16px' }} />
                <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#0f172a' }}>No reports found</h3>
              </div>
            ) : (
              reports.map((report) => {
                const statusInfo = getStatusInfo(report.status)
                const priorityInfo = getPriorityInfo(report.priority)
                return (
                  <motion.div key={report.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    onClick={() => fetchReportDetails(report.id)}
                    style={{ background: 'white', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'all 0.2s', borderLeft: `4px solid ${priorityInfo.text}` }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '250px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', fontFamily: 'monospace' }}>{report.report_number}</span>
                          <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '700', background: priorityInfo.bg, color: priorityInfo.text }}>
                            {report.priority?.toUpperCase()}
                          </span>
                          <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '700', background: statusInfo.bg, color: statusInfo.text }}>
                            {statusInfo.label}
                          </span>
                          {report.upvotes > 0 && (
                            <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <ThumbsUp size={11} /> {report.upvotes}
                            </span>
                          )}
                        </div>
                        <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{report.title}</h3>
                        <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#64748b' }}>
                          {report.description.length > 120 ? report.description.substring(0, 120) + '...' : report.description}
                        </p>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#94a3b8', flexWrap: 'wrap' }}>
                          {report.county && <span>📍 {report.county}</span>}
                          <span>🕐 {new Date(report.submitted_at).toLocaleDateString()}</span>
                          {report.assigned_to && <span style={{ color: '#0891b2' }}>👷 {report.assigned_to}</span>}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                        {report.status === 'submitted' && (
                          <button onClick={() => handleStatusUpdate(report.id, 'acknowledged')}
                            style={{ padding: '6px 12px', background: '#fef3c7', color: '#d97706', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>
                            👁️ Acknowledge
                          </button>
                        )}
                        {report.status === 'acknowledged' && (
                          <button onClick={() => handleStatusUpdate(report.id, 'in_progress')}
                            style={{ padding: '6px 12px', background: '#dbeafe', color: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>
                            🔄 Start Work
                          </button>
                        )}
                        {(report.status === 'in_progress' || report.status === 'acknowledged') && (
                          <button onClick={() => handleStatusUpdate(report.id, 'resolved')}
                            style={{ padding: '6px 12px', background: '#d1fae5', color: '#059669', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>
                            ✅ Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Report Detail Panel */}
      <AnimatePresence>
        {selectedReport && currentReport && (
          <motion.div initial={{ x: 500 }} animate={{ x: 0 }} exit={{ x: 500 }} transition={{ type: 'spring', damping: 25 }}
            style={{ position: 'fixed', top: '70px', right: 0, width: '500px', height: 'calc(100vh - 70px)', background: 'white', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', fontFamily: 'monospace', background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '6px', display: 'inline-block', marginBottom: '8px' }}>
                    {currentReport.report_number}
                  </div>
                  <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '800' }}>{currentReport.title}</h2>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.25)', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                      {currentReport.category?.replace('_', ' ').toUpperCase()}
                    </span>
                    <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.25)', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                      {currentReport.priority?.toUpperCase()} PRIORITY
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedReport(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'white' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {/* Status Actions */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '10px', textTransform: 'uppercase' }}>Update Status</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                  {['submitted', 'acknowledged', 'in_progress', 'resolved', 'closed'].map(status => {
                    const info = getStatusInfo(status)
                    const isActive = currentReport.status === status
                    return (
                      <button key={status} onClick={() => handleStatusUpdate(currentReport.id, status)} disabled={isActive}
                        style={{ padding: '8px 4px', background: isActive ? info.bg : 'white', color: isActive ? info.text : '#64748b', border: `1px solid ${isActive ? info.text : '#e2e8f0'}`, borderRadius: '6px', cursor: isActive ? 'default' : 'pointer', fontSize: '10px', fontWeight: '600', opacity: isActive ? 1 : 0.8 }}>
                        {info.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Assignment */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Assign To</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" placeholder="e.g., Nairobi Water Technicians" defaultValue={currentReport.assigned_to || ''}
                    id={`assign-${currentReport.id}`}
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                  <button onClick={() => {
                    const input = document.getElementById(`assign-${currentReport.id}`)
                    handleAssignment(currentReport.id, input.value)
                  }} style={{ padding: '8px 14px', background: '#0891b2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                    Assign
                  </button>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Description</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#0f172a', lineHeight: '1.6', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  {currentReport.description}
                </p>
              </div>

              {/* Info */}
              {currentReport.latitude && <InfoRow icon={MapPin} label="Location" value={`${Number(currentReport.latitude).toFixed(6)}, ${Number(currentReport.longitude).toFixed(6)}`} />}
              {currentReport.county && <InfoRow icon={MapPin} label="County" value={`${currentReport.county}${currentReport.ward ? `, ${currentReport.ward}` : ''}`} />}
              {currentReport.address && <InfoRow icon={MapPin} label="Address" value={currentReport.address} />}
              {currentReport.reporter_name && !currentReport.is_anonymous && <InfoRow icon={User} label="Reporter" value={currentReport.reporter_name} />}

              {/* Resolution Notes */}
              {currentReport.status === 'resolved' && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Resolution Notes</h4>
                  <textarea placeholder="Add resolution notes..." rows={3}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical' }}
                    onBlur={async (e) => {
                      if (e.target.value.trim()) {
                        await api.put(`/reports-enhanced/${currentReport.id}`, { resolution_notes: e.target.value })
                      }
                    }}
                    defaultValue={currentReport.resolution_notes || ''} />
                </div>
              )}

              {/* Comments */}
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>
                  Updates ({reportComments.length})
                </h4>
                {reportComments.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                  <p style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>No updates yet</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatCard({ icon: Icon, title, value, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'white', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
      <div style={{ width: '36px', height: '36px', background: `${color}15`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
        <Icon size={18} color={color} />
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

const selectStyle = { padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white', cursor: 'pointer', minWidth: '140px' }
