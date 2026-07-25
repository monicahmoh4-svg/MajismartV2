import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplets, MapPin, Wallet, Bell, FileText, User, Home,
  AlertTriangle, CheckCircle, Clock, Search, Navigation,
  MessageSquare, LogOut, Menu, X, Droplet, BarChart3, Plus
} from 'lucide-react';

export default function CitizenDashboard() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [areaStatus, setAreaStatus] = useState(null);
  const [waterPoints, setWaterPoints] = useState([]);
  const [mySpending, setMySpending] = useState(null);
  const [myReports, setMyReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [communityReports, setCommunityReports] = useState([]);
  const [waterQualityData, setWaterQualityData] = useState([]);
  const [infrastructureData, setInfrastructureData] = useState([]);
  const [countyStats, setCountyStats] = useState([]);
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({ title: '', description: '', category: 'leak', location: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAllData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth > 768);
    handleResize();
    window.addEventListener('resize', handleResize);
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
    } catch (err) { console.error('Fetch error:', err); } 
    finally { setLoading(false); }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/reports', { ...reportForm, county: user?.county });
      setShowReportModal(false);
      setReportForm({ title: '', description: '', category: 'leak', location: '' });
      fetchAllData();
    } catch (err) { console.error('Report error:', err); } 
    finally { setSubmitting(false); }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'water-points', label: 'Water Points', icon: MapPin },
    { id: 'datasets', label: 'Water Data', icon: BarChart3 },
    { id: 'spending', label: 'My Spending', icon: Wallet },
    { id: 'reports', label: 'My Reports', icon: FileText },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'community', label: 'Community', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  // Page transition variants
  const pageVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.2 } }
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
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -260 }}
        animate={{ x: sidebarOpen ? 0 : -260 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          width: '260px', background: 'white', borderRight: '1px solid #f1f5f9',
          position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 1000,
          boxShadow: '4px 0 24px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column'
        }}
      >
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(8, 145, 178, 0.2)' }}>
              <Droplets style={{ color: 'white', width: '20px', height: '20px' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>MajiSmart</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Citizen Portal</p>
            </div>
          </div>
        </div>

        <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
          {navItems.map(item => (
            <motion.button 
              key={item.id} 
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveSection(item.id)}
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
              {(user?.name || 'U').charAt(0).toUpperCase()}
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
      <div style={{ flex: 1, marginLeft: sidebarOpen ? '260px' : '0', transition: 'margin-left 0.3s ease', minHeight: '100vh', width: '100%' }}>
        <header style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #f1f5f9', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{navItems.find(n => n.id === activeSection)?.label}</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '10px', padding: '10px 16px', gap: '10px' }}>
              <Search style={{ width: '18px', height: '18px', color: '#64748b' }} />
              <input type="text" placeholder="Search..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '200px' }} />
            </div>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{ position: 'relative', background: 'white', border: '1px solid #f1f5f9', borderRadius: '10px', cursor: 'pointer', padding: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <Bell style={{ width: '20px', height: '20px', color: '#475569' }} />
              {alerts.length > 0 && <span style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid white' }}></span>}
            </motion.button>
          </div>
        </header>

        <main style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {activeSection === 'overview' && <OverviewSection user={user} areaStatus={areaStatus} waterPoints={waterPoints} mySpending={mySpending} alerts={alerts} currentTime={currentTime} getGreeting={getGreeting} formatTime={(d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} setActiveSection={setActiveSection} setShowReportModal={setShowReportModal} />}
              {activeSection === 'water-points' && <WaterPointsSection waterPoints={waterPoints} />}
              {activeSection === 'datasets' && <DatasetsSection waterQuality={waterQualityData} infrastructure={infrastructureData} countyStats={countyStats} />}
              {activeSection === 'spending' && <SpendingSection mySpending={mySpending} />}
              {activeSection === 'reports' && <ReportsSection myReports={myReports} setShowReportModal={setShowReportModal} />}
              {activeSection === 'alerts' && <AlertsSection alerts={alerts} />}
              {activeSection === 'community' && <CommunitySection communityReports={communityReports} />}
              {activeSection === 'profile' && <ProfileSection user={user} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: 'white', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Report an Issue</h2>
                <motion.button whileHover={{ rotate: 90 }} onClick={() => setShowReportModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '8px' }}>
                  <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
                </motion.button>
              </div>
              <form onSubmit={submitReport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Issue Title</label>
                  <input type="text" value={reportForm.title} onChange={(e) => setReportForm({...reportForm, title: e.target.value})} required style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', transition: 'border 0.2s' }} onFocus={(e) => e.target.style.borderColor = '#0891b2'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Description</label>
                  <textarea value={reportForm.description} onChange={(e) => setReportForm({...reportForm, description: e.target.value})} required rows="4" style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }} onFocus={(e) => e.target.style.borderColor = '#0891b2'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit" disabled={submitting} 
                  style={{ padding: '14px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==================== OVERVIEW SECTION ====================
function OverviewSection({ user, areaStatus, waterPoints, mySpending, alerts, currentTime, getGreeting, formatTime, setActiveSection, setShowReportModal }) {
  const stats = [
    { label: 'Active Nodes', value: areaStatus?.active_nodes || 0, icon: Droplets, color: '#0891b2', bg: '#eff6ff' },
    { label: 'Area Status', value: areaStatus?.status === 'alert' ? 'Alert' : 'Normal', icon: areaStatus?.status === 'alert' ? AlertTriangle : CheckCircle, color: areaStatus?.status === 'alert' ? '#f59e0b' : '#10b981', bg: areaStatus?.status === 'alert' ? '#fef3c7' : '#d1fae5' },
    { label: 'This Month', value: `KES ${mySpending?.this_month?.total_ksh || 0}`, icon: Wallet, color: '#8b5cf6', bg: '#ede9fe' },
    { label: 'Active Alerts', value: alerts.length, icon: Bell, color: '#ef4444', bg: '#fee2e2' },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" } })
  };

  return (
    <div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        style={{ background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', borderRadius: '24px', padding: '32px', marginBottom: '32px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px -10px rgba(8, 145, 178, 0.3)' }}
      >
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800' }}>{getGreeting()}, {user?.name || 'User'}!</h2>
          <p style={{ margin: '0 0 24px 0', fontSize: '16px', opacity: 0.9 }}>Here's your water network update for today.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
            {[
              { icon: MapPin, label: 'County', value: user?.county || 'Not set' },
              { icon: Clock, label: 'Time', value: formatTime(currentTime) },
              { icon: Droplet, label: 'Quality', value: areaStatus?.safety?.label || 'Safe' }
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                <item.icon style={{ width: '20px', height: '20px' }} />
                <div><p style={{ margin: 0, fontSize: '11px', opacity: 0.8 }}>{item.label}</p><p style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>{item.value}</p></div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {stats.map((stat, i) => (
          <motion.div 
            key={i} custom={i} variants={cardVariants} initial="hidden" animate="visible"
            whileHover={{ y: -5, boxShadow: "0 15px 30px rgba(0,0,0,0.08)" }}
            style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
          >
            <div style={{ width: '52px', height: '52px', background: stat.bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <stat.icon style={{ width: '24px', height: '24px', color: stat.color }} />
            </div>
            <div><p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{stat.label}</p><p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{stat.value}</p></div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Nearby Water Points</h3>
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => setActiveSection('water-points')} style={{ background: '#eff6ff', border: 'none', color: '#0891b2', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>View All</motion.button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {waterPoints.slice(0, 3).map((point, i) => (
              <motion.div key={i} whileHover={{ x: 4 }} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: point.status === 'active' ? '#d1fae5' : '#fee2e2', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Droplets style={{ width: '20px', height: '20px', color: point.status === 'active' ? '#10b981' : '#ef4444' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{point.name}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{point.location}</p>
                </div>
                <span style={{ padding: '4px 10px', background: point.level_label === 'Good' ? '#d1fae5' : '#fef3c7', color: point.level_label === 'Good' ? '#059669' : '#d97706', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{point.level_label}</span>
              </motion.div>
            ))}
            {waterPoints.length === 0 && <p style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No water points found</p>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Recent Alerts</h3>
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => setActiveSection('alerts')} style={{ background: '#eff6ff', border: 'none', color: '#0891b2', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>View All</motion.button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alerts.slice(0, 3).map((alert, i) => (
              <motion.div key={i} whileHover={{ x: 4 }} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '36px', height: '36px', background: '#fee2e2', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle style={{ width: '18px', height: '18px', color: '#ef4444' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{alert.message || 'Alert'}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{new Date(alert.created_at).toLocaleDateString()}</p>
                </div>
              </motion.div>
            ))}
            {alerts.length === 0 && <p style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No active alerts</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ==================== WATER POINTS ====================
function WaterPointsSection({ waterPoints }) {
  const [searchTerm, setSearchTerm] = useState('');
  const filtered = waterPoints.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.location.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div>
      <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #f1f5f9', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: '12px', padding: '12px 16px', gap: '12px' }}>
          <Search style={{ width: '20px', height: '20px', color: '#64748b' }} />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search water points by name or location..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', flex: 1 }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {filtered.map((point, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
            style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', background: point.status === 'active' ? '#d1fae5' : '#fee2e2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Droplets style={{ width: '24px', height: '24px', color: point.status === 'active' ? '#10b981' : '#ef4444' }} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{point.name}</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{point.location}</p>
                </div>
              </div>
              <span style={{ padding: '4px 10px', background: point.status === 'active' ? '#d1fae5' : '#fee2e2', color: point.status === 'active' ? '#059669' : '#dc2626', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{point.status}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Water Level</p>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{point.water_level}%</p>
              </div>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Quality</p>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{point.quality_index || 85}%</p>
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)' }}>
              <Navigation style={{ width: '16px', height: '16px' }} /> Navigate
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ==================== DATASETS SECTION ====================
function DatasetsSection({ waterQuality, infrastructure, countyStats }) {
  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', borderRadius: '20px', padding: '32px', marginBottom: '32px', color: 'white', boxShadow: '0 20px 40px -10px rgba(8, 145, 178, 0.3)' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800' }}>Real-Time Water Intelligence</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>Live data aggregated from water nodes across 10 major Kenyan counties.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ background: 'white', borderRadius: '20px', padding: '32px', border: '1px solid #f1f5f9', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Water Quality Index by County</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {waterQuality.map((item, i) => (
            <motion.div key={i} whileHover={{ y: -4 }} style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{item.county}</h4>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Avg Quality Index</p>
              <p style={{ margin: '0 0 12px 0', fontSize: '28px', fontWeight: '800', color: parseFloat(item.avg_quality) >= 80 ? '#10b981' : '#f59e0b' }}>{parseFloat(item.avg_quality).toFixed(1)}%</p>
              <div style={{ display: 'flex', gap: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                <div><p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#64748b' }}>Total</p><p style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>{item.total_nodes}</p></div>
                <div><p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#64748b' }}>Active</p><p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#10b981' }}>{item.active_nodes}</p></div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ background: 'white', borderRadius: '20px', padding: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Water Infrastructure Breakdown</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                {['County', 'Total', 'Boreholes', 'Wells', 'Taps'].map((h, i) => (
                  <th key={i} style={{ textAlign: i === 0 ? 'left' : 'center', padding: '16px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {infrastructure.map((item, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{item.county}</td>
                  <td style={{ padding: '16px', fontSize: '14px', textAlign: 'center', fontWeight: '600' }}>{item.total_nodes}</td>
                  <td style={{ padding: '16px', fontSize: '14px', textAlign: 'center', color: '#0891b2', fontWeight: '600' }}>{item.boreholes}</td>
                  <td style={{ padding: '16px', fontSize: '14px', textAlign: 'center', color: '#8b5cf6', fontWeight: '600' }}>{item.wells}</td>
                  <td style={{ padding: '16px', fontSize: '14px', textAlign: 'center', color: '#10b981', fontWeight: '600' }}>{item.taps}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

// ==================== SPENDING ====================
function SpendingSection({ mySpending }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '20px', padding: '32px', color: 'white', boxShadow: '0 20px 40px -10px rgba(8, 145, 178, 0.3)' }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.9 }}>This Month Spending</p>
        <p style={{ margin: '0 0 20px 0', fontSize: '40px', fontWeight: '800' }}>KES {mySpending?.this_month?.total_ksh || 0}</p>
        <div style={{ display: 'flex', gap: '32px' }}>
          <div><p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Litres Used</p><p style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>{mySpending?.this_month?.total_litres || 0}L</p></div>
          <div><p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Transactions</p><p style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>{mySpending?.this_month?.transactions || 0}</p></div>
        </div>
      </div>
    </motion.div>
  );
}

// ==================== REPORTS ====================
function ReportsSection({ myReports, setShowReportModal }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div><h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>My Reports</h2><p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Track and manage your submitted reports</p></div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowReportModal(true)} style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)' }}>
          <Plus style={{ width: '16px', height: '16px' }} /> New Report
        </motion.button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {myReports.map((report, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }} style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ padding: '4px 12px', background: report.status === 'open' ? '#fef3c7' : '#d1fae5', color: report.status === 'open' ? '#d97706' : '#059669', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{report.status}</span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(report.created_at).toLocaleDateString()}</span>
            </div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{report.title}</h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>{report.description}</p>
          </motion.div>
        ))}
        {myReports.length === 0 && <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No reports submitted yet.</p>}
      </div>
    </div>
  );
}

// ==================== ALERTS ====================
function AlertsSection({ alerts }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>All Alerts ({alerts.length})</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {alerts.map((alert, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ x: 4 }} style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', gap: '16px', alignItems: 'flex-start', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '44px', height: '44px', background: alert.severity === 'high' ? '#fee2e2' : '#fef3c7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle style={{ width: '22px', height: '22px', color: alert.severity === 'high' ? '#dc2626' : '#d97706' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{alert.message || 'Alert'}</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{new Date(alert.created_at).toLocaleString()}</p>
            </div>
          </motion.div>
        ))}
        {alerts.length === 0 && <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No active alerts.</p>}
      </div>
    </div>
  );
}

// ==================== COMMUNITY ====================
function CommunitySection({ communityReports }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>Community Reports</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {communityReports.map((report, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -2 }} style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div><h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{report.title}</h4><p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{report.reporter_name} • {new Date(report.created_at).toLocaleDateString()}</p></div>
              <span style={{ padding: '4px 12px', background: '#eff6ff', color: '#0891b2', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{report.category}</span>
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>{report.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ==================== PROFILE ====================
function ProfileSection({ user }) {
  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'white', borderRadius: '20px', padding: '32px', border: '1px solid #f1f5f9', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: '88px', height: '88px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '36px', fontWeight: '800', boxShadow: '0 10px 20px rgba(8, 145, 178, 0.3)' }}>
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{user?.name}</h2>
            <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#64748b' }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ padding: '6px 14px', background: '#eff6ff', color: '#0891b2', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>{user?.role}</span>
              <span style={{ padding: '6px 14px', background: '#f0fdf4', color: '#10b981', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>{user?.county} County</span>
            </div>
          </div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ background: 'white', borderRadius: '20px', padding: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Account Information</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[{ label: 'Full Name', value: user?.name }, { label: 'Email', value: user?.email }, { label: 'Phone', value: user?.phone || 'Not provided' }, { label: 'Role', value: user?.role }, { label: 'County', value: user?.county }].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
              <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>{item.label}</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
