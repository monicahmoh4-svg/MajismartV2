import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Droplets, MapPin, Activity, Shield, BarChart3, TrendingUp, 
  AlertTriangle, CheckCircle, MessageSquare, FileText, 
  Phone, Wallet, Heart, Users, LogOut, Menu, X, 
  ArrowRight, RefreshCw, Clock, Bell, Gauge, Thermometer,
  Wifi, Database, Zap, Eye, Filter, Search, Download,
  Droplet, Waves, CloudRain, Sun, Wind, Info, ChevronDown
} from 'lucide-react'

export default function CitizenDashboard() {
  const { user, logout } = useAuth()
  const [activeSection, setActiveSection] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
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
  const [viewMode, setViewMode] = useState('grid') // grid, list, map

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth > 768)
    window.addEventListener('resize', handleResize)
    handleResize()
    fetchAllData()
    
    // Auto-refresh IoT data every 30 seconds
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

  const getQualityColor = (value) => {
    if (value >= 80) return '#10b981'
    if (value >= 60) return '#f59e0b'
    return '#ef4444'
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

  // Animation variants
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
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{ width: '50px', height: '50px', border: '4px solid #e2e8f0', borderTop: '4px solid #0891b2', borderRadius: '50%' }} 
        />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f9ff', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", display: 'flex' }}>
      <style>{`
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(8, 145, 178, 0.4); } 50% { box-shadow: 0 0 20px 10px rgba(8, 145, 178, 0); } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        .card-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
        .gradient-text { background: linear-gradient(135deg, #0891b2, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.5); }
      `}</style>

      {/* Mobile Overlay */}
      {sidebarOpen && window.innerWidth <= 768 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, backdropFilter: 'blur(4px)' }} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          width: '280px', background: 'white', borderRight: '1px solid #e2e8f0',
          position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 1000,
          boxShadow: '4px 0 24px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column'
        }}
      >
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)' }}>
                <Droplets style={{ color: 'white', width: '22px', height: '22px' }} />
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
        </div>

        <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
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
            <motion.button 
              key={item.id} 
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setActiveSection(item.id); if (window.innerWidth <= 768) setSidebarOpen(false) }}
              style={{ 
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', marginBottom: '4px', border: 'none',
                background: activeSection === item.id ? 'linear-gradient(135deg, #eff6ff, #f0f9ff)' : 'transparent', 
                color: activeSection === item.id ? '#0891b2' : '#475569',
                borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: activeSection === item.id ? '600' : '500', 
                transition: 'all 0.2s', textAlign: 'left', position: 'relative'
              }}
            >
              <item.icon style={{ width: '18px', height: '18px' }} /> 
              {item.label}
              {item.badge > 0 && (
                <span style={{ position: 'absolute', right: '16px', background: '#ef4444', color: 'white', fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '10px' }}>
                  {item.badge}
                </span>
              )}
            </motion.button>
          ))}
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '12px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '18px' }}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'User'}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.county || 'Kenya'}</p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={logout} 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', border: 'none', background: 'linear-gradient(135deg, #fee2e2, #fecaca)', color: '#dc2626', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', boxShadow: '0 2px 8px rgba(220, 38, 38, 0.1)' }}
          >
            <LogOut style={{ width: '16px', height: '16px' }} /> Sign Out
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: sidebarOpen && window.innerWidth > 768 ? '280px' : '0', transition: 'margin-left 0.3s ease', minHeight: '100vh', width: '100%' }}>
        {/* Header */}
        <header style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: window.innerWidth <= 768 ? 'block' : 'none' }}>
              <Menu style={{ width: '24px', height: '24px', color: '#0f172a' }} />
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
                {activeSection === 'overview' ? 'Dashboard Overview' : 
                 activeSection === 'iot-monitoring' ? 'IoT Sensor Monitoring' :
                 activeSection === 'water-quality' ? 'Water Quality Analysis' :
                 activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              style={{ 
                background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', 
                cursor: 'pointer', padding: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                opacity: refreshing ? 0.6 : 1
              }}
            >
              <RefreshCw style={{ width: '20px', height: '20px', color: '#0891b2', animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              style={{ position: 'relative', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', padding: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              <Bell style={{ width: '20px', height: '20px', color: '#475569' }} />
              {alerts.length > 0 && (
                <span style={{ 
                  position: 'absolute', top: '6px', right: '6px', width: '10px', height: '10px', 
                  background: '#ef4444', borderRadius: '50%', border: '2px solid white',
                  animation: 'pulse-glow 2s infinite'
                }} />
              )}
            </motion.button>
          </div>
        </header>

        {/* Main Content Area */}
        <main style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeSection} variants={staggerContainer} initial="hidden" animate="visible" exit="hidden">
              
              {/* OVERVIEW SECTION */}
              {activeSection === 'overview' && (
                <>
                  {/* Quick Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    {[
                      { label: 'Water Quality Index', value: `${waterQuality.purity_level}%`, icon: Droplet, color: '#0891b2', bg: 'linear-gradient(135deg, #eff6ff, #f0f9ff)', trend: '+2.4%', trendUp: true },
                      { label: 'Active Water Points', value: waterPoints.filter(p => p.status === 'active').length, icon: MapPin, color: '#10b981', bg: 'linear-gradient(135deg, #d1fae5, #ecfdf5)', trend: '+3', trendUp: true },
                      { label: 'Monthly Spending', value: `KES ${mySpending?.this_month?.total_ksh || 0}`, icon: Wallet, color: '#8b5cf6', bg: 'linear-gradient(135deg, #ede9fe, #f5f3ff)', trend: '-5%', trendUp: true },
                      { label: 'Active Alerts', value: alerts.length, icon: AlertTriangle, color: alerts.length > 0 ? '#ef4444' : '#10b981', bg: alerts.length > 0 ? 'linear-gradient(135deg, #fee2e2, #fef2f2)' : 'linear-gradient(135deg, #d1fae5, #ecfdf5)', trend: alerts.length > 0 ? 'Action needed' : 'All clear', trendUp: alerts.length === 0 }
                    ].map((stat, i) => (
                      <motion.div key={i} variants={scaleIn} whileHover={{ y: -4 }} className="card-hover" style={{ background: stat.bg, borderRadius: '20px', padding: '24px', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <div>
                            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>{stat.label}</p>
                            <h3 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>{stat.value}</h3>
                          </div>
                          <div style={{ width: '56px', height: '56px', background: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                            <stat.icon style={{ width: '28px', height: '28px', color: stat.color }} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: stat.trendUp ? '#10b981' : '#ef4444' }}>
                          <TrendingUp style={{ width: '16px', height: '16px', transform: stat.trendUp ? 'none' : 'rotate(180deg)' }} />
                          <span>{stat.trend}</span>
                          <span style={{ color: '#94a3b8', fontWeight: '400' }}>vs last month</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* IoT Quick View & Water Points */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                    {/* IoT Sensor Snapshot */}
                    <motion.div variants={fadeInUp} className="card-hover" style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Wifi style={{ width: '24px', height: '24px', color: 'white' }} />
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Live IoT Sensors</h3>
                            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' }}>Real-time monitoring</p>
                          </div>
                        </div>
                        <button onClick={() => setActiveSection('iot-monitoring')} style={{ background: '#eff6ff', border: 'none', color: '#0891b2', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>View All</button>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        {[
                          { label: 'pH Level', value: iotReadings.ph, unit: '', icon: Droplet, color: '#0891b2', status: iotReadings.ph >= 6.5 && iotReadings.ph <= 8.5 ? 'Normal' : 'Alert' },
                          { label: 'Turbidity', value: iotReadings.turbidity, unit: 'NTU', icon: Waves, color: '#06b6d4', status: iotReadings.turbidity < 5 ? 'Good' : 'High' },
                          { label: 'TDS', value: iotReadings.tds, unit: 'ppm', icon: Database, color: '#10b981', status: iotReadings.tds < 300 ? 'Safe' : 'Elevated' },
                          { label: 'Temperature', value: iotReadings.temperature || areaStatus.temperature, unit: '°C', icon: Thermometer, color: '#f59e0b', status: 'Normal' }
                        ].map((item, i) => (
                          <div key={i} style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <item.icon style={{ width: '16px', height: '16px', color: item.color }} />
                              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{item.label}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                              <span style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{item.value}<span style={{ fontSize: '14px', color: '#64748b', marginLeft: '4px' }}>{item.unit}</span></span>
                              <span style={{ fontSize: '12px', fontWeight: '600', color: item.status === 'Normal' || item.status === 'Good' || item.status === 'Safe' ? '#10b981' : '#f59e0b', padding: '4px 8px', background: item.status === 'Normal' || item.status === 'Good' || item.status === 'Safe' ? '#d1fae5' : '#fef3c7', borderRadius: '6px' }}>{item.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Recent Water Points */}
                    <motion.div variants={fadeInUp} className="card-hover" style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin style={{ width: '24px', height: '24px', color: 'white' }} />
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Nearby Water Points</h3>
                            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' }}>{waterPoints.length} points in your area</p>
                          </div>
                        </div>
                        <button onClick={() => setActiveSection('water-points')} style={{ background: '#eff6ff', border: 'none', color: '#0891b2', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>View All</button>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {waterPoints.slice(0, 3).map((point, i) => {
                          const status = getPointStatus(point.status)
                          const StatusIcon = status.icon
                          return (
                            <div key={i} style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => { setSelectedPoint(point); setActiveSection('water-points') }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                <div style={{ width: '40px', height: '40px', background: status.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <StatusIcon style={{ width: '20px', height: '20px', color: status.color }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{point.name}</h4>
                                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{point.location}</p>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ padding: '4px 12px', background: status.bg, color: status.color, borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{status.label}</span>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>{point.water_level || 0}% water</p>
                              </div>
                            </div>
                          )
                        })}
                        {waterPoints.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                            <MapPin style={{ width: '48px', height: '48px', color: '#cbd5e1', margin: '0 auto 12px' }} />
                            <p>No water points found in your area</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>

                  {/* Alerts & Community Reports */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                    {/* Recent Alerts */}
                    <motion.div variants={fadeInUp} className="card-hover" style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '48px', height: '48px', background: alerts.length > 0 ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AlertTriangle style={{ width: '24px', height: '24px', color: 'white' }} />
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Active Alerts</h3>
                            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' }}>{alerts.length} require attention</p>
                          </div>
                        </div>
                        <button onClick={() => setActiveSection('alerts')} style={{ background: '#eff6ff', border: 'none', color: '#0891b2', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>View All</button>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {alerts.slice(0, 3).map((alert, i) => (
                          <div key={i} style={{ background: '#fff7ed', borderRadius: '12px', padding: '16px', border: '1px solid #ffedd5', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{ width: '36px', height: '36px', background: '#fef3c7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <AlertTriangle style={{ width: '18px', height: '18px', color: '#f97316' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{alert.message || 'System Alert'}</h4>
                              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b' }}>{alert.node_name || 'Nearby Area'}</p>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(alert.created_at).toLocaleString()}</span>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#ef4444', background: '#fee2e2', padding: '4px 8px', borderRadius: '6px' }}>High Priority</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {alerts.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '40px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                            <CheckCircle style={{ width: '48px', height: '48px', color: '#10b981', margin: '0 auto 12px' }} />
                            <p style={{ color: '#059669', fontWeight: '600' }}>All systems normal</p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>No active alerts at this time</p>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Community Activity */}
                    <motion.div variants={fadeInUp} className="card-hover" style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MessageSquare style={{ width: '24px', height: '24px', color: 'white' }} />
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Community Reports</h3>
                            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' }}>{communityReports.length} active reports</p>
                          </div>
                        </div>
                        <button onClick={() => { setShowReportModal(true); setActiveSection('community') }} style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FileText style={{ width: '14px', height: '14px' }} /> Report
                        </button>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {communityReports.slice(0, 3).map((report, i) => {
                          const status = getReportStatus(report.status)
                          return (
                            <div key={i} style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #f1f5f9' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#0f172a', flex: 1 }}>{report.title}</h4>
                                <span style={{ padding: '4px 10px', background: status.bg, color: status.color, borderRadius: '20px', fontSize: '11px', fontWeight: '700', marginLeft: '8px' }}>{status.label}</span>
                              </div>
                              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>{report.description}</p>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
                                <span>{report.reporter_name || 'Anonymous'} • {new Date(report.created_at).toLocaleDateString()}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Heart style={{ width: '14px', height: '14px' }} /> {report.upvotes || 0}</span>
                              </div>
                            </div>
                          )
                        })}
                        {communityReports.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                            <Users style={{ width: '48px', height: '48px', color: '#cbd5e1', margin: '0 auto 12px' }} />
                            <p>No community reports yet</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </>
              )}

              {/* IoT MONITORING SECTION */}
              {activeSection === 'iot-monitoring' && (
                <motion.div variants={staggerContainer}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>IoT Sensor Dashboard</h2>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>Real-time water quality and infrastructure monitoring</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', animation: 'pulse-glow 2s infinite' }}></span>
                        Live Data
                      </span>
                      <button onClick={handleRefresh} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 16px', fontSize: '14px', fontWeight: '600', color: '#0891b2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RefreshCw style={{ width: '16px', height: '16px', animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Refresh
                      </button>
                    </div>
                  </div>

                  {/* Main IoT Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    {[
                      { label: 'pH Level', value: iotReadings.ph, unit: '', icon: Droplet, color: '#0891b2', min: 6.5, max: 8.5, status: iotReadings.ph >= 6.5 && iotReadings.ph <= 8.5 ? 'Optimal' : 'Out of Range', desc: 'Measures acidity/alkalinity' },
                      { label: 'Turbidity', value: iotReadings.turbidity, unit: 'NTU', icon: Waves, color: '#06b6d4', min: 0, max: 5, status: iotReadings.turbidity < 5 ? 'Clear' : 'Cloudy', desc: 'Water clarity measurement' },
                      { label: 'Total Dissolved Solids', value: iotReadings.tds, unit: 'ppm', icon: Database, color: '#10b981', min: 0, max: 300, status: iotReadings.tds < 300 ? 'Safe' : 'Elevated', desc: 'Dissolved minerals and salts' },
                      { label: 'Dissolved Oxygen', value: iotReadings.dissolved_oxygen, unit: 'mg/L', icon: Wind, color: '#3b82f6', min: 6, max: 10, status: iotReadings.dissolved_oxygen >= 6 ? 'Good' : 'Low', desc: 'Oxygen available in water' },
                      { label: 'Conductivity', value: iotReadings.conductivity, unit: 'μS/cm', icon: Zap, color: '#f59e0b', min: 200, max: 500, status: 'Normal', desc: 'Water purity indicator' },
                      { label: 'Free Chlorine', value: iotReadings.chlorine, unit: 'mg/L', icon: CloudRain, color: '#ef4444', min: 0.2, max: 1.0, status: iotReadings.chlorine >= 0.2 && iotReadings.chlorine <= 1.0 ? 'Treated' : 'Check Level', desc: 'Disinfection residual' }
                    ].map((metric, i) => (
                      <motion.div key={i} variants={scaleIn} whileHover={{ y: -4 }} className="card-hover" style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '48px', height: '48px', background: `${metric.color}15`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <metric.icon style={{ width: '24px', height: '24px', color: metric.color }} />
                            </div>
                            <div>
                              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{metric.label}</h3>
                              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>{metric.desc}</p>
                            </div>
                          </div>
                          <span style={{ padding: '6px 12px', background: metric.status === 'Optimal' || metric.status === 'Clear' || metric.status === 'Safe' || metric.status === 'Good' || metric.status === 'Normal' || metric.status === 'Treated' ? '#d1fae5' : '#fef3c7', color: metric.status === 'Optimal' || metric.status === 'Clear' || metric.status === 'Safe' || metric.status === 'Good' || metric.status === 'Normal' || metric.status === 'Treated' ? '#059669' : '#d97706', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{metric.status}</span>
                        </div>
                        
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '42px', fontWeight: '800', color: '#0f172a' }}>{metric.value}</span>
                            <span style={{ fontSize: '16px', color: '#64748b', fontWeight: '600' }}>{metric.unit}</span>
                          </div>
                          
                          {/* Progress bar */}
                          <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                            <div style={{ 
                              height: '100%', 
                              width: `${Math.min(((metric.value - metric.min) / (metric.max - metric.min)) * 100, 100)}%`, 
                              background: `linear-gradient(90deg, ${metric.color}, ${metric.color}88)`,
                              borderRadius: '4px',
                              transition: 'width 0.5s ease'
                            }}></div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                            <span>{metric.min} {metric.unit}</span>
                            <span>{metric.max} {metric.unit}</span>
                          </div>
                        </div>
                        
                        <div style={{ fontSize: '12px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                          <span>Last updated: {new Date(iotReadings.last_updated).toLocaleTimeString()}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Water Quality Summary */}
                  <motion.div variants={fadeInUp} className="card-hover" style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Overall Water Quality Assessment</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: waterQuality.purity_level >= 80 ? '#d1fae5' : waterQuality.purity_level >= 60 ? '#fef3c7' : '#fee2e2', borderRadius: '20px' }}>
                        <div style={{ width: '10px', height: '10px', background: waterQuality.purity_level >= 80 ? '#10b981' : waterQuality.purity_level >= 60 ? '#f59e0b' : '#ef4444', borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: waterQuality.purity_level >= 80 ? '#059669' : waterQuality.purity_level >= 60 ? '#d97706' : '#dc2626' }}>{waterQuality.potability || 'Safe'}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                      <div style={{ textAlign: 'center', padding: '20px', background: '#f0f9ff', borderRadius: '16px' }}>
                        <div style={{ fontSize: '48px', fontWeight: '800', color: '#0891b2', marginBottom: '8px' }}>{waterQuality.purity_level}%</div>
                        <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Purity Level</p>
                      </div>
                      <div style={{ textAlign: 'center', padding: '20px', background: '#f0fdf4', borderRadius: '16px' }}>
                        <div style={{ fontSize: '48px', fontWeight: '800', color: '#10b981', marginBottom: '8px' }}>{waterQuality.safety_score}</div>
                        <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Safety Score</p>
                      </div>
                      <div style={{ textAlign: 'center', padding: '20px', background: '#fef3c7', borderRadius: '16px' }}>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b', marginBottom: '8px' }}>{waterQuality.treatment_status || 'Treated'}</div>
                        <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Treatment Status</p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* WATER QUALITY SECTION */}
              {activeSection === 'water-quality' && (
                <motion.div variants={staggerContainer}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>Water Quality Analysis</h2>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>Comprehensive water safety and purity metrics</p>
                    </div>
                    <button style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 16px', fontSize: '14px', fontWeight: '600', color: '#0891b2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Download style={{ width: '16px', height: '16px' }} /> Export Report
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                    {/* Quality Metrics */}
                    <motion.div variants={fadeInUp} className="card-hover" style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0' }}>
                      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Quality Parameters</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                          { label: 'Microbiological Safety', value: 95, color: '#10b981', status: 'Excellent' },
                          { label: 'Chemical Balance', value: 88, color: '#0891b2', status: 'Good' },
                          { label: 'Physical Clarity', value: 92, color: '#06b6d4', status: 'Excellent' },
                          { label: 'Mineral Content', value: 78, color: '#f59e0b', status: 'Acceptable' }
                        ].map((param, i) => (
                          <div key={i}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{param.label}</span>
                              <span style={{ fontSize: '14px', fontWeight: '700', color: param.color }}>{param.value}%</span>
                            </div>
                            <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${param.value}%`, background: `linear-gradient(90deg, ${param.color}, ${param.color}88)`, borderRadius: '4px' }}></div>
                            </div>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Status: {param.status}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Contaminant Detection */}
                    <motion.div variants={fadeInUp} className="card-hover" style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0' }}>
                      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Contaminant Detection</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                          { name: 'E. coli', level: 'Not Detected', status: 'safe', icon: CheckCircle },
                          { name: 'Heavy Metals', level: 'Below Limit', status: 'safe', icon: CheckCircle },
                          { name: 'Nitrates', level: '2.4 mg/L', status: 'safe', icon: CheckCircle },
                          { name: 'Pesticides', level: 'Not Detected', status: 'safe', icon: CheckCircle }
                        ].map((contaminant, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: contaminant.status === 'safe' ? '#f0fdf4' : '#fef3c7', borderRadius: '12px', border: `1px solid ${contaminant.status === 'safe' ? '#bbf7d0' : '#fde68a'}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <contaminant.icon style={{ width: '20px', height: '20px', color: contaminant.status === 'safe' ? '#10b981' : '#f59e0b' }} />
                              <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{contaminant.name}</span>
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: contaminant.status === 'safe' ? '#059669' : '#d97706' }}>{contaminant.level}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* WATER POINTS SECTION */}
              {activeSection === 'water-points' && (
                <motion.div variants={fadeInUp}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>Water Points Map</h2>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <select value={filters.quality} onChange={(e) => setFilters({...filters, quality: e.target.value})} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white', cursor: 'pointer' }}>
                        <option value="all">All Quality</option>
                        <option value="good">Good (80%+)</option>
                        <option value="caution">Caution (65-79%)</option>
                      </select>
                      <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white', cursor: 'pointer' }}>
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="warning">Low Water</option>
                        <option value="offline">Offline</option>
                      </select>
                      <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '4px' }}>
                        <button onClick={() => setViewMode('grid')} style={{ padding: '8px 12px', border: 'none', background: viewMode === 'grid' ? 'white' : 'transparent', borderRadius: '8px', fontSize: '13px', fontWeight: viewMode === 'grid' ? '600' : '500', color: viewMode === 'grid' ? '#0891b2' : '#64748b', cursor: 'pointer' }}>Grid</button>
                        <button onClick={() => setViewMode('list')} style={{ padding: '8px 12px', border: 'none', background: viewMode === 'list' ? 'white' : 'transparent', borderRadius: '8px', fontSize: '13px', fontWeight: viewMode === 'list' ? '600' : '500', color: viewMode === 'list' ? '#0891b2' : '#64748b', cursor: 'pointer' }}>List</button>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: viewMode === 'grid' ? 'grid' : 'flex', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr', gap: '20px', flexDirection: viewMode === 'list' ? 'column' : 'row' }}>
                    {filteredPoints.map((point, i) => {
                      const status = getPointStatus(point.status)
                      const StatusIcon = status.icon
                      return (
                        <motion.div key={i} variants={scaleIn} whileHover={{ y: -4 }} className="card-hover" onClick={() => setSelectedPoint(selectedPoint?.id === point.id ? null : point)} style={{ background: 'white', borderRadius: '16px', padding: '20px', border: selectedPoint?.id === point.id ? '2px solid #0891b2' : '1px solid #e2e8f0', cursor: 'pointer', boxShadow: selectedPoint?.id === point.id ? '0 8px 24px rgba(8, 145, 178, 0.15)' : '0 4px 12px rgba(0,0,0,0.06)' }}>
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
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
                              <Droplets style={{ width: '18px', height: '18px', color: '#0891b2', margin: '0 auto 4px' }} />
                              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Water</p>
                              <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{point.water_level || 0}%</p>
                            </div>
                            <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
                              <Droplet style={{ width: '18px', height: '18px', color: '#10b981', margin: '0 auto 4px' }} />
                              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Quality</p>
                              <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{point.quality_index || 0}%</p>
                            </div>
                            <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
                              <Activity style={{ width: '18px', height: '18px', color: '#f59e0b', margin: '0 auto 4px' }} />
                              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Flow</p>
                              <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{point.flow_rate || 0} L/m</p>
                            </div>
                          </div>
                          
                          {selectedPoint?.id === point.id && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                                <div>
                                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>County</p>
                                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{point.county}</p>
                                </div>
                                <div>
                                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Type</p>
                                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{point.type || 'Public'}</p>
                                </div>
                                <div>
                                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Last Updated</p>
                                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{new Date(point.updated_at).toLocaleString()}</p>
                                </div>
                                <div>
                                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Price/Liter</p>
                                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>KES {point.price_per_liter || 0.5}</p>
                                </div>
                              </div>
                            </motion.div>
                          )}
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
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowReportModal(true)} style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)' }}>
                      <FileText style={{ width: '18px', height: '18px' }} /> New Report
                    </motion.button>
                  </div>
                  <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    {myReports.length > 0 ? myReports.map((report, i) => {
                      const status = getReportStatus(report.status)
                      return (
                        <div key={i} style={{ padding: '20px', borderBottom: i === myReports.length - 1 ? 'none' : '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ flex: 1, minWidth: '250px' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{report.title}</h4>
                            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>{report.description}</p>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b', flexWrap: 'wrap' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin style={{ width: '14px', height: '14px' }} /> {report.location}</span>
                              <span>•</span>
                              <span>{new Date(report.created_at).toLocaleDateString()}</span>
                              {report.updated_at && <span>• Updated: {new Date(report.updated_at).toLocaleDateString()}</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            <span style={{ padding: '6px 16px', background: status.bg, color: status.color, borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>{status.label}</span>
                            {report.resolution_notes && (
                              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', textAlign: 'right', maxWidth: '250px' }}>{report.resolution_notes}</p>
                            )}
                          </div>
                        </div>
                      )
                    }) : (
                      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                        <FileText style={{ width: '64px', height: '64px', color: '#cbd5e1', margin: '0 auto 16px' }} />
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>No Reports Yet</h4>
                        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748b' }}>You haven't submitted any reports. Click "New Report" to get started.</p>
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
                      <motion.div key={i} variants={scaleIn} className="card-hover" style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #fee2e2', display: 'flex', gap: '16px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)' }}>
                        <div style={{ width: '56px', height: '56px', background: '#fef2f2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <AlertTriangle style={{ width: '28px', height: '28px', color: '#ef4444' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{alert.message}</h4>
                            <span style={{ padding: '4px 12px', background: '#fee2e2', color: '#dc2626', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>High Priority</span>
                          </div>
                          <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569' }}>Location: {alert.node_name || 'Nearby Area'} • {alert.node_id ? `Node ${alert.node_id}` : ''}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#64748b' }}>
                            <span>{new Date(alert.created_at).toLocaleString()}</span>
                            {alert.resolved_at && <span style={{ color: '#10b981', fontWeight: '600' }}>Resolved: {new Date(alert.resolved_at).toLocaleString()}</span>}
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
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowReportModal(true)} style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)' }}>
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
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users style={{ width: '14px', height: '14px' }} /> {report.reporter_name || 'Anonymous'}</span>
                                <span>•</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin style={{ width: '14px', height: '14px' }} /> {report.location}</span>
                                <span>•</span>
                                <span>{new Date(report.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                            <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', fontWeight: '600', padding: '6px 12px', borderRadius: '8px' }}>
                              <Heart style={{ width: '16px', height: '16px' }} /> {report.upvotes || 0} Upvotes
                            </button>
                            <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', fontWeight: '600', padding: '6px 12px', borderRadius: '8px' }}>
                              <MessageSquare style={{ width: '16px', height: '16px' }} /> Comment
                            </button>
                            <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', fontWeight: '600', padding: '6px 12px', borderRadius: '8px' }}>
                              <ArrowRight style={{ width: '16px', height: '16px' }} /> Share
                            </button>
                          </div>
                        </motion.div>
                      )
                    }) : (
                      <div style={{ background: 'white', borderRadius: '16px', padding: '80px 20px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                        <Users style={{ width: '64px', height: '64px', color: '#cbd5e1', margin: '0 auto 16px' }} />
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>No Community Reports</h4>
                        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748b' }}>Be the first to report an issue in your community.</p>
                        <button onClick={() => setShowReportModal(true)} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Submit First Report</button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* SPENDING SECTION */}
              {activeSection === 'spending' && (
                <motion.div variants={fadeInUp}>
                  <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>Water Spending History</h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '20px', padding: '24px', color: 'white', boxShadow: '0 8px 24px rgba(8, 145, 178, 0.3)' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.9, fontWeight: '600' }}>Total Spent (This Month)</p>
                      <p style={{ margin: 0, fontSize: '36px', fontWeight: '800' }}>KES {mySpending?.this_month?.total_ksh || 0}</p>
                    </div>
                    <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Total Transactions</p>
                      <p style={{ margin: 0, fontSize: '36px', fontWeight: '800', color: '#0f172a' }}>{(mySpending?.transactions || []).length}</p>
                    </div>
                    <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Average per Transaction</p>
                      <p style={{ margin: 0, fontSize: '36px', fontWeight: '800', color: '#0f172a' }}>KES {mySpending?.transactions?.length ? Math.round(mySpending.this_month.total_ksh / mySpending.transactions.length) : 0}</p>
                    </div>
                  </div>

                  <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Recent Transactions</h3>
                      <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white', cursor: 'pointer' }}>
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="90days">Last 3 Months</option>
                      </select>
                    </div>
                    {(mySpending?.transactions || []).length > 0 ? (mySpending.transactions).map((tx, i) => (
                      <div key={i} style={{ padding: '16px 20px', borderBottom: i === (mySpending.transactions).length - 1 ? 'none' : '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '48px', height: '48px', background: '#f0f9ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Wallet style={{ width: '24px', height: '24px', color: '#0891b2' }} />
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{tx.description || 'Water Purchase'}</p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>{new Date(tx.date).toLocaleDateString()} • {tx.payment_method || 'M-Pesa'}</p>
                          </div>
                        </div>
                        <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>- KES {tx.amount}</span>
                      </div>
                    )) : (
                      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                        <Wallet style={{ width: '64px', height: '64px', color: '#cbd5e1', margin: '0 auto 16px' }} />
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>No Transactions Yet</h4>
                        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Your spending history will appear here as you make payments.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>

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
                <input type="text" required value={reportForm.title} onChange={(e) => setReportForm({...reportForm, title: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' }} placeholder="e.g., Leaking pipe at main junction" onFocus={(e) => e.target.style.borderColor = '#0891b2'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Category <span style={{ color: '#ef4444' }}>*</span></label>
                  <select value={reportForm.category} onChange={(e) => setReportForm({...reportForm, category: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', background: 'white', cursor: 'pointer' }}>
                    <option value="leak">Leak/Burst Pipe</option>
                    <option value="contamination">Water Contamination</option>
                    <option value="dry">Dry Water Point</option>
                    <option value="pressure">Low Pressure</option>
                    <option value="quality">Poor Water Quality</option>
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
                <textarea required value={reportForm.description} onChange={(e) => setReportForm({...reportForm, description: e.target.value})} rows={5} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', resize: 'vertical' }} placeholder="Describe the issue in detail. Include any relevant information like when it started, severity, and impact on the community..." />
              </div>
              <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                <button type="button" onClick={() => setShowReportModal(false)} style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1, boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)' }}>
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
