import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { motion } from 'framer-motion'
import { FileText, Plus, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

export default function CitizenDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await api.get('/reports-enhanced/stats')
      setStats(response)
    } catch (err) {
      console.error('Fetch stats error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', background: '#f8fafc', padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
              Welcome, {user?.name || 'Citizen'}
            </h1>
            <p style={{ margin: 0, fontSize: '15px', color: '#64748b' }}>
              Track your community water reports and service requests.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => navigate('/dashboard?view=reports-citizen')}
              style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)' }}>
              <Plus size={18} /> Submit New Report
            </button>
            <button onClick={() => { logout(); navigate('/login'); }}
              style={{ padding: '12px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Logout
            </button>
         40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #0891b2', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
              <p style={{ color: '#64748b' }}>Loading your dashboard...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <StatCard icon={FileText} title="Total Reports" value={stats.total_reports || 0} color="#0891b2" />
              <StatCard icon={Clock} title="Pending" value={(stats.submitted || 0) + (stats.acknowledged || 0)} color="#f59e0b" />
              <StatCard icon={CheckCircle} title="Resolved" value={stats.resolved || 0} color="#10b981" />
              <StatCard icon={AlertTriangle} title="High Priority" value={stats.high_priority || 0} color="#ef4444" />
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div onClick={() => navigate('/dashboard?view=reports-citizen')}
              style={{ padding: '20px', background: '#f0f9ff', borderRadius: '12px', cursor: 'pointer', border: '1px solid #bae6fd', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <FileText size={24} color="#0891b2" style={{ marginBottom: '12px' }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>View All Reports</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Track the status of your submitted water issues.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, title, value, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
      <div style={{ width: '40px', height: '40px', background: `${color}15`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>{value}</div>
    </motion.div>
  )
}
