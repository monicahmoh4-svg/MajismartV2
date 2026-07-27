import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Droplets, MapPin, Activity, Shield, BarChart3, TrendingUp, 
  AlertTriangle, CheckCircle, MessageSquare, FileText, 
  Phone, Wallet, Heart, Users, LogOut, Menu, X, 
  ArrowRight, ArrowDown, Star, Sparkles, Droplet, 
  Search, Filter, Settings, RefreshCw, Clock, Bell, Gauge
} from 'lucide-react'

export default function CitizenDashboard() {
  const { user, logout } = useAuth()
  const [activeSection, setActiveSection] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768)
  const [loading, setLoading] = useState(true)
  
  // Safe default states to prevent blank screens
  const [areaStatus, setAreaStatus] = useState({ active_nodes: 0, status: 'normal', safety: { label: 'Safe' }, water_level: 85 })
  const [waterPoints, setWaterPoints] = useState([])
  const [mySpending, setMySpending] = useState({ this_month: { total_ksh: 0 } })
  const [myReports, setMyReports] = useState([])
  const [communityReports, setCommunityReports] = useState([])
  const [alerts, setAlerts] = useState([])
  
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportForm, setReportForm] = useState({ title: '', description: '', category: 'leak', location: '' })
  const [submitting, setSubmitting] = useState(false)
  const [selectedPoint, setSelectedPoint] = useState(null)
  const [filters, setFilters] = useState({ quality: 'all', status: 'all' })

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 768)
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    fetchAllData()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [areaData, pointsData, spendingData, reportsData, alertsData, communityData] = await Promise.all([
        api.get(`/citizen/area-status?county=${user?.county || ''}`).catch(() => ({})),
        api.get(`/citizen/water-points?county=${user?.county || ''}`).catch(() => []),
        api.get('/citizen/my-spending').catch(() => ({ this_month: { total_ksh: 0 } })),
        api.get('/reports').catch(() => []),
        api.get('/alerts?resolved=false&limit=5').catch(() => []),
        api.get('/reports').catch(() => [])
      ])
      
      setAreaStatus(areaData || {})
      setWaterPoints(Array.isArray(pointsData) ? pointsData : [])
      setMySpending(spendingData || { this_month: { total_ksh: 0 } })
      
      const allReports = Array.isArray(reportsData) ? reportsData : []
      setMyReports(allReports.filter(r => r && r.user_id === user?.id))
      setAlerts(Array.isArray(alertsData) ? alertsData : [])
      setCommunityReports(Array.isArray(communityData) ? communityData : [])
    } catch (err) { 
      console.error('Fetch error:', err) 
    } finally { 
      setLoading(false) 
    }
  }

  const submitReport = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/reports', { ...reportForm, county: user?.county })
      setShowReportModal(false)
      setReportForm({ title: '', description: '', category: 'leak', location: '' })
      fetchAllData()
    } catch (err) { 
      console.error('Report error:', err) 
    } finally { 
      setSubmitting(false) 
    }
  }

  const getPointStatus = (status) => {
    if (status === 'active') return { label: 'Active', color: '#10b981', bg: '#d1fae5' }
    if (status === 'warning') return { label: 'Low Water', color: '#f59e0b', bg: '#fef3c7' }
    return { label: 'Offline', color: '#ef4444', bg: '#fee2e2' }
  }

  const getReportStatus = (status) => {
    if (status === 'open') return { label: 'Open', color: '#f59e0b', bg: '#fef3c7' }
    if (status === 'in_progress') return { label: 'In Progress', color: '#3b82f6', bg: '#dbeafe' }
    return { label: 'Resolved', color: '#10b981', bg: '#d1fae5' }
  }

  const filteredPoints = waterPoints.filter(point => {
    if (filters.quality === 'good' && (point.quality_index || 0) < 80) return false
    if (filters.quality === 'caution' && (point.quality_index || 0) >= 80) return false
    if (filters.status === 'active' && point.status !== 'active') return false
    if (filters.status === 'warning' && point.status !== 'warning') return false
    return true
  })

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  }
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #0891b2', borderRadius: '50%' }} 
        />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", display: 'flex' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .card-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.08); }
      `}</style>

      {/* Mobile Overlay */}
      {sidebarOpen && window.innerWidth <= 768 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          width: '280px', background: 'white', borderRight: '1px solid #f1f5f9',
          position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 1000,
          boxShadow: '4px 0 24px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column'
        }}
      >
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(8, 145, 178, 0.2)' }}>
              <Droplets style={{ color: 'white', width: '20px', height: '20px' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>MajiSmart</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Citizen Portal</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: window.innerWidth <= 768 ? 'block' : 'none' }}>
            <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
          </button>
        </div>

        <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'water-points', label: 'Water Points', icon: MapPin },
            { id: 'reports', label: 'My Reports', icon: FileText },
            { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
            { id: 'community', label: 'Community', icon: MessageSquare },
            { id: 'spending', label: 'Spending', icon: Wallet }
          ].map(item => (
            <motion.button 
              key={item.id} 
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setActiveSection(item.id); if (window.innerWidth <= 768) setSidebarOpen(false) }}
              style={{ 
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', marginBottom: '4px', border: 'none',
                background: activeSection === item.id ? '#eff6ff' : 'transparent', 
                color: activeSection === item.id ? '#0891b2' : '#475569',
                borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: activeSection === item.id ? '600' : '500', 
                transition: 'all 0.2s', textAlign: 'left' 
              }}
            >
              <item.icon style={{ width: '18px', height: '18px' }} /> {item.label}
            </motion.button>
          ))}
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '16px' }}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'User'}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.county || 'Kenya'}</p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={logout} 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
          >
            <LogOut style={{ width: '16px', height: '16px' }} /> Sign Out
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: sidebarOpen && window.innerWidth > 768 ? '280px' : '0', transition: 'margin-left 0.3s ease', minHeight: '100vh', width: '100%' }}>
        <header style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #f1f5f9', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', display: window.innerWidth <= 768 ? 'block' : 'none' }}>
              <Menu style={{ width: '24px', height: '24px', color: '#0f172a' }} />
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{activeSection === 'overview' ? 'Dashboard' : activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{ position: 'relative', background: 'white', border: '1px solid #f1f5f9', borderRadius: '10px', cursor: 'pointer', padding: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <Bell style={{ width: '20px', height: '20px', color: '#475569' }} />
              {alerts.length > 0 && <span style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid white' }}></span>}
            </motion.button>
          </div>
        </header>

        <main style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeSection} variants={staggerContainer} initial="hidden" animate="visible" exit="hidden">
              
              {/* OVERVIEW SECTION */}
              {activeSection === 'overview' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    {[
                      { label: 'Active Nodes', value: areaStatus?.active_nodes || 0, icon: Droplets, color: '#0891b2', bg: '#eff6ff' },
                      { label: 'Area Status', value: areaStatus?.status === 'alert' ? 'Alert' : 'Normal', icon: areaStatus?.status === 'alert' ? AlertTriangle : CheckCircle, color: areaStatus?.status === 'alert' ? '#f59e0b' : '#10b981', bg: areaStatus?.status === 'alert' ? '#fef3c7' : '#d1fae5' },
                      { label: 'This Month', value: `KES ${mySpending?.this_month?.total_ksh || 0}`, icon: Wallet, color: '#8b5cf6', bg: '#ede9fe' },
                      { label: 'Active Alerts', value: alerts.length, icon: AlertTriangle, color: '#ef4444', bg: '#fee2e2' }
                    ].map((stat, i) => (
                      <motion.div key={i} variants={fadeInUp} whileHover={{ y: -4 }} className="card-hover" style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <div>
                            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>{stat.label}</p>
                            <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>{stat.value}</h3>
                          </div>
                          <div style={{ width: '48px', height: '48px', background: stat.bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <stat.icon style={{ width: '24px', height: '24px', color: stat.color }} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                    <motion.div variants={fadeInUp} className="card-hover" style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Nearby Water Points</h3>
                        <button onClick={() => setActiveSection('water-points')} style={{ background: '#eff6ff', border: 'none', color: '#0891b2', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>View All</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {waterPoints.slice(0, 3).map((point, i) => (
                          <div key={i} style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>{point.name}</h4>
                              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{point.location}</p>
                            </div>
                            <span style={{ padding: '4px 12px', background: getPointStatus(point.status).bg, color: getPointStatus(point.status).color, borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                              {getPointStatus(point.status).label}
                            </span>
                          </div>
                        ))}
                        {waterPoints.length === 0 && <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>No water points found</p>}
                      </div>
                    </motion.div>

                    <motion.div variants={fadeInUp} className="card-hover" style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Recent Alerts</h3>
                        <button onClick={() => setActiveSection('alerts')} style={{ background: '#eff6ff', border: 'none', color: '#0891b2', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>View All</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {alerts.slice(0, 3).map((alert, i) => (
                          <div key={i} style={{ background: '#fff7ed', borderRadius: '12px', padding: '16px', border: '1px solid #ffedd5', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <AlertTriangle style={{ width: '20px', height: '20px', color: '#f97316', flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{alert.message || 'System Alert'}</h4>
                              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{new Date(alert.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                        {alerts.length === 0 && <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>No active alerts</p>}
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}

              {/* WATER POINTS SECTION */}
              {activeSection === 'water-points' && (
                <motion.div variants={fadeInUp}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>Water Points</h2>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <select value={filters.quality} onChange={(e) => setFilters({...filters, quality: e.target.value})} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white', cursor: 'pointer' }}>
                        <option value="all">All Quality</option>
                        <option value="good">Good (80%+)</option>
                        <option value="caution">Caution (65-79%)</option>
                      </select>
                      <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white', cursor: 'pointer' }}>
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="warning">Low Water</option>
                      </select>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    {filteredPoints.map((point, i) => (
                      <motion.div key={i} variants={fadeInUp} whileHover={{ y: -4 }} className="card-hover" onClick={() => setSelectedPoint(selectedPoint?.id === point.id ? null : point)} style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #f1f5f9', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>{point.name}</h4>
                          <span style={{ padding: '4px 12px', background: getPointStatus(point.status).bg, color: getPointStatus(point.status).color, borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                            {getPointStatus(point.status).label}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div>
                            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Water Level</p>
                            <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{point.water_level || 0}%</p>
                          </div>
                          <div>
                            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Quality</p>
                            <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{point.quality_index || 0}%</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {filteredPoints.length === 0 && (
                    <div style={{ background: 'white', borderRadius: '16px', padding: '60px 20px', textAlign: 'center', border: '1px solid #f1f5f9', marginTop: '20px' }}>
                      <Search style={{ width: '48px', height: '48px', color: '#cbd5e1', margin: '0 auto 16px' }} />
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>No Water Points Found</h4>
                      <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Adjust your filters or try a different location</p>
                    </div>
                  )}

                  {selectedPoint && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', marginTop: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{selectedPoint.name}</h3>
                          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{selectedPoint.location} • {selectedPoint.county}</p>
                        </div>
                        <span style={{ padding: '6px 16px', background: getPointStatus(selectedPoint.status).bg, color: getPointStatus(selectedPoint.status).color, borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                          {getPointStatus(selectedPoint.status).label}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                        {[
                          { label: 'Water Level', value: `${selectedPoint.water_level || 0}%`, icon: Droplets },
                          { label: 'Quality Index', value: `${selectedPoint.quality_index || 0}%`, icon: Droplet },
                          { label: 'Flow Rate', value: `${selectedPoint.flow_rate || 0} L/min`, icon: Activity },
                          { label: 'Pressure', value: `${selectedPoint.pressure || 0} PSI`, icon: Gauge }
                        ].map((item, i) => (
                          <div key={i} style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                            <item.icon style={{ width: '24px', height: '24px', color: '#0891b2', margin: '0 auto 8px' }} />
                            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{item.label}</p>
                            <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* REPORTS SECTION */}
              {activeSection === 'reports' && (
                <motion.div variants={fadeInUp}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>My Reports</h2>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowReportModal(true)} style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText style={{ width: '18px', height: '18px' }} /> New Report
                    </motion.button>
                  </div>
                  <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                    {myReports.length > 0 ? myReports.map((report, i) => (
                      <div key={i} style={{ padding: '20px', borderBottom: i === myReports.length - 1 ? 'none' : '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>{report.title}</h4>
                          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#475569' }}>{report.description}</p>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b' }}>
                            <span>{report.location}</span>
                            <span>•</span>
                            <span>{new Date(report.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span style={{ padding: '6px 16px', background: getReportStatus(report.status).bg, color: getReportStatus(report.status).color, borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                          {getReportStatus(report.status).label}
                        </span>
                      </div>
                    )) : (
                      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <FileText style={{ width: '48px', height: '48px', color: '#cbd5e1', margin: '0 auto 16px' }} />
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>No Reports Yet</h4>
                        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>You haven't submitted any reports. Click "New Report" to get started.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ALERTS SECTION */}
              {activeSection === 'alerts' && (
                <motion.div variants={fadeInUp}>
                  <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>System Alerts</h2>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {alerts.length > 0 ? alerts.map((alert, i) => (
                      <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #f1f5f9', display: 'flex', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', background: '#fef2f2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <AlertTriangle style={{ width: '24px', height: '24px', color: '#ef4444' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>{alert.message}</h4>
                          <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569' }}>Location: {alert.node_name || 'Nearby Area'}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                            <span>{new Date(alert.created_at).toLocaleString()}</span>
                            <span style={{ color: '#ef4444', fontWeight: '600' }}>Priority: High</span>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div style={{ background: 'white', borderRadius: '16px', padding: '60px 20px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                        <CheckCircle style={{ width: '48px', height: '48px', color: '#10b981', margin: '0 auto 16px' }} />
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>All Clear!</h4>
                        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>No active alerts in your area at this time.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* COMMUNITY SECTION */}
              {activeSection === 'community' && (
                <motion.div variants={fadeInUp}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>Community Reports</h2>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowReportModal(true)} style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MessageSquare style={{ width: '18px', height: '18px' }} /> Report Issue
                    </motion.button>
                  </div>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {communityReports.length > 0 ? communityReports.map((report, i) => (
                      <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>{report.title}</h4>
                            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569' }}>{report.description}</p>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b' }}>
                              <span>{report.reporter_name || 'Anonymous'}</span>
                              <span>•</span>
                              <span>{report.location}</span>
                              <span>•</span>
                              <span>{new Date(report.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <span style={{ padding: '6px 16px', background: getReportStatus(report.status).bg, color: getReportStatus(report.status).color, borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                            {getReportStatus(report.status).label}
                          </span>
                        </div>
                      </div>
                    )) : (
                      <div style={{ background: 'white', borderRadius: '16px', padding: '60px 20px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                        <Users style={{ width: '48px', height: '48px', color: '#cbd5e1', margin: '0 auto 16px' }} />
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>No Community Reports</h4>
                        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Be the first to report an issue in your community.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* SPENDING SECTION */}
              {activeSection === 'spending' && (
                <motion.div variants={fadeInUp}>
                  <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>Water Spending History</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Total Spent (This Month)</p>
                      <p style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>KES {mySpending?.this_month?.total_ksh || 0}</p>
                    </div>
                  </div>
                  <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', padding: '60px 20px', textAlign: 'center' }}>
                    <Wallet style={{ width: '48px', height: '48px', color: '#cbd5e1', margin: '0 auto 16px' }} />
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>Transaction History</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Your detailed spending history will appear here as you make payments.</p>
                  </div>
                </motion.div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* REPORT MODAL */}
      {showReportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'white', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Report an Issue</h3>
              <button onClick={() => setShowReportModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X style={{ width: '24px', height: '24px', color: '#64748b' }} />
              </button>
            </div>
            <form onSubmit={submitReport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>Title</label>
                <input type="text" required value={reportForm.title} onChange={(e) => setReportForm({...reportForm, title: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }} placeholder="e.g., Leaking pipe at main junction" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>Category</label>
                <select value={reportForm.category} onChange={(e) => setReportForm({...reportForm, category: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', background: 'white' }}>
                  <option value="leak">Leak</option>
                  <option value="contamination">Contamination</option>
                  <option value="dry">Dry Point</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>Location</label>
                <input type="text" required value={reportForm.location} onChange={(e) => setReportForm({...reportForm, location: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }} placeholder="e.g., Near Kibera Market" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>Description</label>
                <textarea required value={reportForm.description} onChange={(e) => setReportForm({...reportForm, description: e.target.value})} rows={4} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', resize: 'vertical' }} placeholder="Describe the issue in detail..." />
              </div>
              <button type="submit" disabled={submitting} style={{ padding: '14px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '16px', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
