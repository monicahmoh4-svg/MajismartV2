import { Loader2, AlertCircle, Inbox } from 'lucide-react';

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
        <button onClick={onRetry} className="btn btn-primary">
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
