import { Loader2, AlertCircle, Inbox, TrendingUp, TrendingDown } from 'lucide-react';

export function Loading({ message = 'Loading...' }) {
  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', 
      justifyContent: 'center', padding: '60px 20px', color: '#5f6368' 
    }}>
      <Loader2 size={40} className="animate-spin" style={{ color: '#1a7fd4', marginBottom: 16 }} />
      <p>{message}</p>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', 
      justifyContent: 'center', padding: '60px 20px', color: '#d93025' 
    }}>
      <AlertCircle size={40} style={{ marginBottom: 16 }} />
      <h3 style={{ marginBottom: 8 }}>Something went wrong</h3>
      <p style={{ color: '#5f6368', marginBottom: 16 }}>{error?.message || 'Failed to load data'}</p>
      {onRetry && (
        <button onClick={onRetry} style={{
          padding: '10px 20px', background: '#1a7fd4', color: 'white',
          border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
        }}>
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message = 'No data available', icon: Icon = Inbox }) {
  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', 
      justifyContent: 'center', padding: '60px 20px', color: '#9aa0a6', textAlign: 'center' 
    }}>
      <Icon size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
      <p style={{ fontSize: 16 }}>{message}</p>
    </div>
  );
}

export function LiveBadge() {
  return (
    <span style={{ 
      display: 'inline-flex', alignItems: 'center', gap: 6, 
      padding: '4px 12px', background: '#e1f5ee', 
      color: '#0d6e56', borderRadius: 99, fontSize: 12, fontWeight: 600 
    }}>
      <span style={{ 
        width: 6, height: 6, borderRadius: '50%', 
        background: '#0d9e75', animation: 'pulse 2s infinite' 
      }} />
      Live
    </span>
  );
}

export function StatCard({ title, value, icon: Icon, color = '#1a7fd4', trend }) {
  return (
    <div style={{ 
      background: 'white', borderRadius: '12px', padding: '24px', 
      border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '500' }}>{title}</p>
          <h3 style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>{value}</h3>
        </div>
        {Icon && (
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '12px', 
            background: `${color}15`, display: 'flex', 
            alignItems: 'center', justifyContent: 'center' 
          }}>
            <Icon size={24} color={color} />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: trend >= 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
          {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{Math.abs(trend)}%</span>
          <span style={{ color: '#94a3b8', fontWeight: '400' }}>vs last month</span>
        </div>
      )}
    </div>
  );
}
