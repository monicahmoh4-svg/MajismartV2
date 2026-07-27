import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Droplets, MapPin, Activity, Shield, BarChart3, TrendingUp, 
  AlertTriangle, CheckCircle, MessageSquare, FileText, 
  Phone, Wallet, Heart, Users, LogOut, Menu, X, 
  ArrowRight, RefreshCw, Clock, Bell, Gauge, Thermometer,
  Wifi, Database, Zap, Eye, Filter, Search, Download,
  Droplet, Waves, CloudRain, Sun, Wind, Info, ChevronDown,
  Home, Settings, HelpCircle, User
} from 'lucide-react'

export default function CitizenDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  
  // Core Data States
  const [areaStatus, setAreaStatus] = useState({ 
    active_nodes: 0, 
    status: 'normal', 
    safety: { label: 'Safe', quality: 85 }, 
    water_level: 85,
    pressure: 45,
    flow_rate: 12.5,
    temperature: 24
  })
  const [waterPoints, setWaterPoints] = useState([])
  const [mySpending, setMySpending] = useState({ this_month: { total_ksh: 0 }, transactions: [] })
  const [myReports, setMyReports] = useState([])
  const [communityReports, setCommunityReports] = useState([])
  const [alerts, setAlerts] = useState([])
  
  // IoT & Sensor Data
  const [iotReadings, setIotReadings] = useState({
    ph: 7.2,
    turbidity: 1.2,
    tds: 150,
    dissolved_oxygen: 8.5,
    conductivity: 320,
    chlorine: 0.4,
    last_updated: new Date()
  })
  
  // Water Quality Metrics
  const [waterQuality, setWaterQuality] = useState({
    purity_level: 92,
    safety_score: 88,
    potability: 'Safe',
    contaminants: [],
    treatment_status: 'Treated'
  })
  
  // UI States
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportForm, setReportForm] = useState({ title: '', description: '', category: 'leak', location: '' })
  const [submitting, setSubmitting] = useState(false)
  const [selectedPoint, setSelectedPoint] = useState(null)
  const [filters, setFilters] = useState({ quality: 'all', status: 'all', type: 'all' })
  const [dateRange, setDateRange] = useState('7days')
  const [viewMode, setViewMode] = useState('grid')

  // Responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
      
      if (width < 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    fetchAllData()
    
    const interval = setInterval(() => fetchIoTData(), 30000)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearInterval(interval)
    }
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [areaData, pointsData, spendingData, reportsData, alertsData, communityData, qualityData] = await Promise.all([
        api.get(`/citizen/area-status?county=${user?.county || ''}`).catch(() => ({})),
        api.get(`/citizen/water-points?county=${user?.county || ''}`).catch(() => []),
        api.get('/citizen/my-spending').catch(() => ({ this_month: { total_ksh: 0 }, transactions: [] })),
        api.get('/reports').catch(() => []),
        api.get('/alerts?resolved=false&limit=5').catch(() => []),
        api.get('/reports').catch(() => []),
        api.get('/citizen/water-quality').catch(() => ({}))
      ])
      
      setAreaStatus(prev => ({ ...prev, ...areaData }))
      setWaterPoints(Array.isArray(pointsData) ? pointsData : [])
      setMySpending(spendingData || { this_month: { total_ksh: 0 }, transactions: [] })
      
      const allReports = Array.isArray(reportsData) ? reportsData : []
      setMyReports(allReports.filter(r => r && r.user_id === user?.id))
      setAlerts(Array.isArray(alertsData) ? alertsData : [])
      setCommunityReports(Array.isArray(communityData) ? communityData : [])
      
      if (qualityData) {
        setWaterQuality(prev => ({ ...prev, ...qualityData }))
      }
      
      await fetchIoTData()
    } catch (err) { 
      console.error('Fetch error:', err) 
    } finally { 
      setLoading(false) 
    }
  }

  const fetchIoTData = async () => {
    try {
      const [iotData] = await Promise.all([
        api.get('/citizen/iot-readings').catch(() => ({}))
      ])
      
      if (iotData) {
        setIotReadings(prev => ({ ...prev, ...iotData, last_updated: new Date() }))
      }
    } catch (err) {
      console.error('IoT fetch error:', err)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAllData()
    setTimeout(() => setRefreshing(false), 1000)
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
    const statuses = {
      active: { label: 'Active', color: '#10b981', bg: '#d1fae5', icon: CheckCircle },
      warning: { label: 'Low Water', color: '#f59e0b', bg: '#fef3c7', icon: AlertTriangle },
      offline: { label: 'Offline', color: '#ef4444', bg: '#fee2e2', icon: AlertTriangle },
      maintenance: { label: 'Maintenance', color: '#3b82f6', bg: '#dbeafe', icon: Activity }
    }
    return statuses[status] || statuses.offline
  }

  const getReportStatus = (status) => {
    const statuses = {
      open: { label: 'Open', color: '#f59e0b', bg: '#fef3c7' },
      in_progress: { label: 'In Progress', color: '#3b82f6', bg: '#dbeafe' },
      resolved: { label: 'Resolved', color: '#10b981', bg: '#d1fae5' },
      closed: { label: 'Closed', color: '#6b7280', bg: '#f3f4f6' }
    }
    return statuses[status] || statuses.open
  }

  const filteredPoints = waterPoints.filter(point => {
    if (filters.quality === 'good' && (point.quality_index || 0) < 80) return false
    if (filters.quality === 'caution' && (point.quality_index || 0) >= 80) return false
    if (filters.status !== 'all' && point.status !== filters.status) return false
    if (filters.type !== 'all' && point.type !== filters.type) return false
    return true
  })

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  }
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{ width: '50px', height: '50px', border: '4px solid #e2e8f0', borderTop: '4px solid #0891b2', borderRadius: '50%' }} 
        />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f9ff', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <style>{`
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(8, 145, 178, 0.4); } 50% { box-shadow: 0 0 20px 10px rgba(8, 145, 178, 0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .card-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
        .nav-btn { transition: all 0.2s ease; }
        .nav-btn:hover { background: #eff6ff; color: #0891b2; }
        .nav-btn.active { background: linear-gradient(135deg, #0891b2, #06b6d4); color: white; }
      `}</style>

      {/* TOP NAVIGATION BAR */}
      <header style={{ 
        background: 'white', 
        borderBottom: '1px solid #e2e8f0', 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000, 
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        height: '70px'
      }}>
        <div style={{ 
          maxWidth: '1920px', 
          margin: '0 auto', 
          padding: '0 24px', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          {/* Left Section - Logo & Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer', 
                padding: '8px',
                borderRadius: '8px'
              }}
            >
              <Menu style={{ width: '24px', height: '24px', color: '#0f172a' }} />
            </button>
            
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
              onClick={() => navigate('/')}
            >
              <div style={{ 
                width: '40px', 
                height: '40px', 
                background: 'linear-gradient(135deg, #0891b2, #06b6d4)', 
                borderRadius: '10px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)'
              }}>
                <Droplets style={{ color: 'white', width: '20px', height: '20px' }} />
              </div>
              {!isMobile && (
                <div>
                  <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>MajiSmart</h1>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Citizen Portal</p>
                </div>
              )}
            </div>
          </div>

          {/* Center Section - Navigation Buttons */}
          {!isMobile && (
            <nav style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              background: '#f8fafc',
              padding: '6px',
              borderRadius: '12px'
            }}>
              {[
                { id: 'overview', label: 'Overview', icon: Home },
                { id: 'water-points', label: 'Water Points', icon: MapPin },
                { id: 'reports', label: 'Reports', icon: FileText },
                { id: 'community', label: 'Community', icon: MessageSquare }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`nav-btn ${activeSection === item.id ? 'active' : ''}`}
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: activeSection === item.id ? 'linear-gradient(135deg, #0891b2, #06b6d4)' : 'transparent',
                    color: activeSection === item.id ? 'white' : '#475569'
                  }}
                >
                  <item.icon style={{ width: '16px', height: '16px' }} />
                  {item.label}
                </button>
              ))}
            </nav>
          )}

          {/* Right Section - Actions & User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              style={{ 
                background: 'white', 
                border: '1px solid #e2e8f0', 
                borderRadius: '10px', 
                cursor: 'pointer', 
                padding: '10px',
                opacity: refreshing ? 0.6 : 1
              }}
            >
              <RefreshCw style={{ 
                width: '20px', 
                height: '20px', 
                color: '#0891b2',
                animation: refreshing ? 'spin 1s linear infinite' : 'none'
              }} />
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveSection('alerts')}
              style={{ 
                position: 'relative', 
                background: 'white', 
                border: '1px solid #e2e8f0', 
                borderRadius: '10px', 
                cursor: 'pointer', 
                padding: '10px'
              }}
            >
              <Bell style={{ width: '20px', height: '20px', color: '#475569' }} />
              {alerts.length > 0 && (
                <span style={{ 
                  position: 'absolute', 
                  top: '6px', 
                  right: '6px', 
                  width: '10px', 
                  height: '10px', 
                  background: '#ef4444', 
                  borderRadius: '50%', 
                  border: '2px solid white',
                  animation: 'pulse-glow 2s infinite'
                }} />
              )}
            </motion.button>

            {/* User Menu */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '6px 12px 6px 6px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  background: 'linear-gradient(135deg, #0891b2, #06b6d4)', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '14px'
                }}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                {!isMobile && (
                  <>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{user?.name || 'User'}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{user?.county || 'Kenya'}</p>
                    </div>
                    <ChevronDown style={{ width: '16px', height: '16px', color: '#64748b' }} />
                  </>
                )}
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    border: '1px solid #e2e8f0',
                    minWidth: '200px',
                    zIndex: 1001,
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{user?.name}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{user?.email}</p>
                  </div>
                  <div style={{ padding: '8px' }}>
                    {[
                      { label: 'Dashboard', icon: Home, section: 'overview' },
                      { label: 'My Reports', icon: FileText, section: 'reports' },
                      { label: 'Spending', icon: Wallet, section: 'spending' }
                    ].map(item => (
                      <button 
                        key={item.section}
                        onClick={() => { setActiveSection(item.section); setUserMenuOpen(false) }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: 'none', background: 'transparent', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#475569', textAlign: 'left' }}
                      >
                        <item.icon style={{ width: '16px', height: '16px' }} /> {item.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ padding: '8px', borderTop: '1px solid #f1f5f9' }}>
                    <button 
                      onClick={logout}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: 'none', background: '#fee2e2', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#dc2626', fontWeight: '600', textAlign: 'left' }}
                    >
                      <LogOut style={{ width: '16px', height: '16px' }} /> Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* SIDEBAR */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Mobile Overlay */}
            {(isMobile || isTablet) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ 
                  position: 'fixed', 
                  inset: 0, 
                  background: 'rgba(0,0,0,0.5)', 
                  zIndex: 998,
                  backdropFilter: 'blur(4px)'
                }}
                onClick={() => setSidebarOpen(false)}
              />
            )}

            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                width: '280px',
                background: 'white',
                borderRight: '1px solid #e2e8f0',
                position: 'fixed',
                top: '70px',
                left: 0,
                height: 'calc(100vh - 70px)',
                zIndex: 999,
                overflowY: 'auto',
                boxShadow: (isMobile || isTablet) ? '4px 0 24px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <div style={{ padding: '20px 16px' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', paddingLeft: '12px' }}>Navigation</p>
                {[
                  { id: 'overview', label: 'Overview', icon: BarChart3 },
                  { id: 'iot-monitoring', label: 'IoT Monitoring', icon: Wifi },
                  { id: 'water-quality', label: 'Water Quality', icon: Droplet },
                  { id: 'water-points', label: 'Water Points', icon: MapPin },
                  { id: 'reports', label: 'My Reports', icon: FileText },
                  { id: 'community', label: 'Community', icon: MessageSquare },
                  { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: alerts.length },
                  { id: 'spending', label: 'Spending', icon: Wallet }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { 
                      setActiveSection(item.id)
                      if (isMobile || isTablet) setSidebarOpen(false)
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      marginBottom: '4px',
                      border: 'none',
                      background: activeSection === item.id ? 'linear-gradient(135deg, #eff6ff, #f0f9ff)' : 'transparent',
                      color: activeSection === item.id ? '#0891b2' : '#475569',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: activeSection === item.id ? '600' : '500',
                      textAlign: 'left',
                      position: 'relative',
                      transition: 'all 0.2s'
                    }}
                  >
                    <item.icon style={{ width: '18px', height: '18px' }} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge > 0 && (
                      <span style={{ 
                        background: '#ef4444', 
                        color: 'white', 
                        fontSize: '11px', 
                        fontWeight: '700', 
                        padding: '2px 8px', 
                        borderRadius: '10px' 
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <main style={{ 
        marginTop: '70px',
        marginLeft: sidebarOpen && !isMobile && !isTablet ? '280px' : '0',
        transition: 'margin-left 0.3s ease',
        minHeight: 'calc(100vh - 70px)',
        padding: isMobile ? '16px' : '24px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeSection} variants={staggerContainer} initial="hidden" animate="visible" exit="hidden">
              
              {/* OVERVIEW SECTION */}
              {activeSection === 'overview' && (
                <>
                  {/* Welcome Banner */}
                  <motion.div 
                    variants={fadeInUp}
                    style={{
                      background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
                      borderRadius: '20px',
                      padding: isMobile ? '24px' : '32px',
                      marginBottom: '24px',
                      color: 'white',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <h2 style={{ margin: '0 0 8px 0', fontSize: isMobile ? '22px' : '28px', fontWeight: '800' }}>
                        Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
                      </h2>
                      <p style={{ margin: 0, fontSize: isMobile ? '14px' : '16px', opacity: 0.95 }}>
                        Here's what's happening with your water supply today
                      </p>
                    </div>
                    <div style={{
                      position: 'absolute',
                      top: '-50px',
                      right: '-50px',
                      width: '200px',
                      height: '200px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '50%'
                    }} />
                  </motion.div>

                  {/* Quick Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                    {[
                      { label: 'Water Quality', value: `${waterQuality.purity_level}%`, icon: Droplet, color: '#0891b2', bg: 'linear-gradient(135deg, #eff6ff, #f0f9ff)' },
                      { label: 'Active Points', value: waterPoints.filter(p => p.status === 'active').length, icon: MapPin, color: '#10b981', bg: 'linear-gradient(135deg, #d1fae5, #ecfdf5)' },
                      { label: 'Monthly Spending', value: `KES ${mySpending?.this_month?.total_ksh || 0}`, icon: Wallet, color: '#8b5cf6', bg: 'linear-gradient(135deg, #ede9fe, #f5f3ff)' },
                      { label: 'Active Alerts', value: alerts.length, icon: AlertTriangle, color: alerts.length > 0 ? '#ef4444' : '#10b981', bg: alerts.length > 0 ? 'linear-gradient(135deg, #fee2e2, #fef2f2)' : 'linear-gradient(135deg, #d1fae5, #ecfdf5)' }
                    ].map((stat, i) => (
                      <motion.div key={i} variants={scaleIn} whileHover={{ y: -4 }} className="card-hover" style={{ background: stat.bg, borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <div>
                            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>{stat.label}</p>
                            <h3 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>{stat.value}</h3>
                          </div>
                          <div style={{ width: '48px', height: '48px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                            <stat.icon style={{ width: '24px', height: '24px', color: stat.color }} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* IoT & Alerts Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                    {/* IoT Snapshot */}
                    <motion.div variants={fadeInUp} className="card-hover" style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Live IoT Sensors</h3>
                        <button onClick={() => setActiveSection('iot-monitoring')} style={{ background: '#eff6ff', border: 'none', color: '#0891b2', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>View All</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                        {[
                          { label: 'pH', value: iotReadings.ph, unit: '', color: '#0891b2' },
                          { label: 'Turbidity', value: iotReadings.turbidity, unit: 'NTU', color: '#06b6d4' },
                          { label: 'TDS', value: iotReadings.tds, unit: 'ppm', color: '#10b981' },
                          { label: 'Temp', value: areaStatus.temperature, unit: '°C', color: '#f59e0b' }
                        ].map((item, i) => (
                          <div key={i} style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #f1f5f9' }}>
                            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{item.label}</p>
                            <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
                              {item.value}<span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>{item.unit}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Recent Alerts */}
                    <motion.div variants={fadeInUp} className="card-hover" style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Recent Alerts</h3>
                        <button onClick={() => setActiveSection('alerts')} style={{ background: '#eff6ff', border: 'none', color: '#0891b2', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>View All</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {alerts.slice(0, 3).map((alert, i) => (
                          <div key={i} style={{ background: '#fff7ed', borderRadius: '12px', padding: '16px', border: '1px solid #ffedd5' }}>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{alert.message || 'System Alert'}</h4>
                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{new Date(alert.created_at).toLocaleDateString()}</p>
                          </div>
                        ))}
                        {alerts.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                            <CheckCircle style={{ width: '48px', height: '48px', color: '#10b981', margin: '0 auto 12px' }} />
                            <p style={{ fontWeight: '600', color: '#059669' }}>All systems normal</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </>
              )}

              {/* IoT MONITORING SECTION */}
              {activeSection === 'iot-monitoring' && (
                <motion.div variants={fadeInUp}>
                  <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>IoT Sensor Monitoring</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    {[
                      { label: 'pH Level', value: iotReadings.ph, unit: '', icon: Droplet, color: '#0891b2', status: iotReadings.ph >= 6.5 && iotReadings.ph <= 8.5 ? 'Optimal' : 'Alert' },
                      { label: 'Turbidity', value: iotReadings.turbidity, unit: 'NTU', icon: Waves, color: '#06b6d4', status: iotReadings.turbidity < 5 ? 'Clear' : 'Cloudy' },
                      { label: 'TDS', value: iotReadings.tds, unit: 'ppm', icon: Database, color: '#10b981', status: iotReadings.tds < 300 ? 'Safe' : 'Elevated' },
                      { label: 'Dissolved Oxygen', value: iotReadings.dissolved_oxygen, unit: 'mg/L', icon: Wind, color: '#3b82f6', status: iotReadings.dissolved_oxygen >= 6 ? 'Good' : 'Low' },
                      { label: 'Conductivity', value: iotReadings.conductivity, unit: 'μS/cm', icon: Zap, color: '#f59e0b', status: 'Normal' },
                      { label: 'Free Chlorine', value: iotReadings.chlorine, unit: 'mg/L', icon: CloudRain, color: '#ef4444', status: iotReadings.chlorine >= 0.2 && iotReadings.chlorine <= 1.0 ? 'Treated' : 'Check' }
                    ].map((metric, i) => (
                      <motion.div key={i} variants={scaleIn} whileHover={{ y: -4 }} className="card-hover" style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '48px', height: '48px', background: `${metric.color}15`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <metric.icon style={{ width: '24px', height: '24px', color: metric.color }} />
                            </div>
                            <div>
                              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{metric.label}</h3>
                            </div>
                          </div>
                          <span style={{ padding: '6px 12px', background: metric.status === 'Optimal' || metric.status === 'Clear' || metric.status === 'Safe' || metric.status === 'Good' || metric.status === 'Normal' || metric.status === 'Treated' ? '#d1fae5' : '#fef3c7', color: metric.status === 'Optimal' || metric.status === 'Clear' || metric.status === 'Safe' || metric.status === 'Good' || metric.status === 'Normal' || metric.status === 'Treated' ? '#059669' : '#d97706', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{metric.status}</span>
                        </div>
                        <div style={{ fontSize: '36px', fontWeight: '800', color: '#0f172a' }}>
                          {metric.value}<span style={{ fontSize: '14px', color: '#64748b', marginLeft: '4px' }}>{metric.unit}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* WATER QUALITY SECTION */}
              {activeSection === 'water-quality' && (
                <motion.div variants={fadeInUp}>
                  <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>Water Quality Analysis</h2>
                  <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
                      <div style={{ textAlign: 'center', padding: '20px', background: '#f0f9ff', borderRadius: '12px' }}>
                        <div style={{ fontSize: '48px', fontWeight: '800', color: '#0891b2', marginBottom: '8px' }}>{waterQuality.purity_level}%</div>
                        <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Purity Level</p>
                      </div>
                      <div style={{ textAlign: 'center', padding: '20px', background: '#f0fdf4', borderRadius: '12px' }}>
                        <div style={{ fontSize: '48px', fontWeight: '800', color: '#10b981', marginBottom: '8px' }}>{waterQuality.safety_score}</div>
                        <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Safety Score</p>
                      </div>
                      <div style={{ textAlign: 'center', padding: '20px', background: '#fef3c7', borderRadius: '12px' }}>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b', marginBottom: '8px' }}>{waterQuality.treatment_status || 'Treated'}</div>
                        <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Treatment Status</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* WATER POINTS SECTION */}
              {activeSection === 'water-points' && (
                <motion.div variants={fadeInUp}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>Water Points</h2>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white', cursor: 'pointer' }}>
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="warning">Low Water</option>
                      </select>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                    {filteredPoints.map((point, i) => {
                      const status = getPointStatus(point.status)
                      const StatusIcon = status.icon
                      return (
                        <motion.div key={i} variants={scaleIn} whileHover={{ y: -4 }} className="card-hover" style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', cursor: 'pointer' }} onClick={() => setSelectedPoint(selectedPoint?.id === point.id ? null : point)}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '44px', height: '44px', background: status.bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <StatusIcon style={{ width: '22px', height: '22px', color: status.color }} />
                              </div>
                              <div>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{point.name}</h4>
                                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{point.location}</p>
                              </div>
                            </div>
                            <span style={{ padding: '6px 14px', background: status.bg, color: status.color, borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{status.label}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
                              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Water</p>
                              <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{point.water_level || 0}%</p>
                            </div>
                            <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
                              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Quality</p>
                              <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{point.quality_index || 0}%</p>
                            </div>
                            <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
                              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Flow</p>
                              <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{point.flow_rate || 0} L/m</p>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                  {filteredPoints.length === 0 && (
                    <div style={{ background: 'white', borderRadius: '16px', padding: '60px 20px', textAlign: 'center', border: '1px solid #e2e8f0', marginTop: '20px' }}>
                      <Search style={{ width: '64px', height: '64px', color: '#cbd5e1', margin: '0 auto 16px' }} />
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>No Water Points Found</h4>
                      <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Adjust your filters to see more results</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* REPORTS SECTION */}
              {activeSection === 'reports' && (
                <motion.div variants={fadeInUp}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>My Reports</h2>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowReportModal(true)} style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText style={{ width: '18px', height: '18px' }} /> New Report
                    </motion.button>
                  </div>
                  <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    {myReports.length > 0 ? myReports.map((report, i) => {
                      const status = getReportStatus(report.status)
                      return (
                        <div key={i} style={{ padding: '20px', borderBottom: i === myReports.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{report.title}</h4>
                            <span style={{ padding: '6px 16px', background: status.bg, color: status.color, borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>{status.label}</span>
                          </div>
                          <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>{report.description}</p>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b', flexWrap: 'wrap' }}>
                            <span>{report.location}</span>
                            <span>•</span>
                            <span>{new Date(report.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )
                    }) : (
                      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                        <FileText style={{ width: '64px', height: '64px', color: '#cbd5e1', margin: '0 auto 16px' }} />
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>No Reports Yet</h4>
                        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748b' }}>You haven't submitted any reports yet.</p>
                        <button onClick={() => setShowReportModal(true)} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Create Your First Report</button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ALERTS SECTION */}
              {activeSection === 'alerts' && (
                <motion.div variants={fadeInUp}>
                  <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>System Alerts</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {alerts.length > 0 ? alerts.map((alert, i) => (
                      <motion.div key={i} variants={scaleIn} className="card-hover" style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #fee2e2' }}>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <div style={{ width: '56px', height: '56px', background: '#fef2f2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <AlertTriangle style={{ width: '28px', height: '28px', color: '#ef4444' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{alert.message}</h4>
                            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569' }}>Location: {alert.node_name || 'Nearby Area'}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                              <span>{new Date(alert.created_at).toLocaleString()}</span>
                              <span style={{ color: '#ef4444', fontWeight: '600' }}>High Priority</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )) : (
                      <div style={{ background: 'white', borderRadius: '16px', padding: '80px 20px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                        <CheckCircle style={{ width: '64px', height: '64px', color: '#10b981', margin: '0 auto 16px' }} />
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>All Systems Normal</h4>
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
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>Community Reports</h2>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowReportModal(true)} style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MessageSquare style={{ width: '18px', height: '18px' }} /> Report Issue
                    </motion.button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {communityReports.length > 0 ? communityReports.map((report, i) => {
                      const status = getReportStatus(report.status)
                      return (
                        <motion.div key={i} variants={scaleIn} className="card-hover" style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{report.title}</h4>
                                <span style={{ padding: '4px 12px', background: status.bg, color: status.color, borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{status.label}</span>
                              </div>
                              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>{report.description}</p>
                              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b', flexWrap: 'wrap' }}>
                                <span>{report.reporter_name || 'Anonymous'}</span>
                                <span>•</span>
                                <span>{report.location}</span>
                                <span>•</span>
                                <span>{new Date(report.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    }) : (
                      <div style={{ background: 'white', borderRadius: '16px', padding: '80px 20px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                        <Users style={{ width: '64px', height: '64px', color: '#cbd5e1', margin: '0 auto 16px' }} />
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>No Community Reports</h4>
                        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748b' }}>Be the first to report an issue in your community.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* SPENDING SECTION */}
              {activeSection === 'spending' && (
                <motion.div variants={fadeInUp}>
                  <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>Water Spending History</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '20px', padding: '24px', color: 'white' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.9, fontWeight: '600' }}>Total Spent (This Month)</p>
                      <p style={{ margin: 0, fontSize: '36px', fontWeight: '800' }}>KES {mySpending?.this_month?.total_ksh || 0}</p>
                    </div>
                    <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Total Transactions</p>
                      <p style={{ margin: 0, fontSize: '36px', fontWeight: '800', color: '#0f172a' }}>{(mySpending?.transactions || []).length}</p>
                    </div>
                  </div>
                  <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '80px 20px', textAlign: 'center' }}>
                    <Wallet style={{ width: '64px', height: '64px', color: '#cbd5e1', margin: '0 auto 16px' }} />
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Transaction History</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Your detailed spending history will appear here.</p>
                  </div>
                </motion.div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
          onClick={() => setUserMenuOpen(false)}
        />
      )}

      {/* REPORT MODAL */}
      {showReportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'white', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '560px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>Report an Issue</h3>
              <button onClick={() => setShowReportModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}>
                <X style={{ width: '24px', height: '24px', color: '#64748b' }} />
              </button>
            </div>
            <form onSubmit={submitReport} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Title <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" required value={reportForm.title} onChange={(e) => setReportForm({...reportForm, title: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }} placeholder="e.g., Leaking pipe at main junction" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Category <span style={{ color: '#ef4444' }}>*</span></label>
                  <select value={reportForm.category} onChange={(e) => setReportForm({...reportForm, category: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', background: 'white' }}>
                    <option value="leak">Leak/Burst Pipe</option>
                    <option value="contamination">Water Contamination</option>
                    <option value="dry">Dry Water Point</option>
                    <option value="other">Other Issue</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Location <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" required value={reportForm.location} onChange={(e) => setReportForm({...reportForm, location: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }} placeholder="e.g., Near Kibera Market" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Description <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea required value={reportForm.description} onChange={(e) => setReportForm({...reportForm, description: e.target.value})} rows={5} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', resize: 'vertical' }} placeholder="Describe the issue in detail..." />
              </div>
              <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                <button type="button" onClick={() => setShowReportModal(false)} style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
