import { AlertCircle, Inbox, RefreshCw } from 'lucide-react'
export function Loading({ rows = 3 }) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="card skeleton-card" style={{ padding: '18px 20px', height: 86 }} />
        ))}
      </div>
      <div className="card skeleton-card" style={{ height: 200 }} />
    </div>
  )
}
export function ErrorState({ message, onRetry }) {
  return (
    <div className="card fade-in" style={{
      padding: '32px 20px', textAlign: 'center', color: 'var(--gray-600)'
    }}>
      <AlertCircle size={28} color="var(--red)" style={{ margin: '0 auto 10px', display: 'block' }} />
      <div style={{ fontWeight: 600, color: 'var(--gray-800)', marginBottom: 4 }}>Couldn't load this data</div>
      <div style={{ fontSize: 13, marginBottom: 14 }}>{message || 'Something went wrong. Please try again.'}</div>
      {onRetry && (
        <button className="btn btn-outline" onClick={onRetry} style={{ margin: '0 auto' }}>
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  )
}
export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', subtitle }) {
  return (
    <div className="fade-in" style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '28px 0' }}>
      <Icon size={24} style={{ display: 'block', margin: '0 auto 8px' }} />
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, marginTop: 2 }}>{subtitle}</div>}
    </div>
  )
}
export function StatCard({ label, value, sub, icon: Icon, color, bg }) {
  return (
    <div className="card fade-in" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{sub}</div>}
        </div>
        {Icon && (
          <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} color={color} />
          </div>
        )}
      </div>
    </div>
  )
}
export function LiveBadge({ lastUpdated }) {
  if (!lastUpdated) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, color: 'var(--gray-400)'
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: 'var(--teal)',
        display: 'inline-block', animation: 'pulse-dot 1.6s ease-in-out infinite'
      }} />
      Live · updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  )
}
