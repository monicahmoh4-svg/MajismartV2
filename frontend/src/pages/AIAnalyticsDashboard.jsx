import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, AlertTriangle, TrendingUp, Calendar, DollarSign, 
  CheckCircle, Activity, MapPin, RefreshCw, ArrowRight
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import api from '../api'

const RISK_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#10b981'
}

export default function AIAnalyticsDashboard() {
  const [predictions, setPredictions] = useState([])
  const [anomalies, setAnomalies] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [predRes, anomRes, recRes] = await Promise.all([
        api.get('/ai/predictive-maintenance').catch(() => ({ predictions: [] })),
        api.get('/ai/anomalies').catch(() => ({ anomalies: [] })),
        api.get('/ai/recommendations').catch(() => ({ recommendations: [] }))
      ])
      
      setPredictions(predRes.predictions || [])
      setAnomalies(anomRes.anomalies || [])
      setRecommendations(recRes.recommendations || [])
    } catch (err) {
      console.error('AI Analytics fetch error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
  }

  // Prepare chart data
  const riskDistribution = [
    { name: 'Critical', value: predictions.filter(p => p.risk_level === 'Critical').length, color: RISK_COLORS.Critical },
    { name: 'High', value: predictions.filter(p => p.risk_level === 'High').length, color: RISK_COLORS.High },
    { name: 'Medium', value: predictions.filter(p => p.risk_level === 'Medium').length, color: RISK_COLORS.Medium },
    { name: 'Low', value: predictions.filter(p => p.risk_level === 'Low').length, color: RISK_COLORS.Low }
  ]

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '50px', height: '50px', border: '4px solid #e2e8f0', borderTop: '4px solid #8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', background: '#f8fafc', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Brain size={32} color="#8b5cf6" /> AI Analytics & Predictive Maintenance
            </h1>
            <p style={{ margin: 0, fontSize: '15px', color: '#64748b' }}>
              Machine learning insights to predict failures and optimize water utility operations.
            </p>
          </div>
          <button onClick={handleRefresh} disabled={refreshing}
            style={{ padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#475569', opacity: refreshing ? 0.6 : 1 }}>
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Refresh Insights
          </button>
        </div>

        {/* Top Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <StatCard icon={AlertTriangle} title="Critical Risks" value={riskDistribution[0].value} color="#ef4444" />
          <StatCard icon={Activity} title="Active Anomalies" value={anomalies.length} color="#f97316" />
          <StatCard icon={TrendingUp} title="AI Recommendations" value={recommendations.length} color="#8b5cf6" />
          <StatCard icon={DollarSign} title="Est. Preventable Cost" value={`KES ${recommendations.reduce((sum, r) => sum + (r.estimated_cost_ksh || 0), 0).toLocaleString()}`} color="#10b981" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Risk Distribution Chart */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Asset Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={riskDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fontWeight: '600' }} width={70} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Anomaly Detection */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} color="#f97316" /> Live Anomaly Detection
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {anomalies.length > 0 ? anomalies.map((anom) => (
                <div key={anom.id} style={{ padding: '16px', background: anom.severity === 'High' ? '#fef2f2' : '#fff7ed', borderRadius: '12px', border: `1px solid ${anom.severity === 'High' ? '#fecaca' : '#fed7aa'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{anom.asset_name}</span>
                    <span style={{ padding: '2px 8px', background: anom.severity === 'High' ? '#ef4444' : '#f97316', color: 'white', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>{anom.severity}</span>
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#475569' }}>
                    <strong>{anom.metric}:</strong> {anom.current_value} (Expected: {anom.expected_range})
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>💡 {anom.recommendation}</p>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 12px' }} />
                  <p>No anomalies detected. All systems operating within normal parameters.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Predictive Maintenance List & Recommendations */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          {/* Top Risk Assets */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Top Assets at Risk</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {predictions.slice(0, 5).map((asset, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `${RISK_COLORS[asset.risk_level]}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: RISK_COLORS[asset.risk_level] }}>{asset.risk_score}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{asset.name}</h4>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#64748b' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {asset.county}</span>
                      {asset.predicted_failure_date && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontWeight: '600' }}>
                          <Calendar size={12} /> Fail by: {asset.predicted_failure_date}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={20} color="#8b5cf6" /> AI Action Plan
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recommendations.map((rec, i) => (
                <div key={i} style={{ padding: '16px', background: '#f5f3ff', borderRadius: '12px', border: '1px solid #e9d5ff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{rec.asset_name}</span>
                    <span style={{ padding: '2px 8px', background: rec.priority === 'Urgent' ? '#ef4444' : rec.priority === 'High' ? '#f97316' : '#8b5cf6', color: 'white', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>{rec.priority}</span>
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>{rec.action}</p>
                  {rec.estimated_cost_ksh > 0 && (
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Est. Cost: KES {rec.estimated_cost_ksh.toLocaleString()}</p>
                  )}
                </div>
              ))}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
        <div style={{ width: '40px', height: '40px', background: `${color}15`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
      </div>
      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{value}</div>
    </motion.div>
  )
}
