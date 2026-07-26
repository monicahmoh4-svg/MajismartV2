import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Droplets, MapPin, Activity, Shield, BarChart3, TrendingUp, 
  AlertTriangle, CheckCircle, MessageSquare, FileText, 
  Wallet, Users, LogOut, Menu, X, ArrowRight, Droplet, 
  Search, Filter, RefreshCw, Clock, Gauge
} from 'lucide-react';

export default function CitizenDashboard() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  
  // 1. SAFE RESPONSIVE STATE (Prevents mobile render crashes)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);
  
  // 2. SAFE DEFAULT STATES (Prevents blank screens if API is slow)
  const [areaStatus, setAreaStatus] = useState({ active_nodes: 0, status: 'normal', safety: { label: 'Safe' } });
  const [waterPoints, setWaterPoints] = useState([]);
  const [mySpending, setMySpending] = useState({ this_month: { total_ksh: 0, total_litres: 0, transactions: 0 } });
  const [myReports, setMyReports] = useState([]);
  const [communityReports, setCommunityReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({ title: '', description: '', category: 'leak', location: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [filters, setFilters] = useState({ quality: 'all', status: 'all' });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    // Set initial state safely
    handleResize();
    
    window.addEventListener('resize', handleResize);
    fetchAllData();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []); 

  const fetchAllData = async () => {
    try {
      setLoading(true);
      // 3. PERFECT INTERCEPTOR MATCH: Your api.get already unwraps .data, so we handle the raw response directly
      const [areaData, pointsData, spendingData, reportsData, alertsData, communityData] = await Promise.all([
        api.get(`/citizen/area-status?county=${user?.county || ''}`).catch(() => ({})),
        api.get(`/citizen/water-points?county=${user?.county || ''}`).catch(() => []),
        api.get('/citizen/my-spending').catch(() => ({ this_month: { total_ksh: 0, total_litres: 0, transactions: 0 } })),
        api.get('/reports').catch(() => []),
        api.get('/alerts?resolved=false&limit=5').catch(() => []),
        api.get('/reports').catch(() => []) 
      ]);
      
      setAreaStatus(areaData || {});
      setWaterPoints(Array.isArray(pointsData) ? pointsData : []);
      setMySpending(spendingData || { this_month: { total_ksh: 0, total_litres: 0, transactions: 0 } });
      
      const allReports = Array.isArray(reportsData) ? reportsData : [];
      setMyReports(allReports.filter(r => r && r.user_id === user?.id));
      
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      setCommunityReports(Array.isArray(communityData) ? communityData : []);
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

  const getPointStatus = (status) => {
    if (status === 'active') return { label: 'Active', color: '#10b981', bg: '#d1fae5' };
    if (status === 'warning') return { label: 'Low Water', color: '#f59e0b', bg: '#fef3c7' };
    return { label: 'Offline', color: '#ef4444', bg: '#fee2e2' };
  };

  const filteredPoints = waterPoints.filter(point => {
    if (filters.quality === 'good' && (point.quality_index || 0) < 80) return false;
    if (filters.quality === 'caution' && (point.quality_index || 0) >= 80) return false;
    if (filters.status === 'active' && point.status !== 'active') return false;
    if (filters.status === 'warning' && point.status !== 'warning') return false;
    return true;
  });

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ width: '50px', height: '50px', border: '4px solid #e2e8f0', borderTop: '4px solid #0891b2', borderRadius: '50%' }} />
      </div>
    );
  }

  if (!user) {
    return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>Please log in to view your dashboard.</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', overflowX: 'hidden' }}>
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -280 }} 
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ width: '280px', background: 'white', borderRight: '1px solid #f1f5f9', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 1000, display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Droplets style={{ color: 'white', width: '20px', height: '20px' }} aria-hidden="true" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>MajiSmart</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Citizen Portal</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="show-mobile" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }} aria-label="Close sidebar">
            <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
          </button>
        </div>
        
        <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }} role="navigation" aria-label="Main navigation">
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
              onClick={() => { setActiveSection(item.id); if (isMobile) setSidebarOpen(false); }}
              aria-current={activeSection === item.id ? 'page' : undefined}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', marginBottom: '4px', border: 'none',
                background: activeSection === item.id ? '#eff6ff' : 'transparent', color: activeSection === item.id ? '#0891b2' : '#475569',
                borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: activeSection === item.id ? '600' : '500', textAlign: 'left' }}>
              <item.icon style={{ width: '18px', height: '18px' }} aria-hidden="true" /> {item.label}
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
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || 'user@example.com'}</p>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            <LogOut style={{ width: '16px', height: '16px' }} aria-hidden="true" /> Sign Out
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content - 4. SAFE MARGIN CALCULATION */}
      <div style={{ flex: 1, marginLeft: !isMobile && sidebarOpen ? '280px' : '0', transition: 'margin-left 0.3s ease', minHeight: '100vh', width: '100%' }}>
        <header style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #f1f5f9', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="show-mobile" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }} aria-label="Open sidebar">
              <Menu style={{ width: '24px', height: '24px', color: '#0f172a' }} />
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{activeSection === 'overview' ? 'Dashboard' : activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '10px', padding: '10px 16px', gap: '10px' }}>
              <Search style={{ width: '18px', height: '18px', color: '#64748b' }} aria-hidden="true" />
              <input type="text" placeholder="Search..." aria-label="Search" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '200px' }} />
            </div>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{ position: 'relative', background: 'white', border: '1px solid #f1f5f9', borderRadius: '10px', cursor: 'pointer', padding: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} aria-label="View alerts">
              <AlertTriangle style={{ width: '20px', height: '20px', color: '#475569' }} />
              {alerts.length > 0 && <span style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid white' }}></span>}
            </motion.button>
          </div>
        </header>

        <main style={{ padding: '32px 24px', maxWidth: '1400px', margin: '0 auto' }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeSection} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              
              {activeSection === 'overview' && (
                <div>
                  <div style={{ background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', borderRadius: '20px', padding: '32px', marginBottom: '32px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800' }}>{getGreeting()}, {user?.name || 'User'}!</h2>
                    <p style={{ margin: '0 0 24px 0', fontSize: '16px', opacity: 0.9 }}>Here's your water network update for today.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                      {[
                        { icon: MapPin, label: 'County', value: user?.county || 'Not set' },
                        { icon: Clock, label: 'Time', value: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
                        { icon: Droplet, label: 'Quality', value: areaStatus?.safety?.label || 'Safe' }
                      ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                          <item.icon style={{ width: '20px', height: '20px' }} aria-hidden="true" />
                          <div><p style={{ margin: 0, fontSize: '11px', opacity: 0.8 }}>{item.label}</p><p style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>{item.value}</p></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    {[
                      { label: 'Active Nodes', value: areaStatus?.active_nodes || 0, icon: Droplets, color: '#0891b2', bg: '#eff6ff' },
                      { label: 'Area Status', value: areaStatus?.status === 'alert' ? 'Alert' : 'Normal', icon: areaStatus?.status === 'alert' ? AlertTriangle : CheckCircle, color: areaStatus?.status === 'alert' ? '#f59e0b' : '#10b981', bg: areaStatus?.status === 'alert' ? '#fef3c7' : '#d1fae5' },
                      { label: 'This Month', value: `KES ${mySpending?.this_month?.total_ksh || 0}`, icon: Wallet, color: '#8b5cf6', bg: '#ede9fe' },
                      { label: 'Active Alerts', value: alerts.length, icon: AlertTriangle, color: '#ef4444', bg: '#fee2e2' }
                    ].map((stat, i) => (
                      <motion.div key={i} whileHover={{ y: -5 }} style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <div style={{ width: '52px', height: '52px', background: stat.bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <stat.icon style={{ width: '24px', height: '24px', color: stat.color }} aria-hidden="true" />
                        </div>
                        <div><p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>{stat.label}</p><p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{stat.value}</p></div>
                      </motion.div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Nearby Water Points</h3>
                        <motion.button whileHover={{ scale: 1.05 }} onClick={() => setActiveSection('water-points')} style={{ background: '#eff6ff', border: 'none', color: '#0891b2', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>View All</motion.button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {waterPoints.slice(0, 3).map((point, i) => (
                          <div key={i} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', background: getPointStatus(point.status).bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Droplets style={{ width: '20px', height: '20px', color: getPointStatus(point.status).color }} aria-hidden="true" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{point.name}</p>
                              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{point.location}</p>
                            </div>
                            <span style={{ padding: '4px 10px', background: getPointStatus(point.status).bg, color: getPointStatus(point.status).color, borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{getPointStatus(point.status).label}</span>
                          </div>
                        ))}
                        {waterPoints.length === 0 && <p style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No water points found</p>}
                      </div>
                    </div>

                    <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Recent Alerts</h3>
                        <motion.button whileHover={{ scale: 1.05 }} onClick={() => setActiveSection('alerts')} style={{ background: '#eff6ff', border: 'none', color: '#0891b2', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>View All</motion.button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {alerts.slice(0, 3).map((alert, i) => (
                          <div key={i} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{ width: '36px', height: '36px', background: '#fee2e2', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <AlertTriangle style={{ width: '18px', height: '18px', color: '#ef4444' }} aria-hidden="true" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{alert.message || 'Alert'}</p>
                              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{new Date(alert.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                        {alerts.length === 0 && <p style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No active alerts</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'water-points' && (
                <div>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: '10px', padding: '10px 16px', border: '1px solid #f1f5f9', gap: '10px' }}>
                      <Filter style={{ width: '18px', height: '18px', color: '#64748b' }} aria-hidden="true" />
                      <select value={filters.quality} onChange={(e) => setFilters({...filters, quality: e.target.value})} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', color: '#0f172a' }} aria-label="Filter by quality">
                        <option value="all">All Quality</option>
                        <option value="good">Good (80%+)</option>
                        <option value="caution">Caution (65-79%)</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: '10px', padding: '10px 16px', border: '1px solid #f1f5f9', gap: '10px' }}>
                      <Filter style={{ width: '18px', height: '18px', color: '#64748b' }} aria-hidden="true" />
                      <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', color: '#0f172a' }} aria-label="Filter by status">
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="warning">Low Water</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {filteredPoints.map((point, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}
                        style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', cursor: 'pointer' }}
                        onClick={() => setSelectedPoint(selectedPoint?.id === point.id ? null : point)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{point.name}</h4>
                          <span style={{ padding: '4px 10px', background: getPointStatus(point.status).bg, color: getPointStatus(point.status).color, borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{getPointStatus(point.status).label}</span>
                        </div>
                        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>{point.location}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px' }}><p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Water Level</p><p style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>{point.water_level || 0}%</p></div>
                          <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px' }}><p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Quality</p><p style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>{point.quality_index || 0}%</p></div>
                        </div>
                      </motion.div>
                    ))}
                    {filteredPoints.length === 0 && <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No water points match your filters.</p>}
                  </div>

                  <AnimatePresence>
                    {selectedPoint && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #f1f5f9', marginTop: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{selectedPoint.name}</h3>
                            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{selectedPoint.location} • {selectedPoint.county}</p>
                          </div>
                          <span style={{ padding: '8px 16px', background: getPointStatus(selectedPoint.status).bg, color: getPointStatus(selectedPoint.status).color, borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>{getPointStatus(selectedPoint.status).label}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                          {[
                            { label: 'Water Level', value: `${selectedPoint.water_level || 0}%`, icon: Droplets },
                            { label: 'Quality Index', value: `${selectedPoint.quality_index || 0}%`, icon: Droplet },
                            { label: 'Flow Rate', value: `${selectedPoint.flow_rate || 0} L/min`, icon: Activity },
                            { label: 'Pressure', value: `${selectedPoint.pressure || 0} PSI`, icon: Gauge }
                          ].map((item, i) => (
                            <div key={i} style={{ background: '#f0f9ff', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                              <div style={{ width: '48px', height: '48px', background: '#e0f2fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                <item.icon style={{ width: '24px', height: '24px', color: '#0891b2' }} aria-hidden="true" />
                              </div>
                              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{item.label}</p>
                              <p style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {activeSection === 'reports' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div><h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>My Reports</h2><p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Track and manage your submitted reports</p></div>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowReportModal(true)} style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)' }}>
                      <MessageSquare style={{ width: '16px', height: '16px' }} aria-hidden="true" /> New Report
                    </motion.button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {myReports.map((report, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }} style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{report.title}</h4>
                          <span style={{ padding: '4px 10px', background: report.status === 'open' ? '#fef3c7' : '#d1fae5', color: report.status === 'open' ? '#d97706' : '#059669', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{report.status}</span>
                        </div>
                        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>{report.description}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{new Date(report.created_at).toLocaleDateString()}</p>
                      </motion.div>
                    ))}
                    {myReports.length === 0 && <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No reports submitted yet.</p>}
                  </div>
                </div>
              )}

              {activeSection === 'alerts' && (
                <div>
                  <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>All Alerts ({alerts.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {alerts.map((alert, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ x: 4 }} style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', gap: '16px', alignItems: 'flex-start', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <div style={{ width: '44px', height: '44px', background: '#fee2e2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <AlertTriangle style={{ width: '22px', height: '22px', color: '#ef4444' }} aria-hidden="true" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{alert.message || 'Alert'}</h4>
                          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{alert.node_name || 'Unknown location'} • {new Date(alert.created_at).toLocaleString()}</p>
                        </div>
                      </motion.div>
                    ))}
                    {alerts.length === 0 && <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No active alerts.</p>}
                  </div>
                </div>
              )}

              {activeSection === 'community' && (
                <div>
                  <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>Community Reports</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {communityReports.map((report, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -2 }} style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div><h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{report.title}</h4><p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{report.reporter_name || 'Anonymous'} • {new Date(report.created_at).toLocaleDateString()}</p></div>
                          <span style={{ padding: '4px 12px', background: '#eff6ff', color: '#0891b2', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{report.category}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>{report.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'spending' && (
                <div>
                  <div style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '20px', padding: '32px', color: 'white', boxShadow: '0 20px 40px -10px rgba(8, 145, 178, 0.3)', marginBottom: '24px' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.9 }}>This Month Spending</p>
                    <p style={{ margin: '0 0 20px 0', fontSize: '40px', fontWeight: '800' }}>KES {mySpending?.this_month?.total_ksh || 0}</p>
                    <div style={{ display: 'flex', gap: '32px' }}>
                      <div><p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Litres Used</p><p style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>{mySpending?.this_month?.total_litres || 0}L</p></div>
                      <div><p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Transactions</p><p style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>{mySpending?.this_month?.transactions || 0}</p></div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: 'white', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Report an Issue</h2>
                <motion.button whileHover={{ rotate: 90 }} onClick={() => setShowReportModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '8px' }} aria-label="Close modal">
                  <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
                </motion.button>
              </div>
              <form onSubmit={submitReport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Issue Title</label>
                  <input type="text" value={reportForm.title} onChange={(e) => setReportForm({...reportForm, title: e.target.value})} required style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Description</label>
                  <textarea value={reportForm.description} onChange={(e) => setReportForm({...reportForm, description: e.target.value})} required rows="4" style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={submitting} 
                  style={{ padding: '14px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)' }}>
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) { .hide-mobile { display: none !important; } .show-mobile { display: block !important; } }
        @media (min-width: 769px) { .show-mobile { display: none !important; } }
      `}</style>
    </div>
  );
}
