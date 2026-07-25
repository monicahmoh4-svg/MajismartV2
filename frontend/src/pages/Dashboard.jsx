import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Droplets, Activity, AlertTriangle, ServerOff, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.get('/dashboard/summary');
      setStats(data);
      setError('');
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '24px', textAlign: 'center', maxWidth: '400px' }}>
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-3" />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#991b1b', marginBottom: '8px' }}>Error Loading Data</h3>
          <p style={{ color: '#dc2626', marginBottom: '16px' }}>{error}</p>
          <button onClick={fetchStats} style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statsData = [
    { 
      title: 'Total Water Nodes', 
      value: stats?.nodes?.total || 0, 
      icon: Droplets, 
      bg: '#eff6ff',
      borderColor: '#bfdbfe',
      iconColor: '#2563eb',
      trend: 'Active monitoring',
      indicator: '#3b82f6'
    },
    { 
      title: 'Active & Online', 
      value: stats?.nodes?.active || 0, 
      icon: Activity, 
      bg: '#d1fae5',
      borderColor: '#a7f3d0',
      iconColor: '#059669',
      trend: 'Operating normally',
      indicator: '#10b981'
    },
    { 
      title: 'Warnings / Maintenance', 
      value: stats?.nodes?.warning || 0, 
      icon: AlertTriangle, 
      bg: '#fffbeb',
      borderColor: '#fde68a',
      iconColor: '#d97706',
      trend: 'Requires attention',
      indicator: '#f59e0b'
    },
    { 
      title: 'Offline Nodes', 
      value: stats?.nodes?.offline || 0, 
      icon: ServerOff, 
      bg: '#fff1f2',
      borderColor: '#fda4af',
      iconColor: '#e11d48',
      trend: 'Connection lost',
      indicator: '#f43f5e'
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Dashboard Overview</h1>
        <p style={{ color: '#4b5563' }}>
          Welcome back, <span style={{ fontWeight: '600', color: '#2563eb' }}>{user?.name || 'User'}</span>. 
          Real-time status of Kenyan water networks.
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '24px',
        marginBottom: '32px'
      }}>
        {statsData.map((stat, index) => (
          <div 
            key={index}
            style={{
              background: stat.bg,
              border: `1px solid ${stat.borderColor}`,
              borderRadius: '12px',
              padding: '24px',
              transition: 'box-shadow 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>{stat.title}</p>
                <p style={{ fontSize: '36px', fontWeight: '700', color: '#111827', marginBottom: '12px' }}>{stat.value}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    display: 'inline-block', 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: stat.indicator 
                  }}></span>
                  <p style={{ fontSize: '12px', color: '#4b5563' }}>{stat.trend}</p>
                </div>
              </div>
              <div style={{ 
                background: stat.bg, 
                padding: '12px', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <stat.icon className="h-8 w-8" style={{ color: stat.iconColor, width: '32px', height: '32px' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {(!stats || stats.nodes.total === 0) && (
        <div style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdfa 100%)',
          border: '1px solid #bfdbfe',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center'
        }}>
          <div style={{
            background: '#dbeafe',
            borderRadius: '50%',
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <Droplets className="h-10 w-10" style={{ color: '#2563eb', width: '40px', height: '40px' }} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Awaiting Real-Time Data</h3>
          <p style={{ color: '#4b5563', maxWidth: '480px', margin: '0 auto 24px', lineHeight: '1.6' }}>
            No water nodes registered yet. The dashboard will display real-time telemetry from Kenyan counties once nodes are added.
          </p>
          <button style={{
            padding: '12px 24px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '15px'
          }}>
            Add First Water Node
          </button>
        </div>
      )}
    </div>
  );
}
