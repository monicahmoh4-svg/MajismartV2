import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, FileText, Activity, LogOut, Menu } from 'lucide-react';

export default function CountyOfficerDashboard() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [loading, setLoading] = useState(true);
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
      const [nodesData, reportsData] = await Promise.all([api.get('/nodes'), api.get('/reports')]);
      const allNodes = Array.isArray(nodesData) ? nodesData : [];
      const allReports = Array.isArray(reportsData) ? reportsData : [];
      setNodes(user?.county ? allNodes.filter(n => n.county === user.county) : allNodes);
      setReports(user?.county ? allReports.filter(r => r.county === user.county) : allReports);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const navItems = [
    { id: 'overview', label: 'County Overview', icon: Activity },
    { id: 'nodes', label: 'Water Nodes', icon: MapPin },
    { id: 'reports', label: 'Community Reports', icon: FileText },
  ];

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #0891b2', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex' }}>
      <motion.aside animate={{ x: sidebarOpen ? 0 : -280 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ width: '280px', background: 'white', borderRight: '1px solid #f1f5f9', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MapPin style={{ color: 'white', width: '20px', height: '20px' }} /></div>
            <div><h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>MajiSmart</h2><p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{user?.county} Officer</p></div>
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
          <div><h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{navItems.find(n => n.id === activeSection)?.label}</h1><p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Managing {user?.county} County</p></div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="show-mobile" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><Menu style={{ width: '24px', height: '24px' }} /></button>
        </header>

        <main style={{ padding: '32px 24px', maxWidth: '1400px', margin: '0 auto' }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeSection} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {activeSection === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
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
              {activeSection === 'nodes' && (
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
                </div>
              )}
              {activeSection === 'reports' && (
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
