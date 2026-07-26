import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Droplets, MapPin, Activity, Shield, BarChart3, TrendingUp, 
  AlertTriangle, CheckCircle, MessageSquare, FileText, 
  Phone, Wallet, Heart, Users, LogOut, Menu, X, 
  ArrowRight, ArrowDown, Star, Sparkles, Droplet, 
  Search, Filter, Settings, RefreshCw, Clock 
} from 'lucide-react';

export default function CitizenDashboard() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [loading, setLoading] = useState(true);
  const [areaStatus, setAreaStatus] = useState(null);
  const [waterPoints, setWaterPoints] = useState([]);
  const [mySpending, setMySpending] = useState(null);
  const [myReports, setMyReports] = useState([]);
  const [communityReports, setCommunityReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [waterQualityData, setWaterQualityData] = useState([]);
  const [infrastructureData, setInfrastructureData] = useState([]);
  const [countyStats, setCountyStats] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({ title: '', description: '', category: 'leak', location: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({ quality: 'all', status: 'all' });
  const [mapCenter, setMapCenter] = useState({ lat: 0, lng: 0 });

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 768);
      if (window.innerWidth <= 768) setSidebarOpen(false);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    // Set map center based on user location if available
    if (user?.county === 'Nairobi') {
      setMapCenter({ lat: -1.2921, lng: 36.8219 });
    } else if (user?.county === 'Mombasa') {
      setMapCenter({ lat: -4.0435, lng: 39.6682 });
    } else {
      setMapCenter({ lat: 0.0236, lng: 37.9209 });
    }
    
    fetchAllData();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [areaData, pointsData, spendingData, reportsData, alertsData, communityData, qualityData, infraData, countyData] = await Promise.all([
        api.get(`/citizen/area-status?county=${user?.county || ''}`),
        api.get(`/citizen/water-points?county=${user?.county || ''}`),
        api.get('/citizen/my-spending'),
        api.get('/reports'),
        api.get('/alerts?resolved=false&limit=5'),
        api.get('/reports'),
        api.get('/datasets/water-quality'),
        api.get('/datasets/infrastructure'),
        api.get('/datasets/county-stats')
      ]);
      
      setAreaStatus(areaData);
      setWaterPoints(Array.isArray(pointsData) ? pointsData : []);
      setMySpending(spendingData);
      setMyReports(Array.isArray(reportsData) ? reportsData.filter(r => r.user_id === user?.id) : []);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      setCommunityReports(Array.isArray(communityData) ? communityData : []);
      setWaterQualityData(qualityData?.data || []);
      setInfrastructureData(infraData?.data || []);
      setCountyStats(countyData?.data || []);
    } catch (err) { 
      console.error('Fetch error:', err); 
    } finally { 
      setLoading(false); 
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/reports', { ...reportForm, county: user?.county });
      setShowReportModal(false);
      setReportForm({ title: '', description: '', category: 'leak', location: '' });
      fetchAllData();
    } catch (err) { 
      console.error('Report error:', err); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getWaterQualityStatus = (quality) => {
    if (quality >= 80) return { label: 'Excellent', color: '#10b981', icon: CheckCircle, bg: 'bg-green-50' };
    if (quality >= 65) return { label: 'Good', color: '#f59e0b', icon: Activity, bg: 'bg-amber-50' };
    return { label: 'Caution', color: '#ef4444', icon: AlertTriangle, bg: 'bg-red-50' };
  };

  const getPointStatus = (status) => {
    if (status === 'active') return { label: 'Active', color: '#10b981', icon: CheckCircle, bg: 'bg-green-50' };
    if (status === 'warning') return { label: 'Low Water', color: '#f59e0b', icon: AlertTriangle, bg: 'bg-amber-50' };
    return { label: 'Offline', color: '#ef4444', icon: AlertTriangle, bg: 'bg-red-50' };
  };

  const getReportStatus = (status) => {
    if (status === 'open') return { label: 'Open', color: '#f59e0b', icon: AlertTriangle, bg: 'bg-amber-50' };
    if (status === 'in_progress') return { label: 'In Progress', color: '#3b82f6', icon: Activity, bg: 'bg-blue-50' };
    return { label: 'Resolved', color: '#10b981', icon: CheckCircle, bg: 'bg-green-50' };
  };

  const filteredPoints = waterPoints.filter(point => {
    if (filters.quality === 'good' && point.quality_index < 80) return false;
    if (filters.quality === 'caution' && point.quality_index >= 80) return false;
    if (filters.status === 'active' && point.status !== 'active') return false;
    if (filters.status === 'warning' && point.status !== 'warning') return false;
    return true;
  });

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{ width: '50px', height: '50px', border: '4px solid #e2e8f0', borderTop: '4px solid #0891b2', borderRadius: '50%' }} 
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex' }}>
      {/* Mobile Overlay */}
      {sidebarOpen && window.innerWidth <= 768 && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.5)', zIndex: 999 
          }}
          onClick={() => setSidebarOpen(false)}
        />
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
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(8, 145, 178, 0.2)' }}>
                <Droplets style={{ color: 'white', width: '20px', height: '20px' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>MajiSmart</h2>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Citizen Portal</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="show-mobile"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
            >
              <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
            </button>
          </div>
        </div>

        <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'water-points', label: 'Water Points', icon: MapPin },
            { id: 'quality', label: 'Water Quality', icon: Droplet },
            { id: 'reports', label: 'My Reports', icon: FileText },
            { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
            { id: 'community', label: 'Community', icon: MessageSquare },
            { id: 'spending', label: 'Spending', icon: Wallet }
          ].map(item => (
            <motion.button 
              key={item.id} 
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setActiveSection(item.id);
                if (window.innerWidth <= 768) setSidebarOpen(false);
              }}
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
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
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
        <header style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #f1f5f9', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'fixed', top: 0, width: '100%', zIndex: 100, maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="show-mobile" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}>
              <Menu style={{ width: '24px', height: '24px', color: '#0f172a' }} />
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{activeSection === 'overview' ? 'Dashboard' : activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '10px', padding: '10px 16px', gap: '10px' }}>
              <Search style={{ width: '18px', height: '18px', color: '#64748b' }} />
              <input type="text" placeholder="Search water points..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '200px' }} />
            </div>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{ position: 'relative', background: 'white', border: '1px solid #f1f5f9', borderRadius: '10px', cursor: 'pointer', padding: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <Bell style={{ width: '20px', height: '20px', color: '#475569' }} />
              {alerts.length > 0 && <span style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid white' }}></span>}
            </motion.button>
          </div>
        </header>

        <main style={{ paddingTop: '80px', padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {activeSection === 'overview' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    <motion.div 
                      variants={fadeInUp}
                      whileHover={{ y: -5 }}
                      style={{ 
                        background: 'white', 
                        borderRadius: '20px', 
                        padding: '24px', 
                        border: '1px solid #f1f5f9', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', background: 'linear-gradient(90deg, #0891b2, #06b6d4, #06b6d4, #0891b2)' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Water Quality Today</h3>
                          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Real-time monitoring across your area</p>
                        </div>
                        <div style={{ 
                          padding: '8px 16px', 
                          background: '#f0f9ff', 
                          borderRadius: '20px',
                          display: 'flex', 
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <Droplet style={{ width: '16px', height: '16px', color: '#0891b2' }} />
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#0891b2' }}>Good</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ 
                          background: '#f0f9ff', 
                          padding: '16px', 
                          borderRadius: '12px',
                          textAlign: 'center'
                        }}>
                          <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            background: '#e0f2fe', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            margin: '0 auto 12px'
                          }}>
                            <Droplets style={{ width: '32px', height: '32px', color: '#0891b2' }} />
                          </div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Current Quality</p>
                          <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{areaStatus?.safety?.label || 'Safe'}</p>
                        </div>
                        <div style={{ 
                          background: '#f0f9ff', 
                          padding: '16px', 
                          borderRadius: '12px',
                          textAlign: 'center'
                        }}>
                          <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            background: '#e0f2fe', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            margin: '0 auto 12px'
                          }}>
                            <Activity style={{ width: '32px', height: '32px', color: '#0891b2' }} />
                          </div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Water Level</p>
                          <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{areaStatus?.water_level}%</p>
                        </div>
                      </div>
                      
                      <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>Water Quality Index</h4>
                          <div style={{ 
                            padding: '4px 12px', 
                            background: '#e0f2fe', 
                            borderRadius: '20px',
                            display: 'flex', 
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#0891b2' }}>85%</span>
                          </div>
                        </div>
                        <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: '85%', background: 'linear-gradient(90deg, #0891b2, #06b6d4)', borderRadius: '4px' }}></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>Poor</span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>Excellent</span>
                        </div>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      variants={fadeInUp}
                      whileHover={{ y: -5 }}
                      style={{ 
                        background: 'white', 
                        borderRadius: '20px', 
                        padding: '24px', 
                        border: '1px solid #f1f5f9', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', background: 'linear-gradient(90deg, #06b6d4, #0891b2, #0891b2, #06b6d4)' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Area Status</h3>
                          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Your local water network health</p>
                        </div>
                        <div style={{ 
                          padding: '8px 16px', 
                          borderRadius: '20px',
                          display: 'flex', 
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {areaStatus?.status === 'alert' ? (
                            <AlertTriangle style={{ width: '16px', height: '16px', color: '#ef4444' }} />
                          ) : (
                            <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />
                          )}
                          <span style={{ 
                            fontSize: '13px', 
                            fontWeight: '600',
                            color: areaStatus?.status === 'alert' ? '#ef4444' : '#10b981'
                          }}>
                            {areaStatus?.status === 'alert' ? 'Alert' : 'Normal'}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ 
                          background: '#f0f9ff', 
                          padding: '16px', 
                          borderRadius: '12px',
                          textAlign: 'center'
                        }}>
                          <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            background: '#e0f2fe', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            margin: '0 auto 12px'
                          }}>
                            <Users style={{ width: '32px', height: '32px', color: '#0891b2' }} />
                          </div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Active Nodes</p>
                          <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{areaStatus?.active_nodes || 0}</p>
                        </div>
                        <div style={{ 
                          background: '#f0f9ff', 
                          padding: '16px', 
                          borderRadius: '12px',
                          textAlign: 'center'
                        }}>
                          <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            background: '#e0f2fe', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            margin: '0 auto 12px'
                          }}>
                            <Shield style={{ width: '32px', height: '32px', color: '#0891b2' }} />
                          </div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Verified Data</p>
                          <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>100%</p>
                        </div>
                      </div>
                      
                      <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>Network Health</h4>
                          <div style={{ 
                            padding: '4px 12px', 
                            borderRadius: '20px',
                            display: 'flex', 
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#10b981' }}>Good</span>
                          </div>
                        </div>
                        <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: '92%', background: 'linear-gradient(90deg, #0891b2, #06b6d4)', borderRadius: '4px' }}></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>Poor</span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>Excellent</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    <motion.div 
                      variants={fadeInUp}
                      whileHover={{ y: -5 }}
                      style={{ 
                        background: 'white', 
                        borderRadius: '20px', 
                        padding: '24px', 
                        border: '1px solid #f1f5f9', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', background: 'linear-gradient(90deg, #0891b2, #06b6d4, #06b6d4, #0891b2)' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Nearby Water Points</h3>
                          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Find functional water points near you</p>
                        </div>
                        <div style={{ 
                          padding: '8px 16px', 
                          background: '#f0f9ff', 
                          borderRadius: '20px',
                          display: 'flex', 
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <MapPin style={{ width: '16px', height: '16px', color: '#0891b2' }} />
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#0891b2' }}>{waterPoints.length}</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ 
                          background: '#f0f9ff', 
                          padding: '16px', 
                          borderRadius: '12px',
                          textAlign: 'center'
                        }}>
                          <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            background: '#e0f2fe', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            margin: '0 auto 12px'
                          }}>
                            <CheckCircle style={{ width: '32px', height: '32px', color: '#0891b2' }} />
                          </div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Active Points</p>
                          <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{waterPoints.filter(p => p.status === 'active').length}</p>
                        </div>
                        <div style={{ 
                          background: '#f0f9ff', 
                          padding: '16px', 
                          borderRadius: '12px',
                          textAlign: 'center'
                        }}>
                          <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            background: '#e0f2fe', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            margin: '0 auto 12px'
                          }}>
                            <AlertTriangle style={{ width: '32px', height: '32px', color: '#0891b2' }} />
                          </div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Needs Attention</p>
                          <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{waterPoints.filter(p => p.status !== 'active').length}</p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                        {waterPoints.slice(0, 2).map((point, i) => (
                          <div key={i} style={{ 
                            background: '#f8fafc', 
                            borderRadius: '16px', 
                            padding: '16px', 
                            border: '1px solid #f1f5f9' 
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>{point.name}</h4>
                              <span style={{ 
                                padding: '4px 12px', 
                                background: getPointStatus(point.status).bg, 
                                color: getPointStatus(point.status).color,
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}>
                                {getPointStatus(point.status).label}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                              <div>
                                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Water Level</p>
                                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{point.water_level}%</p>
                              </div>
                              <div>
                                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Quality</p>
                                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{point.quality_index}%</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <motion.button 
                        whileHover={{ scale: 1.02 }} 
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveSection('water-points')}
                        style={{ 
                          width: '100%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '8px',
                          padding: '12px', 
                          background: 'linear-gradient(135deg, #0891b2, #06b6d4)', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '12px', 
                          fontWeight: '600', 
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}
                      >
                        View All Water Points <ArrowRight style={{ width: '16px', height: '16px' }} />
                      </motion.button>
                    </motion.div>
                    
                    <motion.div 
                      variants={fadeInUp}
                      whileHover={{ y: -5 }}
                      style={{ 
                        background: 'white', 
                        borderRadius: '20px', 
                        padding: '24px', 
                        border: '1px solid #f1f5f9', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', background: 'linear-gradient(90deg, #06b6d4, #0891b2, #0891b2, #06b6d4)' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Community Reports</h3>
                          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Help improve water access in your community</p>
                        </div>
                        <div style={{ 
                          padding: '8px 16px', 
                          background: '#f0f9ff', 
                          borderRadius: '20px',
                          display: 'flex', 
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <FileText style={{ width: '16px', height: '16px', color: '#0891b2' }} />
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#0891b2' }}>{communityReports.length}</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ 
                          background: '#f0f9ff', 
                          padding: '16px', 
                          borderRadius: '12px',
                          textAlign: 'center'
                        }}>
                          <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            background: '#e0f2fe', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            margin: '0 auto 12px'
                          }}>
                            <MessageSquare style={{ width: '32px', height: '32px', color: '#0891b2' }} />
                          </div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Your Reports</p>
                          <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{myReports.length}</p>
                        </div>
                        <div style={{ 
                          background: '#f0f9ff', 
                          padding: '16px', 
                          borderRadius: '12px',
                          textAlign: 'center'
                        }}>
                          <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            background: '#e0f2fe', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            margin: '0 auto 12px'
                          }}>
                            <Star style={{ width: '32px', height: '32px', color: '#0891b2' }} />
                          </div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Community Votes</p>
                          <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{communityReports.reduce((sum, r) => sum + r.upvotes, 0)}</p>
                        </div>
                      </div>
                      
                      <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px', border: '1px solid #f1f5f9', marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>Recent Community Reports</h4>
                        {communityReports.slice(0, 2).map((report, i) => (
                          <div key={i} style={{ 
                            background: 'white', 
                            padding: '12px', 
                            borderRadius: '12px', 
                            marginBottom: '12px', 
                            border: '1px solid #f1f5f9' 
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{report.title}</h5>
                              <span style={{ 
                                padding: '4px 12px', 
                                background: getReportStatus(report.status).bg, 
                                color: getReportStatus(report.status).color,
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}>
                                {getReportStatus(report.status).label}
                              </span>
                            </div>
                            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#475569', lineHeight: '1.4' }}>{report.description}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                              <span>{report.reporter_name} • {new Date(report.created_at).toLocaleDateString()}</span>
                              <span>↑ {report.upvotes}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <motion.button 
                        whileHover={{ scale: 1.02 }} 
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowReportModal(true)}
                        style={{ 
                          width: '100%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '8px',
                          padding: '12px', 
                          background: 'linear-gradient(135deg, #0891b2, #06b6d4)', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '12px', 
                          fontWeight: '600', 
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}
                      >
                        Report an Issue <ArrowRight style={{ width: '16px', height: '16px' }} />
                      </motion.button>
                    </motion.div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    <motion.div 
                      variants={fadeInUp}
                      whileHover={{ y: -5 }}
                      style={{ 
                        background: 'white', 
                        borderRadius: '20px', 
                        padding: '24px', 
                        border: '1px solid #f1f5f9', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', background: 'linear-gradient(90deg, #0891b2, #06b6d4, #06b6d4, #0891b2)' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Your Water Usage</h3>
                          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Track your water consumption and spending</p>
                        </div>
                        <div style={{ 
                          padding: '8px 16px', 
                          background: '#f0f9ff', 
                          borderRadius: '20px',
                          display: 'flex', 
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <Wallet style={{ width: '16px', height: '16px', color: '#0891b2' }} />
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#0891b2' }}>KES {mySpending?.this_month?.total_ksh || 0}</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ 
                          background: '#f0f9ff', 
                          padding: '16px', 
                          borderRadius: '12px',
                          textAlign: 'center'
                        }}>
                          <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            background: '#e0f2fe', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            margin: '0 auto 12px'
                          }}>
                            <TrendingUp style={{ width: '32px', height: '32px', color: '#0891b2' }} />
                          </div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Current Month</p>
                          <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>KES {mySpending?.this_month?.total_ksh || 0}</p>
                        </div>
                        <div style={{ 
                          background: '#f0f9ff', 
                          padding: '16px', 
                          borderRadius: '12px',
                          textAlign: 'center'
                        }}>
                          <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            background: '#e0f2fe', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            margin: '0 auto 12px'
                          }}>
                            <Heart style={{ width: '32px', height: '32px', color: '#0891b2' }} />
                          </div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Conservation Goal</p>
                          <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>15%</p>
                        </div>
                      </div>
                      
                      <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px', border: '1px solid #f1f5f9', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>Monthly Spending</h4>
                          <div style={{ 
                            padding: '4px 12px', 
                            background: '#e0f2fe', 
                            borderRadius: '20px',
                            display: 'flex', 
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#0891b2' }}>Last 6 months</span>
                          </div>
                        </div>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(6, 1fr)', 
                          gap: '8px',
                          height: '100px',
                          alignItems: 'flex-end'
                        }}>
                          {[25, 45, 30, 60, 70, 85].map((value, i) => (
                            <div 
                              key={i}
                              style={{ 
                                width: '100%', 
                                background: 'linear-gradient(180deg, #0891b2 0%, #06b6d4 100%)',
                                height: `${value}px`,
                                borderRadius: '4px 4px 0 0'
                              }}
                            />
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month) => (
                            <span key={month}>{month}</span>
                          ))}
                        </div>
                      </div>
                      
                      <motion.button 
                        whileHover={{ scale: 1.02 }} 
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveSection('spending')}
                        style={{ 
                          width: '100%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '8px',
                          padding: '12px', 
                          background: 'linear-gradient(135deg, #0891b2, #06b6d4)', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '12px', 
                          fontWeight: '600', 
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}
                      >
                        View Spending History <ArrowRight style={{ width: '16px', height: '16px' }} />
                      </motion.button>
                    </motion.div>
                    
                    <motion.div 
                      variants={fadeInUp}
                      whileHover={{ y: -5 }}
                      style={{ 
                        background: 'white', 
                        borderRadius: '20px', 
                        padding: '24px', 
                        border: '1px solid #f1f5f9', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', background: 'linear-gradient(90deg, #06b6d4, #0891b2, #0891b2, #06b6d4)' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>System Alerts</h3>
                          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Stay informed about water issues near you</p>
                        </div>
                        <div style={{ 
                          padding: '8px 16px', 
                          background: '#f0f9ff', 
                          borderRadius: '20px',
                          display: 'flex', 
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <AlertTriangle style={{ width: '16px', height: '16px', color: '#0891b2' }} />
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#0891b2' }}>{alerts.length}</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ 
                          background: '#f0f9ff', 
                          padding: '16px', 
                          borderRadius: '12px',
                          textAlign: 'center'
                        }}>
                          <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            background: '#e0f2fe', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            margin: '0 auto 12px'
                          }}>
                            <Clock style={{ width: '32px', height: '32px', color: '#0891b2' }} />
                          </div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Active Alerts</p>
                          <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{alerts.length}</p>
                        </div>
                        <div style={{ 
                          background: '#f0f9ff', 
                          padding: '16px', 
                          borderRadius: '12px',
                          textAlign: 'center'
                        }}>
                          <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            background: '#e0f2fe', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            margin: '0 auto 12px'
                          }}>
                            <RefreshCw style={{ width: '32px', height: '32px', color: '#0891b2' }} />
                          </div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Resolved</p>
                          <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>12</p>
                        </div>
                      </div>
                      
                      <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px', border: '1px solid #f1f5f9', marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>Current Alerts</h4>
                        {alerts.slice(0, 2).map((alert, i) => (
                          <div key={i} style={{ 
                            background: '#fff7ed', 
                            padding: '16px', 
                            borderRadius: '12px', 
                            marginBottom: '12px', 
                            border: '1px solid #fdba74' 
                          }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                              <div style={{ 
                                width: '40px', 
                                height: '40px', 
                                background: '#fef3c7', 
                                borderRadius: '10px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center' 
                              }}>
                                <AlertTriangle style={{ width: '20px', height: '20px', color: '#d97706' }} />
                              </div>
                              <div>
                                <h5 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>{alert.message}</h5>
                                <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.4' }}>Location: {alert.node_name || 'Nearby'}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                                  <span>{new Date(alert.created_at).toLocaleString()}</span>
                                  <span>Priority: High</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <motion.button 
                        whileHover={{ scale: 1.02 }} 
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveSection('alerts')}
                        style={{ 
                          width: '100%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '8px',
                          padding: '12px', 
                          background: 'linear-gradient(135deg, #0891b2, #06b6d4)', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '12px', 
                          fontWeight: '600', 
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}
                      >
                        View All Alerts <ArrowRight style={{ width: '16px', height: '16px' }} />
                      </motion.button>
                    </motion.div>
                  </div>
                </div>
              )}

              {activeSection === 'water-points' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                    <div style={{ 
                      background: 'white', 
                      borderRadius: '16px', 
                      padding: '20px', 
                      border: '1px solid #f1f5f9',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Water Points Map</h3>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button style={{ 
                            background: '#f8fafc', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '8px', 
                            padding: '8px 16px', 
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}>Show Filters</button>
                          <button style={{ 
                            background: 'linear-gradient(135deg, #0891b2, #06b6d4)', 
                            border: 'none', 
                            borderRadius: '8px', 
                            padding: '8px 16px', 
                            color: 'white',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}>Refresh</button>
                        </div>
                      </div>
                      
                      <div style={{ 
                        background: '#f1f5f9', 
                        borderRadius: '12px', 
                        overflow: 'hidden', 
                        height: '400px',
                        position: 'relative'
                      }}>
                        <div style={{ 
                          position: 'absolute', 
                          top: 0, 
                          left: 0, 
                          right: 0, 
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                          color: 'white'
                        }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ 
                              width: '200px', 
                              height: '200px', 
                              background: 'rgba(255,255,255,0.2)', 
                              borderRadius: '50%',
                              marginBottom: '20px'
                            }}></div>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>Interactive Map</h4>
                            <p style={{ margin: 0, fontSize: '16px', opacity: 0.8 }}>View water points on a map</p>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginTop: '16px',
                        fontSize: '14px',
                        color: '#64748b'
                      }}>
                        <div>
                          <span style={{ 
                            width: '12px', 
                            height: '12px', 
                            background: '#10b981', 
                            borderRadius: '50%', 
                            display: 'inline-block', 
                            marginRight: '8px' 
                          }}></span>
                          <span>Active Points</span>
                        </div>
                        <div>
                          <span style={{ 
                            width: '12px', 
                            height: '12px', 
                            background: '#f59e0b', 
                            borderRadius: '50%', 
                            display: 'inline-block', 
                            marginRight: '8px' 
                          }}></span>
                          <span>Low Water</span>
                        </div>
                        <div>
                          <span style={{ 
                            width: '12px', 
                            height: '12px', 
                            background: '#ef4444', 
                            borderRadius: '50%', 
                            display: 'inline-block', 
                            marginRight: '8px' 
                          }}></span>
                          <span>Offline</span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ 
                      background: 'white', 
                      borderRadius: '16px', 
                      padding: '20px', 
                      border: '1px solid #f1f5f9',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Water Points</h3>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            background: '#f8fafc', 
                            borderRadius: '8px',
                            padding: '8px 12px'
                          }}>
                            <Filter style={{ width: '16px', height: '16px', color: '#64748b', marginRight: '8px' }} />
                            <select 
                              value={filters.quality}
                              onChange={(e) => setFilters({...filters, quality: e.target.value})}
                              style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                outline: 'none', 
                                fontSize: '14px', 
                                color: '#0f172a' 
                              }}
                            >
                              <option value="all">All Quality</option>
                              <option value="good">Good (80%+)</option>
                              <option value="caution">Caution (65-79%)</option>
                            </select>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            background: '#f8fafc', 
                            borderRadius: '8px',
                            padding: '8px 12px'
                          }}>
                            <Filter style={{ width: '16px', height: '16px', color: '#64748b', marginRight: '8px' }} />
                            <select 
                              value={filters.status}
                              onChange={(e) => setFilters({...filters, status: e.target.value})}
                              style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                outline: 'none', 
                                fontSize: '14px', 
                                color: '#0f172a' 
                              }}
                            >
                              <option value="all">All Status</option>
                              <option value="active">Active</option>
                              <option value="warning">Low Water</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                        gap: '16px',
                        marginBottom: '20px'
                      }}>
                        {filteredPoints.map((point, i) => (
                          <div 
                            key={i} 
                            style={{ 
                              background: '#f8fafc', 
                              borderRadius: '16px', 
                              padding: '16px', 
                              border: '1px solid #f1f5f9',
                              cursor: 'pointer'
                            }}
                            onClick={() => setSelectedPoint(point)}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>{point.name}</h4>
                              <span style={{ 
                                padding: '4px 12px', 
                                background: getPointStatus(point.status).bg, 
                                color: getPointStatus(point.status).color,
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}>
                                {getPointStatus(point.status).label}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#475569', marginBottom: '8px' }}>
                              <div>
                                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Water Level</p>
                                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{point.water_level}%</p>
                              </div>
                              <div>
                                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Quality</p>
                                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{point.quality_index}%</p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                              <span>{point.location}</span>
                              <span>{point.county}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {filteredPoints.length === 0 && (
                        <div style={{ 
                          background: '#f8fafc', 
                          borderRadius: '16px', 
                          padding: '32px', 
                          border: '1px solid #f1f5f9',
                          textAlign: 'center'
                        }}>
                          <div style={{ 
                            width: '60px', 
                            height: '60px', 
                            background: '#f0f9ff', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            color: '#0891b2'
                          }}>
                            <Search style={{ width: '32px', height: '32px' }} />
                          </div>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>No Water Points Found</h4>
                          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Adjust your filters or try a different location</p>
                        </div>
                      )}
                      
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: '12px',
                        marginTop: '20px'
                      }}>
                        <button style={{ 
                          background: '#f8fafc', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '8px', 
                          padding: '10px 20px', 
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}>Previous</button>
                        <button style={{ 
                          background: 'linear-gradient(135deg, #0891b2, #06b6d4)', 
                          border: 'none', 
                          borderRadius: '8px', 
                          padding: '10px 20px', 
                          color: 'white',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}>Next</button>
                      </div>
                    </div>
                  </div>
                  
                  {selectedPoint && (
                    <motion.div 
                      variants={fadeInUp}
                      style={{ 
                        background: 'white', 
                        borderRadius: '20px', 
                        padding: '24px', 
                        border: '1px solid #f1f5f9', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                        marginTop: '24px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{selectedPoint.name}</h3>
                          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{selectedPoint.location} • {selectedPoint.county}</p>
                        </div>
                        <div style={{ 
                          padding: '8px 16px', 
                          background: getPointStatus(selectedPoint.status).bg, 
                          color: getPointStatus(selectedPoint.status).color,
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '600'
                        }}>
                          {getPointStatus(selectedPoint.status).label}
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                        <div style={{ 
                          background: '#f0f9ff', 
                          padding: '16px', 
                          borderRadius: '12px',
                          textAlign: 'center'
                        }}>
                          <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            background: '#e0f2fe', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            margin: '0 auto 12px'
                          }}>
                            <Droplets style={{ width: '32px', height: '32px', color: '#0891b2' }} />
                          </div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Water Level</p>
                          <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{selectedPoint.water_level}%</p>
                        </div>
                        <div style={{ 
                          background: '#f0f9ff', 
                          padding: '16px', 
                          borderRadius: '12px',
                          textAlign: 'center'
                        }}>
                          <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            background: '#e0f2fe', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            margin: '0 auto 12px'
                          }}>
                            <Droplet style={{ width: '32px', height: '32px', color: '#0891b2' }} />
                          </div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Quality Index</p>
                          <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{selectedPoint.quality_index}%</p>
                        </div>
                        <div style={{ 
                          background: '#f0f9ff', 
                          padding: '16px', 
                          borderRadius: '12px',
                          textAlign: 'center'
                        }}>
                          <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            background: '#e0f2fe', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            margin: '0 auto 12px'
                          }}>
                            <Activity style={{ width: '32px', height: '32px', color: '#0891b2' }} />
                          </div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Flow Rate</p>
                          <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{selectedPoint.flow_rate} L/min</p>
                        </div>
                        <div style={{ 
                          background: '#f0f9ff', 
                          padding: '16px', 
                          borderRadius: '12px',
                          textAlign: 'center'
                        }}>
                          <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            background: '#e0f2fe', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            margin: '0 auto 12px'
                          }}>
                            <Shield style={{ width: '32px', height: '32px', color: '#0891b2' }} />
                          </div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Pressure</p>
                          <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{selectedPoint.pressure} PSI</p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>Water Quality History</h4>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          background: '#f8fafc', 
                          borderRadius: '8px',
                          padding: '8px 12px'
                        }}>
                          <Filter style={{ width: '16px', height: '16px', color: '#64748b', marginRight::
