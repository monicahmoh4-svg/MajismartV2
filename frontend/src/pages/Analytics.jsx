import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, MapPin } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts'
import api from '../api'

const COLORS = ['#1a7fd4','#0d9e75','#e8a020','#d93025','#6f42c1','#00bcd4']

export default function Analytics() {
  const [revenue, setRevenue] = useState([])
  const [countyStats, setCountyStats] = useState([])
  const [levels, setLevels] = useState([])
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/dashboard/revenue-chart?days=${days}`),
      api.get('/dashboard/county-stats'),
      api.get('/dashboard/water-levels'),
    ]).then(([r,c,l]) => { setRevenue(r); setCountyStats(c); setLevels(l) })
      .finally(() => setLoading(false))
  }, [days])

  const statusDist = ['active','warning','offline','maintenance'].map(s => ({
    name: s.charAt(0).toUpperCase()+s.slice(1),
    value: levels.filter(n => n.status === s).length
  })).filter(s => s.value > 0)

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart3 size={24} color="#6f42c1" /> Analytics
          </h1>
          <p style={{ color: '#5f6368', marginTop: 4 }}>Revenue, usage and performance insights</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[7,14,30].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`btn ${days===d?'btn-primary':'btn-ghost'}`} style={{ padding: '7px 14px' }}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Revenue + Litres */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20, marginBottom: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} color="#0d9e75" /> Revenue (Ksh) — {days} days
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenue} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d?.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`Ksh ${v}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#0d9e75" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Daily Litres Dispensed</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenue} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d?.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [v+'L', 'Litres']} />
              <Bar dataKey="litres" fill="#1a7fd4" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* County stats + Status distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20, marginBottom: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={16} color="#d93025" /> Revenue by County
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={countyStats} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="county" tick={{ fontSize: 11 }} width={70} />
              <Tooltip formatter={v => [`Ksh ${Number(v).toFixed(0)}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#6f42c1" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Node Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusDist} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* County table */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>County Performance Table</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e8eaed' }}>
                {['County','Total Nodes','Active','Revenue (Ksh)','Litres Dispensed'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#5f6368', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {countyStats.map((c, i) => (
                <tr key={c.county} style={{ borderBottom: '1px solid #f1f3f4', background: i%2===0?'white':'#fcfcfc' }}>
                  <td style={{ padding: '11px 14px', fontWeight: 600 }}>{c.county}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'center' }}>{c.nodes}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'center', color: '#0d9e75', fontWeight: 600 }}>{c.active_nodes}</td>
                  <td style={{ padding: '11px 14px', fontWeight: 700, color: '#0d9e75' }}>Ksh {Number(c.revenue).toLocaleString()}</td>
                  <td style={{ padding: '11px 14px', color: '#1a7fd4', fontWeight: 600 }}>{Number(c.litres_dispensed).toLocaleString()}L</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
