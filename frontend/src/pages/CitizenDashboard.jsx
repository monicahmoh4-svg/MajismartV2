import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { motion } from 'framer-motion'
import { 
  FileText, Plus, CheckCircle, Clock, LogOut, 
  Droplets, Phone, BarChart3, MapPin
} from 'lucide-react'

export default function CitizenDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentReports, setRecentReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const statsRes = await api.get('/reports-enhanced/stats')
      setStats(statsRes)

      const reportsRes = await api.get('/reports-enhanced?limit=5')
      setRecentReports(reportsRes.reports || [])
    } catch (err) {
      console.error('Fetch dashboard data error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Top Navigation Bar */}
      <header style={{ 
        background: 'white', 
        borderBottom: '1px solid #e2e8f0', 
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            background: 'linear-gradient(135deg, #0891b2, #06b6d4)', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Droplets style={{ color: 'white', width: '24px', height: '24px' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>MajiSmart</h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Citizen Portal</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{user?.name || 'Citizen'}</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{user?.county || 'Nairobi'} County</p>
          </div>
          <button onClick={handleLogout}
            style={{ 
              padding: '8px 16px', 
              background: '#fef2f2', 
              color: '#dc2626', 
              border: '1px solid #fecaca', 
              borderRadius: '8px', 
              fontWeight: '600', 
              fontSize: '13px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px' 
            }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
            Welcome back, {user?.name?.split(' ')[0] || 'Citizen'}! 👋
          </h2>
          <p style={{ margin: 0, fontSize: '15px', color: '#64748b' }}>
            Here's an overview of your water service reports and community updates.
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <QuickActionCard 
            icon={Plus}
            title="Submit New Report"
            description="Report a leak, outage, or water quality issue in your area."
            color="#dc2626"
            bgColor="#fef2f2"
            onClick={() => navigate('/dashboard?view=reports-citizen')}
          />
          <QuickActionCard 
            icon={FileText}
            title="My Reports"
            description="Track the status of your submitted reports and view history."
            color="#0891b2"
            bgColor="#f0f9ff"
            onClick={() => navigate('/dashboard?view=reports-citizen')}
          />
          <QuickActionCard 
            icon={MapPin}
            title="View GIS Map"
            description="Explore water infrastructure and assets in your county."
            color="#10b981"
            bgColor="#f0fdf4"
            onClick={() => navigate('/dashboard?view=gis')}
          />
          <QuickActionCard 
            icon={Phone}
            title="Contact Support"
            description="Get in touch with your county water utility support team."
            color="#8b5cf6"
            bgColor="#f5f3ff"
            onClick={() => {}}
          />
        </div>

        {/* Stats & Recent Reports Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
          {/* Stats Card */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={20} color="#0891b2" /> Your Report Statistics
            </h3>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading stats...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <StatBox label="Total Reports" value={stats?.total_reports || 0} color="#0891b2" />
                <StatBox label="Pending" value={(stats?.submitted || 0) + (stats?.acknowledged || 0)} color="#f59e0b" />
                <StatBox label="In Progress" value={stats?.in_progress || 0} color="#3b82f6" />
                <StatBox label="Resolved" value={stats?.resolved || 0} color="#10b981" />
              </div>
            )}
          </div>

          {/* Recent Reports Card */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} color="#0891b2" /> Recent Reports
            </h3>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading reports...</div>
            ) : recentReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p>No reports submitted yet.</p>
                <button onClick={() => navigate('/dashboard?view=reports-citizen')}
                  style={{ marginTop: '12px', padding: '8px 16px', background: '#0891b2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                  Submit Your First Report
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentReports.map((report) => (
                  <div key={report.id} style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                    onClick={() => navigate('/dashboard?view=reports-citizen')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'monospace', color: '#64748b' }}>{report.report_number}</span>
                      <StatusBadge status={report.status} />
                    </div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{report.title}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                      {new Date(report.submitted_at).toLocaleDateString()} • {report.category.replace('_', ' ')}
                    </p>
                  </div>
                ))}
                <button onClick={() => navigate('/dashboard?view=reports-citizen')}
                  style={{ marginTop: '8px', padding: '10px', background: 'transparent', color: '#0891b2', border: '1px solid #bae6fd', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                  View All Reports →
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

function QuickActionCard({ icon: Icon, title, description, color, bgColor, onClick }) {
  return (
    <motion.div 
      whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}
      onClick={onClick}
      style={{ 
        background: 'white', 
        borderRadius: '16px', 
        padding: '24px', 
        cursor: 'pointer', 
        border: '1px solid #f1f5f9',
        transition: 'all 0.2s'
      }}>
      <div style={{ 
        width: '48px', 
        height: '48px', 
        background: bgColor, 
        borderRadius: '12px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: '16px'
      }}>
        <Icon size={24} color={color} />
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>{description}</p>
    </motion.div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
      <div style={{ fontSize: '28px', fontWeight: '800', color: color, marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{label}</div>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    submitted: { bg: '#e0e7ff', text: '#4338ca', label: 'Submitted' },
    acknowledged: { bg: '#fef3c7', text: '#d97706', label: 'Acknowledged' },
    in_progress: { bg: '#dbeafe', text: '#2563eb', label: 'In Progress' },
    resolved: { bg: '#d1fae5', text: '#059669', label: 'Resolved' },
    closed: { bg: '#f1f5f9', text: '#64748b', label: 'Closed' }
  }
  const style = styles[status] || styles.submitted
  
  return (
    <span style={{ 
      padding: '2px 8px', 
      borderRadius: '6px', 
      fontSize: '10px', 
      fontWeight: '700', 
      background: style.bg, 
      color: style.text 
    }}>
      {style.label}
    </span>
  )
}
