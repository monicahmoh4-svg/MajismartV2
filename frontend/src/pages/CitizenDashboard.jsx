import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
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
  
  // NEW: Dataset States
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
        // NEW: Fetch Datasets
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
      
      // NEW: Set Datasets
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
    { id: 'datasets', label: 'Water Data', icon: BarChart3 }, // NEW TAB
    { id: 'spending', label: 'My Spending', icon: Wallet },
    { id: 'reports', label: 'My Reports', icon: FileText },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'community', label: 'Community', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', border: '4px solid #e2e8f0', borderTop: '4px solid #0891b2', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
          <p style={{ color: '#64748b', fontSize: '16px', fontWeight: '500' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '260px' : '0px', background: 'white', borderRight: '1px solid #e2e8f0',
        position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 1000, transition: 'width 0.3s ease',
        overflow: 'hidden', boxShadow: sidebarOpen ? '4px 0 24px rgba(0,0,0,0.05)' : 'none', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Droplets style={{ color: 'white', width: '20px', height: '20px' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>MajiSmart</h2>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Citizen Portal</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="mobile-close-btn" style={{ display: 'none', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <X style={{ width: '18px', height: '18px', color: '#64748b' }} />
            </button>
          </div>
        </div>

        <nav style={{ padding: '12px', flex: 1, overflowY: 'auto' }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setActiveSection(item.id); if (window.innerWidth <= 768) setSidebarOpen(false); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', marginBottom: '4px', border: 'none',
                background: activeSection === item.id ? '#eff6ff' : 'transparent', color: activeSection === item.id ? '#0891b2' : '#475569',
                borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: activeSection === item.id ? '600' : '500', transition: 'all 0.2s', textAlign: 'left' }}>
              <item.icon style={{ width: '18px', height: '18px' }} /> {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600', fontSize: '14px' }}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
            </div>
          </div>
          <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
            <LogOut style={{ width: '16px', height: '16px' }} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: sidebarOpen ? '260px' : '0', transition: 'margin-left 0.3s ease', minHeight: '100vh', width: '100%' }}>
        <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => setSidebarOpen(true)} className="mobile-menu-btn" style={{ display: 'none', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}>
              <Menu style={{ width: '22px', height: '22px', color: '#0f172a' }} />
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: 'clamp(18px, 3vw, 22px)', fontWeight: '700', color: '#0f172a' }}>{navItems.find(n => n.id === activeSection)?.label}</h1>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="desktop-search" style={{ display: 'none', alignItems: 'center', background: '#f1f5f9', borderRadius: '8px', padding: '8px 12px', gap: '8px' }}>
              <Search style={{ width: '16px', height: '16px', color: '#64748b' }} />
              <input type="text" placeholder="Search..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '150px' }} />
            </div>
            <button style={{ position: 'relative', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}>
              <Bell style={{ width: '20px', height: '20px', color: '#64748b' }} />
              {alerts.length > 0 && <span style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid white' }}></span>}
            </button>
          </div>
        </header>

        <main style={{ padding: '24px 20px', maxWidth: '1400px', margin: '0 auto' }}>
          {activeSection === 'overview' && <OverviewSection user={user} areaStatus={areaStatus} waterPoints={waterPoints} mySpending={mySpending} alerts={alerts} currentTime={currentTime} getGreeting={getGreeting} formatTime={(d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} setActiveSection={setActiveSection} setShowReportModal={setShowReportModal} />}
          {activeSection === 'water-points' && <WaterPointsSection waterPoints={waterPoints} />}
          {activeSection === 'datasets' && <DatasetsSection waterQuality={waterQualityData} infrastructure={infrastructureData} countyStats={countyStats} />}
          {activeSection === 'spending' && <SpendingSection mySpending={mySpending} />}
          {activeSection === 'reports' && <ReportsSection myReports={myReports} setShowReportModal={setShowReportModal} />}
          {activeSection === 'alerts' && <AlertsSection alerts={alerts} />}
          {activeSection === 'community' && <CommunitySection communityReports={communityReports} />}
          {activeSection === 'profile' && <ProfileSection user={user} />}
        </main>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Report an Issue</h2>
              <button onClick={() => setShowReportModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X style={{ width: '24px', height: '24px', color: '#64748b' }} />
              </button>
            </div>
            <form onSubmit={submitReport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Issue Title</label>
                <input type="text" value={reportForm.title} onChange={(e) => setReportForm({...reportForm, title: e.target.value})} required style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Description</label>
                <textarea value={reportForm.description} onChange={(e) => setReportForm({...reportForm, description: e.target.value})} required rows="4" style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <button type="submit" disabled={submitting} style={{ padding: '14px', background: 'linear-gradient(90deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 769px) { .desktop-search { display: flex !important; } .mobile-menu-btn { display: none !important; } .mobile-close-btn { display: none !important; } }
        @media (max-width: 768px) { .desktop-search { display: none !important; } .mobile-menu-btn { display: block !important; } .mobile-close-btn { display: block !important; } }
      `}</style>
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

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', borderRadius: '16px', padding: 'clamp(20px, 4vw, 32px)', marginBottom: '24px', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: '800' }}>{getGreeting()}, {user?.name || 'User'}!</h2>
          <p style={{ margin: '0 0 20px 0', fontSize: 'clamp(14px, 2.5vw, 16px)', opacity: 0.9 }}>Here's your water network update</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', background: 'rgba(255,255,255,0.15)', borderRadius: '10px' }}>
              <MapPin style={{ width: '20px', height: '20px' }} />
              <div><p style={{ margin: 0, fontSize: '11px', opacity: 0.8 }}>County</p><p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{user?.county || 'Not set'}</p></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', background: 'rgba(255,255,255,0.15)', borderRadius: '10px' }}>
              <Clock style={{ width: '20px', height: '20px' }} />
              <div><p style={{ margin: 0, fontSize: '11px', opacity: 0.8 }}>Time</p><p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{formatTime(currentTime)}</p></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', background: 'rgba(255,255,255,0.15)', borderRadius: '10px' }}>
              <Droplet style={{ width: '20px', height: '20px' }} />
              <div><p style={{ margin: 0, fontSize: '11px', opacity: 0.8 }}>Quality</p><p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{areaStatus?.safety?.label || 'Safe'}</p></div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', background: stat.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <stat.icon style={{ width: '24px', height: '24px', color: stat.color }} />
            </div>
            <div><p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{stat.label}</p><p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{stat.value}</p></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Nearby Water Points</h3>
            <button onClick={() => setActiveSection('water-points')} style={{ background: 'transparent', border: 'none', color: '#0891b2', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {waterPoints.slice(0, 3).map((point, i) => (
              <div key={i} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', background: point.status === 'active' ? '#d1fae5' : '#fee2e2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Droplets style={{ width: '18px', height: '18px', color: point.status === 'active' ? '#10b981' : '#ef4444' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{point.name}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{point.location}</p>
                </div>
                <span style={{ padding: '3px 8px', background: point.level_label === 'Good' ? '#d1fae5' : '#fef3c7', color: point.level_label === 'Good' ? '#059669' : '#d97706', borderRadius: '6px', fontSize: '10px', fontWeight: '600', whiteSpace: 'nowrap' }}>{point.level_label}</span>
              </div>
            ))}
            {waterPoints.length === 0 && <p style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No water points found</p>}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Recent Alerts</h3>
            <button onClick={() => setActiveSection('alerts')} style={{ background: 'transparent', border: 'none', color: '#0891b2', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alerts.slice(0, 3).map((alert, i) => (
              <div key={i} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ width: '32px', height: '32px', background: '#fee2e2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle style={{ width: '16px', height: '16px', color: '#ef4444' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{alert.message || 'Alert'}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{new Date(alert.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {alerts.length === 0 && <p style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No active alerts</p>}
          </div>
        </div>
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
      <div style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '8px', padding: '10px 14px', gap: '8px' }}>
          <Search style={{ width: '18px', height: '18px', color: '#64748b' }} />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search water points..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', flex: 1 }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {filtered.map((point, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ width: '44px', height: '44px', background: point.status === 'active' ? '#d1fae5' : '#fee2e2', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Droplets style={{ width: '22px', height: '22px', color: point.status === 'active' ? '#10b981' : '#ef4444' }} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{point.name}</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{point.location}</p>
                </div>
              </div>
              <span style={{ padding: '3px 8px', background: point.status === 'active' ? '#d1fae5' : '#fee2e2', color: point.status === 'active' ? '#059669' : '#dc2626', borderRadius: '6px', fontSize: '10px', fontWeight: '600' }}>{point.status}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 2px 0', fontSize: '10px', color: '#64748b', fontWeight: '500' }}>Water Level</p>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{point.water_level}%</p>
              </div>
              <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 2px 0', fontSize: '10px', color: '#64748b', fontWeight: '500' }}>Quality</p>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{point.quality_index || 85}%</p>
              </div>
            </div>
            <button style={{ width: '100%', padding: '10px', background: '#0891b2', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Navigation style={{ width: '14px', height: '14px' }} /> Navigate
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== DATASETS SECTION (NEW) ====================
function DatasetsSection({ waterQuality, infrastructure, countyStats }) {
  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', borderRadius: '16px', padding: '24px', marginBottom: '24px', color: 'white' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '800' }}>Real-Time Water Intelligence</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>Live data aggregated from water nodes across 10 major Kenyan counties.</p>
      </div>

      {/* Water Quality by County */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Water Quality Index by County</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {waterQuality.map((item, i) => (
            <div key={i} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{item.county}</h4>
              <div style={{ marginBottom: '8px' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b' }}>Avg Quality Index</p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: parseFloat(item.avg_quality) >= 80 ? '#10b981' : '#f59e0b' }}>{parseFloat(item.avg_quality).toFixed(1)}%</p>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div><p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#64748b' }}>Total Nodes</p><p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{item.total_nodes}</p></div>
                <div><p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#64748b' }}>Active</p><p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#10b981' }}>{item.active_nodes}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Infrastructure Table */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Water Infrastructure Breakdown</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>County</th>
                <th style={{ textAlign: 'center', padding: '12px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Total</th>
                <th style={{ textAlign: 'center', padding: '12px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Boreholes</th>
                <th style={{ textAlign: 'center', padding: '12px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Wells</th>
                <th style={{ textAlign: 'center', padding: '12px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Taps</th>
              </tr>
            </thead>
            <tbody>
              {infrastructure.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{item.county}</td>
                  <td style={{ padding: '12px', fontSize: '14px', textAlign: 'center' }}>{item.total_nodes}</td>
                  <td style={{ padding: '12px', fontSize: '14px', textAlign: 'center', color: '#0891b2' }}>{item.boreholes}</td>
                  <td style={{ padding: '12px', fontSize: '14px', textAlign: 'center', color: '#8b5cf6' }}>{item.wells}</td>
                  <td style={{ padding: '12px', fontSize: '14px', textAlign: 'center', color: '#10b981' }}>{item.taps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* County Stats Grid */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>County Water Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {countyStats.map((item, i) => (
            <div key={i} style={{ padding: '16px', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{item.county}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#64748b' }}>Avg Water Level</p><p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0891b2' }}>{parseFloat(item.avg_water_level || 0).toFixed(0)}%</p></div>
                <div><p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#64748b' }}>Avg Quality</p><p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#10b981' }}>{parseFloat(item.avg_quality || 0).toFixed(0)}%</p></div>
                <div><p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#64748b' }}>Active</p><p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#10b981' }}>{item.active}</p></div>
                <div><p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#64748b' }}>Warning</p><p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#f59e0b' }}>{item.warning}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== SPENDING ====================
function SpendingSection({ mySpending }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '12px', padding: '24px', color: 'white' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', opacity: 0.9 }}>This Month</p>
          <p style={{ margin: '0 0 12px 0', fontSize: '28px', fontWeight: '800' }}>KES {mySpending?.this_month?.total_ksh || 0}</p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div><p style={{ margin: 0, fontSize: '11px', opacity: 0.8 }}>Litres</p><p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{mySpending?.this_month?.total_litres || 0}L</p></div>
            <div><p style={{ margin: 0, fontSize: '11px', opacity: 0.8 }}>Transactions</p><p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{mySpending?.this_month?.transactions || 0}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== REPORTS ====================
function ReportsSection({ myReports, setShowReportModal }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div><h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>My Reports</h2><p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Track your submitted reports</p></div>
        <button onClick={() => setShowReportModal(true)} style={{ padding: '10px 16px', background: 'linear-gradient(90deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus style={{ width: '14px', height: '14px' }} /> New Report
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {myReports.map((report, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <span style={{ padding: '3px 8px', background: report.status === 'open' ? '#fef3c7' : '#d1fae5', color: report.status === 'open' ? '#d97706' : '#059669', borderRadius: '6px', fontSize: '10px', fontWeight: '600' }}>{report.status}</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>{new Date(report.created_at).toLocaleDateString()}</span>
            </div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{report.title}</h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>{report.description}</p>
          </div>
        ))}
        {myReports.length === 0 && <p style={{ color: '#64748b' }}>No reports submitted yet.</p>}
      </div>
    </div>
  );
}

// ==================== ALERTS ====================
function AlertsSection({ alerts }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>All Alerts ({alerts.length})</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {alerts.map((alert, i) => (
          <div key={i} style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ width: '40px', height: '40px', background: alert.severity === 'high' ? '#fee2e2' : '#fef3c7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle style={{ width: '20px', height: '20px', color: alert.severity === 'high' ? '#dc2626' : '#d97706' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{alert.message || 'Alert'}</h4>
              <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#64748b' }}>{new Date(alert.created_at).toLocaleString()}</p>
            </div>
          </div>
        ))}
        {alerts.length === 0 && <p style={{ color: '#64748b' }}>No active alerts.</p>}
      </div>
    </div>
  );
}

// ==================== COMMUNITY ====================
function CommunitySection({ communityReports }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Community Reports</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {communityReports.map((report, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div><h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{report.title}</h4><p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{report.reporter_name} • {new Date(report.created_at).toLocaleDateString()}</p></div>
              <span style={{ padding: '3px 8px', background: '#eff6ff', color: '#0891b2', borderRadius: '6px', fontSize: '10px', fontWeight: '600' }}>{report.category}</span>
            </div>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>{report.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== PROFILE ====================
function ProfileSection({ user }) {
  return (
    <div>
      <div style={{ background: 'white', borderRadius: '12px', padding: '32px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '32px', fontWeight: '700' }}>
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>{user?.name}</h2>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 10px', background: '#eff6ff', color: '#0891b2', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>{user?.role}</span>
              <span style={{ padding: '4px 10px', background: '#f0fdf4', color: '#10b981', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>{user?.county} County</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Account Information</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[{ label: 'Full Name', value: user?.name }, { label: 'Email', value: user?.email }, { label: 'Phone', value: user?.phone || 'Not provided' }, { label: 'Role', value: user?.role }, { label: 'County', value: user?.county }].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>{item.label}</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
