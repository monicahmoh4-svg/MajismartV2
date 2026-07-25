import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import {
  Droplets, MapPin, Wallet, Bell, FileText, User, Home,
  TrendingUp, AlertTriangle, CheckCircle, Clock, Search,
  Navigation, Phone, Star, Filter, Download, Plus, Eye,
  Heart, MessageSquare, Settings, LogOut, Menu, X,
  Thermometer, Zap, Activity, Calendar, CreditCard,
  ArrowUpRight, ArrowDownRight, EyeOff, Share2, Bookmark,
  Cloud, Sun, CloudRain, Wind, Droplet, AlertCircle
} from 'lucide-react';

export default function CitizenDashboard() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Data states
  const [areaStatus, setAreaStatus] = useState(null);
  const [waterPoints, setWaterPoints] = useState([]);
  const [mySpending, setMySpending] = useState(null);
  const [myReports, setMyReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [communityReports, setCommunityReports] = useState([]);
  const [userLocation, setUserLocation] = useState({ lat: null, lng: null });
  
  // Modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({ title: '', description: '', category: 'leak', location: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAllData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    getUserLocation();
    return () => clearInterval(timer);
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log('Location access denied')
      );
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [areaData, pointsData, spendingData, reportsData, alertsData, communityData] = await Promise.all([
        api.get(`/citizen/area-status?county=${user?.county || ''}`),
        api.get(`/citizen/water-points?county=${user?.county || ''}`),
        api.get('/citizen/my-spending'),
        api.get('/reports'),
        api.get('/alerts?resolved=false&limit=5'),
        api.get('/reports')
      ]);
      
      setAreaStatus(areaData);
      setWaterPoints(Array.isArray(pointsData) ? pointsData : []);
      setMySpending(spendingData);
      setMyReports(Array.isArray(reportsData) ? reportsData.filter(r => r.user_id === user?.id) : []);
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
      await api.post('/reports', {
        ...reportForm,
        county: user?.county,
        latitude: userLocation.lat,
        longitude: userLocation.lng
      });
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
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = (date) => date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'water-points', label: 'Water Points', icon: MapPin },
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
          <div style={{ width: '60px', height: '60px', border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
          <p style={{ color: '#64748b', fontSize: '16px', fontWeight: '500' }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '280px' : '0px',
        background: 'white',
        borderRight: '1px solid #e2e8f0',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: 1000,
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        boxShadow: sidebarOpen ? '4px 0 24px rgba(0,0,0,0.1)' : 'none'
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Droplets style={{ color: 'white', width: '24px', height: '24px' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>MajiSmart</h2>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Citizen Portal</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
            </button>
          </div>
        </div>

        <nav style={{ padding: '16px 12px' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                marginBottom: '4px',
                border: 'none',
                background: activeSection === item.id ? '#eff6ff' : 'transparent',
                color: activeSection === item.id ? '#3b82f6' : '#475569',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeSection === item.id ? '600' : '500',
                transition: 'all 0.2s',
                textAlign: 'left'
              }}
            >
              <item.icon style={{ width: '20px', height: '20px' }} />
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', padding: '16px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600' }}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
            </div>
          </div>
          <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            <LogOut style={{ width: '20px', height: '20px' }} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: sidebarOpen ? '280px' : '0', transition: 'margin-left 0.3s ease' }}>
        {/* Top Bar */}
        <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}>
              <Menu style={{ width: '24px', height: '24px', color: '#0f172a' }} />
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{navItems.find(n => n.id === activeSection)?.label}</h1>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{formatDate(currentTime)}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '10px', padding: '8px 16px', gap: '8px' }}>
              <Search style={{ width: '16px', height: '16px', color: '#64748b' }} />
              <input type="text" placeholder="Search..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '180px' }} />
            </div>
            <button style={{ position: 'relative', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}>
              <Bell style={{ width: '20px', height: '20px', color: '#64748b' }} />
              {alerts.length > 0 && <span style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid white' }}></span>}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
          {activeSection === 'overview' && <OverviewSection user={user} areaStatus={areaStatus} waterPoints={waterPoints} mySpending={mySpending} alerts={alerts} currentTime={currentTime} getGreeting={getGreeting} formatTime={formatTime} setActiveSection={setActiveSection} setShowReportModal={setShowReportModal} />}
          {activeSection === 'water-points' && <WaterPointsSection waterPoints={waterPoints} userLocation={userLocation} />}
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
                <input type="text" value={reportForm.title} onChange={(e) => setReportForm({...reportForm, title: e.target.value})} required style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} placeholder="e.g., Broken pipe at Main Street" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Category</label>
                <select value={reportForm.category} onChange={(e) => setReportForm({...reportForm, category: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}>
                  <option value="leak">Water Leak</option>
                  <option value="contamination">Water Contamination</option>
                  <option value="dry_tap">Dry Tap / No Water</option>
                  <option value="infrastructure">Infrastructure Damage</option>
                  <option value="billing">Billing Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Description</label>
                <textarea value={reportForm.description} onChange={(e) => setReportForm({...reportForm, description: e.target.value})} required rows="4" style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }} placeholder="Describe the issue in detail..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Location</label>
                <input type="text" value={reportForm.location} onChange={(e) => setReportForm({...reportForm, location: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} placeholder="e.g., Near Kiosk #5, Westlands" />
              </div>
              <button type="submit" disabled={submitting} style={{ padding: '14px', background: 'linear-gradient(90deg, #3b82f6, #06b6d4)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== OVERVIEW SECTION ====================
function OverviewSection({ user, areaStatus, waterPoints, mySpending, alerts, currentTime, getGreeting, formatTime, setActiveSection, setShowReportModal }) {
  const stats = [
    { label: 'Active Nodes in Area', value: areaStatus?.active_nodes || 0, icon: Droplets, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Area Status', value: areaStatus?.status === 'alert' ? 'Alert' : 'Normal', icon: areaStatus?.status === 'alert' ? AlertTriangle : CheckCircle, color: areaStatus?.status === 'alert' ? '#f59e0b' : '#10b981', bg: areaStatus?.status === 'alert' ? '#fef3c7' : '#d1fae5' },
    { label: 'This Month Spending', value: `KES ${mySpending?.this_month?.total_ksh || 0}`, icon: Wallet, color: '#8b5cf6', bg: '#ede9fe' },
    { label: 'Active Alerts', value: alerts.length, icon: Bell, color: '#ef4444', bg: '#fee2e2' },
  ];

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%)', borderRadius: '16px', padding: '32px', marginBottom: '24px', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700' }}>{getGreeting()}, {user?.name || 'User'}!</h2>
          <p style={{ margin: '0 0 24px 0', fontSize: '16px', opacity: 0.9 }}>Here's your water network update for {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
              <MapPin style={{ width: '24px', height: '24px' }} />
              <div>
                <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Your County</p>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{user?.county || 'Not set'}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
              <Clock style={{ width: '24px', height: '24px' }} />
              <div>
                <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Current Time</p>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{formatTime(currentTime)}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
              <Droplet style={{ width: '24px', height: '24px' }} />
              <div>
                <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Water Quality</p>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{areaStatus?.safety?.label || 'Safe'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px', transition: 'transform 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ width: '52px', height: '52px', background: stat.bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <stat.icon style={{ width: '24px', height: '24px', color: stat.color }} />
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{stat.label}</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Find Water Points', icon: MapPin, color: '#3b82f6', action: () => setActiveSection('water-points') },
          { label: 'Report Issue', icon: FileText, color: '#ef4444', action: () => setShowReportModal(true) },
          { label: 'View Spending', icon: Wallet, color: '#8b5cf6', action: () => setActiveSection('spending') },
          { label: 'Check Alerts', icon: Bell, color: '#f59e0b', action: () => setActiveSection('alerts') },
        ].map((action, i) => (
          <button key={i} onClick={action.action} style={{ padding: '16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = action.color; e.currentTarget.style.background = action.color + '10'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; }}>
            <div style={{ width: '40px', height: '40px', background: action.color + '15', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <action.icon style={{ width: '20px', height: '20px', color: action.color }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Nearby Water Points */}
        <div style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Nearby Water Points</h3>
            <button onClick={() => setActiveSection('water-points')} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {waterPoints.slice(0, 4).map((point, i) => (
              <div key={i} style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: point.status === 'active' ? '#d1fae5' : '#fee2e2', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Droplets style={{ width: '20px', height: '20px', color: point.status === 'active' ? '#10b981' : '#ef4444' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{point.name}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{point.location} • {point.type}</p>
                </div>
                <span style={{ padding: '4px 10px', background: point.level_label === 'Good' ? '#d1fae5' : '#fef3c7', color: point.level_label === 'Good' ? '#059669' : '#d97706', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>{point.level_label}</span>
              </div>
            ))}
            {waterPoints.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                <MapPin style={{ width: '48px', height: '48px', margin: '0 auto 12px', color: '#94a3b8' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>No water points found in your area yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Alerts */}
        <div style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Recent Alerts</h3>
            <button onClick={() => setActiveSection('alerts')} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alerts.slice(0, 4).map((alert, i) => (
              <div key={i} style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '36px', height: '36px', background: '#fee2e2', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle style={{ width: '18px', height: '18px', color: '#ef4444' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{alert.message || 'Alert'}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{alert.node_name || 'Unknown'} • {new Date(alert.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                <CheckCircle style={{ width: '48px', height: '48px', margin: '0 auto 12px', color: '#10b981' }} />
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>No active alerts</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>All systems running smoothly</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Safety Info */}
      {areaStatus?.safety && (
        <div style={{ marginTop: '24px', padding: '20px', background: areaStatus.safety.label === 'Safe' ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : 'linear-gradient(135deg, #fef3c7, #fde68a)', borderRadius: '14px', border: `1px solid ${areaStatus.safety.label === 'Safe' ? '#6ee7b7' : '#fcd34d'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Shield style={{ width: '24px', height: '24px', color: areaStatus.safety.label === 'Safe' ? '#059669' : '#d97706' }} />
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: areaStatus.safety.label === 'Safe' ? '#065f46' : '#92400e' }}>Water Safety Advisory</h4>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: areaStatus.safety.label === 'Safe' ? '#065f46' : '#92400e' }}>{areaStatus.safety.advice}</p>
        </div>
      )}
    </div>
  );
}

// ==================== WATER POINTS SECTION ====================
function WaterPointsSection({ waterPoints, userLocation }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = waterPoints.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <div style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '10px', padding: '10px 16px', gap: '8px' }}>
            <Search style={{ width: '18px', height: '18px', color: '#64748b' }} />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search water points..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', flex: 1 }} />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', background: 'white' }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="warning">Warning</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {filtered.map((point, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', background: point.status === 'active' ? '#d1fae5' : point.status === 'warning' ? '#fef3c7' : '#fee2e2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Droplets style={{ width: '24px', height: '24px', color: point.status === 'active' ? '#10b981' : point.status === 'warning' ? '#f59e0b' : '#ef4444' }} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{point.name}</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin style={{ width: '12px', height: '12px' }} /> {point.location}
                  </p>
                </div>
              </div>
              <span style={{ padding: '4px 10px', background: point.status === 'active' ? '#d1fae5' : point.status === 'warning' ? '#fef3c7' : '#fee2e2', color: point.status === 'active' ? '#059669' : point.status === 'warning' ? '#d97706' : '#dc2626', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>{point.status}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Water Level</p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{point.water_level}%</p>
                <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${point.water_level}%`, height: '100%', background: point.water_level > 50 ? '#10b981' : point.water_level > 20 ? '#f59e0b' : '#ef4444', borderRadius: '2px' }}></div>
                </div>
              </div>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Quality</p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{point.quality_index || 85}%</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748b' }}>{point.level_label}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ flex: 1, padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Navigation style={{ width: '14px', height: '14px' }} /> Navigate
              </button>
              <button style={{ padding: '10px 14px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                <Share2 style={{ width: '16px', height: '16px', color: '#64748b' }} />
              </button>
              <button style={{ padding: '10px 14px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                <Bookmark style={{ width: '16px', height: '16px', color: '#64748b' }} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <MapPin style={{ width: '64px', height: '64px', color: '#94a3b8', margin: '0 auto 16px' }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>No water points found</h3>
          <p style={{ margin: 0, color: '#64748b' }}>Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}

// ==================== SPENDING SECTION ====================
function SpendingSection({ mySpending }) {
  const monthlyData = [
    { month: 'Jan', amount: 800 }, { month: 'Feb', amount: 1200 }, { month: 'Mar', amount: 950 },
    { month: 'Apr', amount: 1500 }, { month: 'May', amount: 1100 }, { month: 'Jun', amount: 1800 }
  ];
  const maxAmount = Math.max(...monthlyData.map(d => d.amount));

  return (
    <div>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', borderRadius: '14px', padding: '24px', color: 'white' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.9 }}>This Month</p>
          <p style={{ margin: '0 0 16px 0', fontSize: '32px', fontWeight: '700' }}>KES {mySpending?.this_month?.total_ksh || 0}</p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '11px', opacity: 0.8 }}>Litres</p>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{mySpending?.this_month?.total_litres || 0}L</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '11px', opacity: 0.8 }}>Transactions</p>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{mySpending?.this_month?.transactions || 0}</p>
            </div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' }}>Last Month</p>
          <p style={{ margin: '0 0 16px 0', fontSize: '32px', fontWeight: '700', color: '#0f172a' }}>KES {mySpending?.last_month?.total_ksh || 0}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowDownRight style={{ width: '16px', height: '16px', color: '#10b981' }} />
            <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '600' }}>15% less than this month</span>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' }}>Cost per Litre</p>
          <p style={{ margin: '0 0 16px 0', fontSize: '32px', fontWeight: '700', color: '#0f172a' }}>KES {mySpending?.this_month?.cost_per_litre || 0.50}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />
            <span style={{ fontSize: '13px', color: '#64748b' }}>Standard rate</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Spending History (Last 6 Months)</h3>
        <div style={{ height: '240px', display: 'flex', alignItems: 'flex-end', gap: '16px', padding: '20px 0' }}>
          {monthlyData.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>KES {d.amount}</span>
              <div style={{ width: '100%', height: `${(d.amount / maxAmount) * 180}px`, background: 'linear-gradient(180deg, #3b82f6, #06b6d4)', borderRadius: '8px 8px 0 0', transition: 'all 0.3s' }}></div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Recent Transactions</h3>
        {mySpending?.history && mySpending.history.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mySpending.history.map((tx, i) => (
              <div key={i} style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', background: '#d1fae5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard style={{ width: '22px', height: '22px', color: '#10b981' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{tx.node_name}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{tx.litres}L • {new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>KES {tx.amount_ksh}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{tx.mpesa_code}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <Wallet style={{ width: '48px', height: '48px', margin: '0 auto 12px', color: '#94a3b8' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>No transactions yet this month</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== REPORTS SECTION ====================
function ReportsSection({ myReports, setShowReportModal }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>My Reports</h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Track and manage your submitted reports</p>
        </div>
        <button onClick={() => setShowReportModal(true)} style={{ padding: '12px 20px', background: 'linear-gradient(90deg, #3b82f6, #06b6d4)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus style={{ width: '16px', height: '16px' }} /> New Report
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {myReports.map((report, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ padding: '4px 10px', background: report.status === 'open' ? '#fef3c7' : report.status === 'resolved' ? '#d1fae5' : '#dbeafe', color: report.status === 'open' ? '#d97706' : report.status === 'resolved' ? '#059669' : '#2563eb', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>{report.status}</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(report.created_at).toLocaleDateString()}</span>
            </div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{report.title}</h4>
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>{report.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Heart style={{ width: '12px', height: '12px' }} /> {report.upvotes || 0} upvotes
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>{report.category}</span>
            </div>
          </div>
        ))}
      </div>

      {myReports.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <FileText style={{ width: '64px', height: '64px', color: '#94a3b8', margin: '0 auto 16px' }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>No reports yet</h3>
          <p style={{ margin: '0 0 20px 0', color: '#64748b' }}>Submit your first report to help improve water services</p>
          <button onClick={() => setShowReportModal(true)} style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Create Report</button>
        </div>
      )}
    </div>
  );
}

// ==================== ALERTS SECTION ====================
function AlertsSection({ alerts }) {
  return (
    <div>
      <div style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>All Alerts ({alerts.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {alerts.map((alert, i) => (
            <div key={i} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ width: '44px', height: '44px', background: alert.severity === 'high' ? '#fee2e2' : '#fef3c7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle style={{ width: '22px', height: '22px', color: alert.severity === 'high' ? '#dc2626' : '#d97706' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>{alert.message || 'Alert'}</h4>
                  <span style={{ padding: '2px 8px', background: alert.severity === 'high' ? '#fee2e2' : '#fef3c7', color: alert.severity === 'high' ? '#dc2626' : '#d97706', borderRadius: '8px', fontSize: '11px', fontWeight: '600' }}>{alert.severity}</span>
                </div>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b' }}>{alert.node_name || 'Unknown node'} • {alert.county || 'Unknown county'}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock style={{ width: '12px', height: '12px' }} /> {new Date(alert.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {alerts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <CheckCircle style={{ width: '48px', height: '48px', margin: '0 auto 12px', color: '#10b981' }} />
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>No active alerts in your area</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== COMMUNITY SECTION ====================
function CommunitySection({ communityReports }) {
  return (
    <div>
      <div style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Community Reports</h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>See what others in your community are reporting</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {communityReports.map((report, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600' }}>
                  {(report.reporter_name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{report.reporter_name || 'Anonymous'}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{report.county} • {new Date(report.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <span style={{ padding: '4px 10px', background: report.status === 'open' ? '#fef3c7' : '#d1fae5', color: report.status === 'open' ? '#d97706' : '#059669', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>{report.status}</span>
            </div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{report.title}</h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>{report.description}</p>
            <div style={{ display: 'flex', gap: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>
                <Heart style={{ width: '14px', height: '14px' }} /> {report.upvotes || 0}
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>
                <MessageSquare style={{ width: '14px', height: '14px' }} /> Comment
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>
                <Share2 style={{ width: '14px', height: '14px' }} /> Share
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== PROFILE SECTION ====================
function ProfileSection({ user }) {
  return (
    <div>
      <div style={{ background: 'white', borderRadius: '14px', padding: '32px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: '100px', height: '100px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '40px', fontWeight: '700' }}>
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>{user?.name}</h2>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 12px', background: '#eff6ff', color: '#3b82f6', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>{user?.role}</span>
              <span style={{ padding: '4px 12px', background: '#f0fdf4', color: '#10b981', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>{user?.county} County</span>
            </div>
          </div>
          <button style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Edit Profile</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Account Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'Full Name', value: user?.name },
              { label: 'Email', value: user?.email },
              { label: 'Phone', value: user?.phone || 'Not provided' },
              { label: 'Role', value: user?.role },
              { label: 'County', value: user?.county },
              { label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 5 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>{item.label}</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { icon: Bell, label: 'Notification Preferences', desc: 'Manage alert settings' },
              { icon: Shield, label: 'Privacy & Security', desc: 'Password and 2FA' },
              { icon: MapPin, label: 'Location Settings', desc: 'Update your county' },
              { icon: Settings, label: 'App Preferences', desc: 'Theme and language' },
            ].map((item, i) => (
              <button key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                <item.icon style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{item.label}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Shield({ style }) {
  return <svg style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
}
