import { Link } from 'react-router-dom'
import { Wallet, TrendingUp, TrendingDown, Droplets, MapPin, Receipt, Info } from 'lucide-react'
import api from '../api'
import { useApiData } from '../hooks/useApiData'
import { Loading, ErrorState, EmptyState } from '../components/ui/StateViews'

function ChangeIndicator({ pct }) {
  if (pct === null) return null
  const up = pct > 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: up ? '#d93025' : '#0d9e75' }}>
      <Icon size={13} /> {up ? '+' : ''}{pct}% vs last month
    </span>
  )
}

export default function MyWater() {
  const { data, loading, error, refetch } = useApiData(() => api.get('/citizen/my-spending'))

  if (loading) return <Loading rows={3} />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  if (!data?.has_data) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>My Water Spending</h1>
        <div className="card" style={{ padding: 28, textAlign: 'center' }}>
          <Wallet size={36} color="#9aa0a6" style={{ display: 'block', margin: '0 auto 12px' }} />
          <p style={{ color: '#5f6368', fontSize: 14, marginBottom: 16 }}>
            {data?.message || 'Add your phone number to track your water purchases automatically.'}
          </p>
          <Link to="/app/settings" className="btn btn-primary">Add phone number</Link>
        </div>
      </div>
    )
  }

  const tm = data.this_month
  const lm = data.last_month
  const fairCostMin = 0.10
  const fairCostMax = 0.50
  const costPerL = parseFloat(tm.cost_per_litre)
  const isExpensive = costPerL > fairCostMax
  const isCheap = costPerL <= fairCostMin

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>My Water Spending</h1>
        <p style={{ fontSize: 14, color: '#5f6368' }}>Track how much you spend on water every month.</p>
      </div>

      {/* This month summary */}
      <div className="card fade-in" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#5f6368', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }}>This Month</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div style={{ padding: 14, background: '#fce8e6', borderRadius: 12 }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#d93025' }}>Ksh {Number(tm.total_ksh).toLocaleString()}</div>
            <div style={{ fontSize: 12, color: '#a52820', marginTop: 2 }}>Total spent</div>
          </div>
          <div style={{ padding: 14, background: '#e8f4fd', borderRadius: 12 }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#1a7fd4' }}>{Number(tm.total_litres).toLocaleString()}L</div>
            <div style={{ fontSize: 12, color: '#0f5a9e', marginTop: 2 }}>Litres purchased</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--gray-50)', borderRadius: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: '#9aa0a6' }}>Cost per litre</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: isExpensive ? '#d93025' : '#0d9e75' }}>
              {tm.cost_per_litre ? `Ksh ${tm.cost_per_litre}` : '—'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <ChangeIndicator pct={data.change_pct} />
            {tm.transactions > 0 && (
              <div style={{ fontSize: 11, color: '#9aa0a6', marginTop: 2 }}>{tm.transactions} purchase{tm.transactions !== 1 ? 's' : ''}</div>
            )}
          </div>
        </div>

        {/* Cost advice */}
        {tm.cost_per_litre && (
          <div style={{
            marginTop: 10, padding: '10px 14px', borderRadius: 10,
            background: isExpensive ? '#fce8e6' : '#e1f5ee',
            display: 'flex', gap: 8, alignItems: 'flex-start'
          }}>
            <Info size={14} color={isExpensive ? '#d93025' : '#0d9e75'} style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: isExpensive ? '#a52820' : '#0a7a5c', lineHeight: 1.5, margin: 0 }}>
              {isExpensive
                ? `You are paying Ksh ${tm.cost_per_litre}/L — above the fair range of Ksh 0.10–0.50/L. Try a different water point to save money.`
                : isCheap
                ? `Great deal — you are paying only Ksh ${tm.cost_per_litre}/L, well below the market rate.`
                : `You are paying a fair price for water (Ksh 0.10–0.50/L is the normal range).`}
            </p>
          </div>
        )}
      </div>

      {/* Last month comparison */}
      {lm.total_ksh > 0 && (
        <div className="card fade-in" style={{ padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#5f6368', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 10 }}>Last Month</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Ksh {Number(lm.total_ksh).toLocaleString()}</div>
              <div style={{ fontSize: 11, color: '#9aa0a6' }}>spent</div>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{Number(lm.total_litres).toLocaleString()}L</div>
              <div style={{ fontSize: 11, color: '#9aa0a6' }}>purchased</div>
            </div>
          </div>
        </div>
      )}

      {/* Payment history */}
      <div className="card fade-in" style={{ padding: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#5f6368', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 12 }}>
          <Receipt size={13} style={{ display: 'inline', marginRight: 5 }} />
          Purchase History
        </div>
        {data.history.length === 0 ? (
          <EmptyState icon={Droplets} title="No purchases yet" subtitle="Your water purchases will appear here" />
        ) : data.history.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < data.history.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#e8f4fd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Droplets size={16} color="#1a7fd4" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.node_name || 'Water point'}
              </div>
              <div style={{ fontSize: 11, color: '#9aa0a6', display: 'flex', gap: 6 }}>
                <span>{p.litres}L</span>
                {p.mpesa_code && <span>· {p.mpesa_code}</span>}
                <span>· {new Date(p.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</span>
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#d93025', flexShrink: 0 }}>
              Ksh {Number(p.amount_ksh).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
