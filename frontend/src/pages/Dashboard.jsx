import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Droplets, Users, AlertTriangle, Activity, Shield, LogOut, Menu, 
  BarChart3, MapPin, FileText, Wrench, CheckCircle, AlertCircle 
} from 'lucide-react';
import CitizenDashboard from './CitizenDashboard.jsx';

export default function Dashboard() {
  const { user, logout } = useAuth();
  
  // Citizens get their own dedicated dashboard
  if (!user || user.role === 'citizen' || !user.role) {
    return <CitizenDashboard />;
  }

  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({ nodes: { total: 0, active: 0, warning: 0, offline: 0 } });
  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    fetchData();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (user.role === 'admin') {
        const [statsData, usersData, alertsData] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/users'),
          api.get('/alerts?limit=10')
        ]);
        setStats(statsData);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setAlerts(Array.isArray(alertsData) ? alertsData : []);
      } else {
        const [nodesData, reportsData] = await Promise.all([api.get('/nodes'), api.get('/reports')]);
        const allNodes = Array.isArray(nodesData) ? nodesData : [];
        const allReports = Array.isArray(reportsData) ? reportsData : [];
        
        if (user.role === 'county_officer') {
          setNodes(user?.county ? allNodes.filter(n => n.county === user.county) : allNodes);
          setReports(user?.county ? allReports.filter(r => r.county === user.county) : allReports);
        } else if (user.role === 'operator') {
          setNodes(allNodes.slice(0, 5)); // Demo: show first 5 nodes for operator
          setReports([]);
        }
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const getNavItems = () => {
    if (user.role === 'admin') return [
      { id: 'overview', label: 'System Overview', icon: BarChart3 },
      { id: 'users', label: 'User Management', icon: Users },
      { id: 'alerts', label: 'System Alerts', icon: AlertTriangle },
    ];
    if (user.role === 'county_officer') return [
      { id: 'overview', label: 'County Overview', icon: Activity },
      { id: 'nodes', label: 'Water Nodes', icon: MapPin },
      { id: 'reports', label: 'Community Reports', icon: FileText },
    ];
    if (user.role === 'operator') return [
      { id: 'overview', label: 'My Stations', icon: Activity },
      { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    ];
    return [];
  };

  const navItems = getNavItems();

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #0891b2', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div></div>;

  const getRoleTitle = () => {
    if (user.role === 'admin') return 'Admin Console';
    if (user.role === 'county_officer') return `${user?.county || 'County'} Officer`;
    if (user.role === 'operator') return 'Operator Panel';
    return 'Dashboard';
  };

  const getRoleIcon = () => {
    if (user.role === 'admin') return <Shield style={{ color: 'white', width: '20px', height: '20px' }} />;
    if (user.role === 'county_officer') return <MapPin style={{ color: 'white', width: '20px', height: '20px' }} />;
    return <Wrench style={{ color: 'white', width: '20px', height: '20px' }} />;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex' }}>
      <motion.aside animate={{ x: sidebarOpen ? 0 : -280 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ width: '280px', background: 'white', borderRight: '1px solid #f1f5f9', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {getRoleIcon()}
            </div>
            <div><h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>MajiSmart</h2><p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{getRoleTitle()}</p></div>
          </div>
        </div>
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {navItems.map(item => (
            <motion.button key={item.id} whileHover={{ x: 4 }} onClick={() => setActiveSection(item.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', marginBottom: '4px', border: 'none',
                background: activeSection === item.id ? '#eff6ff' : 'transparent', color: activeSection === item.id ? '#0891b2' : '#475569',
                borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: activeSection === item.id ? '600' : '500', textAlign: 'left' }}>
              <item.icon style={{ width: '18px', height: '18px' }} /> {item.label}
            </motion.button>
          ))}
        </nav>
        <div style={{ padding: '20px', borderTop: '1px solid #f1f5f9' }}>
          <motion.button whileHover={{ scale: 1.02 }} onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            <LogOut style={{ width: '16px', height: '16px' }} /> Sign Out
          </motion.button>
        </div>
      </motion.aside>

      <div style={{ flex: 1, marginLeft: sidebarOpen ? '280px' : '0', transition: 'margin-left 0.3s ease', minHeight: '100vh' }}>
        <header style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #f1f5f9', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{navItems.find(n => n.id === activeSection)?.label}</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Welcome back, {user?.name}</p>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="show-mobile" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><Menu style={{ width: '24px', height: '24px' }} /></button>
        </header>

        <main style={{ padding: '32px 24px', maxWidth: '1400px', margin: '0 auto' }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeSection} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              
              {/* ADMIN VIEWS */}
              {user.role === 'admin' && activeSection === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                  {[
                    { label: 'Total Nodes', value: stats.nodes?.total || 0, icon: Droplets, color: '#0891b2', bg: '#eff6ff' },
                    { label: 'Active Nodes', value: stats.nodes?.active || 0, icon: Activity, color: '#10b981', bg: '#d1fae5' },
                    { label: 'Total Users', value: users.length, icon: Users, color: '#8b5cf6', bg: '#ede9fe' },
                    { label: 'Active Alerts', value: alerts.length, icon: AlertTriangle, color: '#ef4444', bg: '#fee2e2' }
                  ].map((stat, i) => (
                    <motion.div key={i} whileHover={{ y: -5 }} style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                      <div style={{ width: '52px', height: '52px', background: stat.bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><stat.icon style={{ width: '24px', height: '24px', color: stat.color }} /></div>
                      <div><p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>{stat.label}</p><p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{stat.value}</p></div>
                    </motion.div>
                  ))}
                </div>
              )}

              {user.role === 'admin' && activeSection === 'users' && (
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9' }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700' }}>Registered Users ({users.length})</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                        {['Name', 'Email', 'Role', 'County'].map(h => <th key={h} style={{ textAlign: 'left', padding: '12px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {users.map((u, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                            <td style={{ padding: '16px 12px', fontWeight: '600' }}>{u.name}</td>
                            <td style={{ padding: '16px 12px', color: '#64748b' }}>{u.email}</td>
                            <td style={{ padding: '16px 12px' }}><span style={{ padding: '4px 10px', background: u.role === 'admin' ? '#fee2e2' : '#eff6ff', color: u.role === 'admin' ? '#dc2626' : '#0891b2', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{u.role}</span></td>
                            <td style={{ padding: '16px 12px' }}>{u.county || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {user.role === 'admin' && activeSection === 'alerts' && (
                <div>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700' }}>All System Alerts</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {alerts.map((alert, i) => (
                      <div key={i} style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', gap: '16px' }}>
                        <div style={{ width: '44px', height: '44px', background: '#fee2e2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle style={{ color: '#dc2626' }} /></div>
                        <div><h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700' }}>{alert.message}</h4><p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{alert.node_name} • {new Date(alert.created_at).toLocaleString()}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* COUNTY OFFICER & OPERATOR VIEWS */}
              {(user.role === 'county_officer' || user.role === 'operator') && (activeSection === 'overview' || activeSection === 'nodes') && (
                <div>
                  {user.role === 'county_officer' && activeSection === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                      {[
                        { label: 'County Nodes', value: nodes.length, icon: MapPin, color: '#0891b2', bg: '#eff6ff' },
                        { label: 'Active Nodes', value: nodes.filter(n => n.status === 'active').length, icon: Activity, color: '#10b981', bg: '#d1fae5' },
                        { label: 'Open Reports', value: reports.filter(r => r.status === 'open').length, icon: FileText, color: '#f59e0b', bg: '#fef3c7' }
                      ].map((stat, i) => (
                        <motion.div key={i} whileHover={{ y: -5 }} style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                          <div style={{ width: '52px', height: '52px', background: stat.bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><stat.icon style={{ width: '24px', height: '24px', color: stat.color }} /></div>
                          <div><p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>{stat.label}</p><p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{stat.value}</p></div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  
                  {user.role === 'operator' && activeSection === 'overview' && (
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                        <motion.div whileHover={{ y: -5 }} style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '52px', height: '52px', background: '#d1fae5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle style={{ width: '24px', height: '24px', color: '#10b981' }} /></div>
                          <div><p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>Stations Online</p><p style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>{nodes.filter(n => n.status === 'active').length}</p></div>
                        </motion.div>
                        <motion.div whileHover={{ y: -5 }} style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '52px', height: '52px', background: '#fee2e2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertCircle style={{ width: '24px', height: '24px', color: '#ef4444' }} /></div>
                          <div><p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>Needs Attention</p><p style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>{nodes.filter(n => n.status !== 'active').length}</p></div>
                        </motion.div>
                     </div>
                  )}

                  <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700' }}>
                    {user.role === 'operator' ? 'Assigned Water Stations' : 'Water Nodes'}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {nodes.map((node, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}
                        style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{node.name}</h4>
                          <span style={{ padding: '4px 10px', background: node.status === 'active' ? '#d1fae5' : '#fee2e2', color: node.status === 'active' ? '#059669' : '#dc2626', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{node.status}</span>
                        </div>
                        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>{node.location}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px' }}><p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b' }}>Water Level</p><p style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>{node.water_level}%</p></div>
                          <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px' }}><p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b' }}>Quality</p><p style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>{node.quality_index}%</p></div>
                        </div>
                      </motion.div>
                    ))}
                    {nodes.length === 0 && <p style={{ color: '#64748b' }}>No nodes found.</p>}
                  </div>
                </div>
              )}

              {user.role === 'county_officer' && activeSection === 'reports' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {reports.map((report, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{report.title}</h4>
                        <span style={{ padding: '4px 10px', background: report.status === 'open' ? '#fef3c7' : '#d1fae5', color: report.status === 'open' ? '#d97706' : '#059669', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{report.status}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>{report.description}</p>
                    </motion.div>
                  ))}
                  {reports.length === 0 && <p style={{ color: '#64748b' }}>No reports in your county.</p>}
                </div>
              )}

              {user.role === 'operator' && activeSection === 'maintenance' && (
                <div style={{ background: 'white', borderRadius: '16px', padding: '40px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                  <Wrench style={{ width: '48px', height: '48px', color: '#94a3b8', margin: '0 auto 16px' }} />
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700' }}>No Pending Maintenance</h3>
                  <p style={{ margin: 0, color: '#64748b' }}>All assigned stations are running smoothly.</p>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <style>{`@media (max-width: 768px) { .show-mobile { display: block !important; } } @media (min-width: 769px) { .show-mobile { display: none !important; } } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
