import { useState } from 'react'
import {
  Brain, AlertTriangle, TrendingUp, Activity, Lightbulb,
  Send, Bot, User as UserIcon, Droplets
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../api'
import { useApiData } from '../hooks/useApiData'
import { Loading, ErrorState, EmptyState, LiveBadge } from '../components/ui/StateViews'

function PriorityBadge({ priority }) {
  const map = {
    critical: { cls: 'badge-critical', label: 'Critical' },
    warning:  { cls: 'badge-warning',  label: 'Warning' },
    info:     { cls: 'badge-active',   label: 'Info' },
  }
  const m = map[priority] || map.info
  return <span className={`badge ${m.cls}`}>{m.label}</span>
}

function ChatPanel() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi, I'm the MajiSmart AI assistant. Ask me about leaks, offline nodes, revenue, or alerts." }
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setMessages(m => [...m, { role: 'user', text }])
    setInput('')
    setSending(true)
    try {
      const res = await api.post('/ai/chat', { message: text })
      setMessages(m => [...m, { role: 'assistant', text: res.reply }])
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', text: "Sorry, I couldn't process that right now." }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', height: 380 }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Bot size={17} color="#1a7fd4" />
        <span style={{ fontWeight: 700, fontSize: 14 }}>AI Assistant</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              background: m.role === 'user' ? '#e8f4fd' : '#e1f5ee',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {m.role === 'user' ? <UserIcon size={13} color="#1a7fd4" /> : <Bot size={13} color="#0d9e75" />}
            </div>
            <div style={{
              maxWidth: '78%', fontSize: 13, padding: '8px 12px', borderRadius: 12,
              background: m.role === 'user' ? '#1a7fd4' : 'var(--gray-100)',
              color: m.role === 'user' ? 'white' : 'var(--gray-800)'
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {sending && <div style={{ fontSize: 12, color: 'var(--gray-400)', paddingLeft: 34 }}>Thinking…</div>}
      </div>
      <div style={{ padding: 12, borderTop: '1px solid var(--gray-200)', display: 'flex', gap: 8 }}>
        <input
          placeholder="Ask about leaks, alerts, revenue…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary" onClick={send} disabled={sending} style={{ padding: '10px 14px' }}>
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}

export default function AIInsights() {
  const { data: nodesData } = useApiData(() => api.get('/nodes'), { isEmpty: d => !d?.length })
  const [selectedNode, setSelectedNode] = useState('')

  const { data, loading, error, empty, lastUpdated, refetch } = useApiData(
    () => api.get('/ai/insights'),
    { pollMs: 60000, isEmpty: d => !d }
  )

  const forecastQuery = useApiData(
    () => selectedNode ? api.get(`/ai/forecast/${selectedNode}?days=7`) : Promise.resolve(null),
    { deps: [selectedNode], isEmpty: d => !d?.forecast?.length }
  )
  const recoQuery = useApiData(
    () => selectedNode ? api.get(`/ai/recommendations/${selectedNode}`) : Promise.resolve(null),
    { deps: [selectedNode], isEmpty: d => !d?.recommendations?.length }
  )

  if (loading) return <Loading rows={4} />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <div>
      <div style={{ marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Brain size={22} color="#6f42c1" />
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#6f42c1' }}>AI Insights</h1>
          </div>
          <p style={{ color: '#5f6368', fontSize: 14 }}>Leak detection, forecasting, anomalies and recommendations powered by live sensor data</p>
        </div>
        <LiveBadge lastUpdated={lastUpdated} />
      </div>

      {empty ? (
        <EmptyState title="No AI insights yet" subtitle="Data will appear once nodes start reporting" />
      ) : (
        <>
          {/* System overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 20 }}>
            <div className="card fade-in" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <AlertTriangle size={16} color="#d93025" />
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>Top Leak Risks</h3>
              </div>
              {data.leak_risks?.length ? data.leak_risks.map(l => (
                <div key={l.node_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{l.node_name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: l.leak_probability >= 60 ? '#d93025' : '#e8a020' }}>{l.leak_probability}%</span>
                </div>
              )) : <EmptyState title="No leak risks detected" />}
            </div>

            <div className="card fade-in" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Activity size={16} color="#1a7fd4" />
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>Network Health</h3>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#1a7fd4' }}>{data.total_nodes - data.total_nodes_at_risk}/{data.total_nodes}</div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>nodes with no detected issues</div>
            </div>

            <div className="card fade-in" style={{ padding: 20, gridColumn: 'span 1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <TrendingUp size={16} color="#0d9e75" />
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>Revenue Forecast — Next 7 Days</h3>
              </div>
              {data.revenue_forecast_7d?.length ? (
                <ResponsiveContainer width="100%" height={90}>
                  <LineChart data={data.revenue_forecast_7d}>
                    <Line type="monotone" dataKey="predicted_revenue" stroke="#0d9e75" strokeWidth={2} dot={false} />
                    <Tooltip formatter={v => [`Ksh ${v}`, 'Predicted']} labelFormatter={d => d} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyState title="Not enough data to forecast" />}
            </div>
          </div>

          {/* Per-node deep dive */}
          <div className="card fade-in" style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <Droplets size={16} color="#6f42c1" />
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Node Deep Dive</h3>
              <select value={selectedNode} onChange={e => setSelectedNode(e.target.value)} style={{ width: 'auto', minWidth: 200, marginLeft: 'auto' }}>
                <option value="">Select a node…</option>
                {(nodesData || []).map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>

            {!selectedNode ? (
              <EmptyState title="Select a node above" subtitle="View its consumption forecast and AI recommendations" />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 18 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 8 }}>Consumption Forecast</div>
                  {forecastQuery.loading ? <Loading rows={1} /> : forecastQuery.empty ? (
                    <EmptyState title="Not enough history to forecast" subtitle="Needs at least a few days of payments" />
                  ) : (
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={forecastQuery.data?.forecast}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d?.slice(5)} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={v => [`${v}L`, 'Predicted']} />
                        <Line type="monotone" dataKey="predicted_litres" stroke="#6f42c1" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                  {forecastQuery.data?.trend && (
                    <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 6 }}>
                      Trend: <strong>{forecastQuery.data.trend}</strong> · Confidence: {forecastQuery.data.confidence}
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Lightbulb size={14} color="#e8a020" /> AI Recommendations
                  </div>
                  {recoQuery.loading ? <Loading rows={2} /> : recoQuery.empty ? (
                    <EmptyState title="No recommendations" />
                  ) : (
                    <div style={{ display: 'grid', gap: 8 }}>
                      {recoQuery.data?.recommendations.map((r, i) => (
                        <div key={i} className="card" style={{ padding: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{r.title}</span>
                            <PriorityBadge priority={r.priority} />
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>{r.detail}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <ChatPanel />
    </div>
  )
}
