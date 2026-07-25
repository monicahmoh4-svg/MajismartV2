import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { 
  Droplets, Activity, AlertTriangle, ServerOff, RefreshCw, 
  TrendingUp, TrendingDown, Bell, Search, Settings, 
  MapPin, Clock, CheckCircle, XCircle, Zap, Thermometer,
  Users, FileText, Calendar, ArrowUpRight, ArrowDownRight,
  Filter, Download, Plus, Eye, MoreVertical, Shield,
  Cloud, Sun, CloudRain, Wind
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, alertsData, nodesData] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/alerts?resolved=false&limit=5'),
        api.get('/nodes')
      ]);
      setStats(statsData);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      setNodes(Array.isArray(nodesData) ? nodesData : []);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#64748b', fontSize: '16px', fontWeight: '500' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalNodes = stats?.nodes?.total || 0;
  const activeNodes = stats?.nodes?.active || 0;
  const warningNodes = stats?.nodes?.warning || 0;
  const offlineNodes = stats?.nodes?.offline || 0;
  const activePercentage = totalNodes > 0 ? Math.round((activeNodes / totalNodes) * 100) : 0;

  const metricCards = [
    {
      title: 'Total Nodes',
      value: totalNodes,
      change: '+12%',
      trend: 'up',
      icon: Droplets,
      color: '#3b82f6',
      bgColor: '#eff6ff',
      description: 'Across all counties'
    },
    {
      title: 'Active & Online',
      value: activeNodes,
      change: `${activePercentage}%`,
      trend: 'up',
      icon: Activity,
      color: '#10b981',
      bgColor: '#d1fae5',
      description: 'Operating normally'
    },
    {
      title: 'Warnings',
      value: warningNodes,
      change: warningNodes > 0 ? 'Needs attention' : 'All clear',
      trend: warningNodes > 0 ? 'down' : 'up',
      icon: AlertTriangle,
      color: '#f59e0b',
      bgColor: '#fef3c7',
      description: 'Requires maintenance'
    },
    {
      title: 'Offline',
      value: offlineNodes,
      change: offlineNodes === 0 ? 'Stable' : 'Critical',
      trend: offlineNodes === 0 ? 'up' : 'down',
      icon: ServerOff,
      color: '#ef4444',
      bgColor: '#fee2e2',
      description: 'Connection lost'
    }
  ];

  const quickActions = [
    { icon: Plus, label: 'Add Node', color: '#3b82f6' },
    { icon: FileText, label: 'Generate Report', color: '#8b5cf6' },
    { icon: Download, label: 'Export Data', color: '#10b981' },
    { icon: Bell, label: 'View Alerts', color: '#f59e0b' }
  ];

  const recentActivity = [
    { action: 'New node registered', location: 'Nairobi Central', time: '2 min ago', icon: Plus, color: '#3b82f6' },
    { action: 'Alert resolved', location: 'Mombasa Port', time: '15 min ago', icon: CheckCircle, color: '#10b981' },
    { action: 'Maintenance scheduled', location: 'Kisumu Lake', time: '1 hour ago', icon: Calendar, color: '#8b5cf6' },
    { action: 'Quality check passed', location: 'Nakuru Valley', time: '2 hours ago', icon: Shield, color: '#10b981' },
    { action: 'Low water level detected', location: 'Meru Highlands', time: '3 hours ago', icon: AlertTriangle, color: '#f59e0b' }
  ];

  const countyData = [
    { name: 'Nairobi', nodes: 8, active: 7, quality: 92, status: 'good' },
    { name: 'Mombasa', nodes: 6, active: 6, quality: 88, status: 'good' },
    { name: 'Kisumu', nodes: 5, active: 4, quality: 85, status: 'good' },
    { name: 'Nakuru', nodes: 4, active: 4, quality: 90, status: 'good' },
    { name: 'Kiambu', nodes: 3, active: 3, quality: 87, status: 'good' },
    { name: 'Machakos', nodes: 2, active: 2, quality: 83, status: 'moderate' },
    { name: 'Kakamega', nodes: 1, active: 1, quality: 89, status: 'good' },
    { name: 'Meru', nodes: 1, active: 1, quality: 91, status: 'good' }
  ];

  const weatherData = {
    temp: 24,
    condition: 'Partly Cloudy',
    humidity: 65,
    wind: 12,
    icon: Cloud
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {/* Top Navigation Bar */}
      <nav style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Droplets style={{ color: 'white', width: '24px', height: '24px' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>MajiSmart</h1>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Water Intelligence Network</p>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '8px',
            marginLeft: '32px'
          }}>
            {['overview', 'analytics', 'reports'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  background: activeTab === tab ? '#eff6ff' : 'transparent',
                  color: activeTab === tab ? '#3b82f6' : '#64748b',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: activeTab === tab ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f1f5f9',
            borderRadius: '8px',
            padding: '8px 16px',
            gap: '8px'
          }}>
            <Search style={{ width: '16px', height: '16px', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search nodes, counties..."
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '14px',
                width: '200px'
              }}
            />
          </div>

          <button style={{
            position: 'relative',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px'
          }}>
            <Bell style={{ width: '20px', height: '20px', color: '#64748b' }} />
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              background: '#ef4444',
              borderRadius: '50%',
              border: '2px solid white'
            }}></span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            paddingLeft: '16px',
            borderLeft: '1px solid #e2e8f0'
          }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{user?.name || 'User'}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{user?.role || 'Admin'}</p>
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '16px'
            }}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto' }}>
        {/* Welcome Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '-80px',
            right: '100px',
            width: '150px',
            height: '150px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '50%'
          }}></div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700' }}>
                  {getGreeting()}, {user?.name || 'User'} 
                </h2>
                <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>
                  Here's what's happening with your water network today
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px', opacity: 0.8 }}>{formatDate(currentTime)}</p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>{formatTime(currentTime)}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '32px', marginTop: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Droplets style={{ width: '24px', height: '24px' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>System Status</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                    {activePercentage}% Operational
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MapPin style={{ width: '24px', height: '24px' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Coverage</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                    {countyData.length} Counties
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertTriangle style={{ width: '24px', height: '24px' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Active Alerts</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                    {alerts.length} Pending
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {metricCards.map((metric, index) => (
            <div
              key={index}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(90deg, ${metric.color}, ${metric.color}88)`
              }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: metric.bgColor,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <metric.icon style={{ width: '24px', height: '24px', color: metric.color }} />
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  background: metric.trend === 'up' ? '#d1fae5' : '#fee2e2',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: metric.trend === 'up' ? '#059669' : '#dc2626'
                }}>
                  {metric.trend === 'up' ? <TrendingUp style={{ width: '12px', height: '12px' }} /> : <TrendingDown style={{ width: '12px', height: '12px' }} />}
                  {metric.change}
                </div>
              </div>

              <div>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>{metric.title}</p>
                <p style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700', color: '#0f172a' }}>{metric.value}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>{metric.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Water Quality Chart */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Water Quality Index</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Average quality across all nodes (last 7 days)</p>
              </div>
              <button style={{
                padding: '8px 16px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Filter style={{ width: '14px', height: '14px' }} />
                Filter
              </button>
            </div>

            {/* Simple Bar Chart */}
            <div style={{ height: '240px', display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '20px 0' }}>
              {[85, 88, 92, 87, 90, 93, 89].map((value, index) => (
                <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '100%',
                    height: `${(value / 100) * 200}px`,
                    background: `linear-gradient(180deg, #3b82f6 0%, #06b6d4 100%)`,
                    borderRadius: '8px 8px 0 0',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-24px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#0f172a'
                    }}>
                      {value}%
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: '1px solid #e2e8f0'
            }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b' }}>Average</p>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>89.1%</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b' }}>Peak</p>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#10b981' }}>93%</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b' }}>Lowest</p>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>85%</p>
              </div>
            </div>
          </div>

          {/* Alerts Panel */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Recent Alerts</h3>
              <button style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#3b82f6',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                View All
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alerts.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#64748b'
                }}>
                  <CheckCircle style={{ width: '48px', height: '48px', color: '#10b981', margin: '0 auto 12px' }} />
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>No active alerts</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>All systems running smoothly</p>
                </div>
              ) : (
                alerts.slice(0, 5).map((alert, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '16px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: alert.severity === 'high' ? '#fee2e2' : '#fef3c7',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <AlertTriangle style={{
                        width: '16px',
                        height: '16px',
                        color: alert.severity === 'high' ? '#dc2626' : '#d97706'
                      }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                        {alert.message || 'Alert'}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                        {alert.node_name || 'Unknown node'} • {new Date(alert.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* County Performance & Quick Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* County Table */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>County Performance</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Water node status by region</p>
              </div>
              <button style={{
                padding: '8px 16px',
                background: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Download style={{ width: '14px', height: '14px' }} />
                Export
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>County</th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Nodes</th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Active</th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Quality</th>
                    <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {countyData.map((county, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 8px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin style={{ width: '16px', height: '16px', color: '#64748b' }} />
                          {county.name}
                        </div>
                      </td>
                      <td style={{ padding: '16px 8px', fontSize: '14px', color: '#475569', textAlign: 'center' }}>{county.nodes}</td>
                      <td style={{ padding: '16px 8px', fontSize: '14px', color: '#475569', textAlign: 'center' }}>
                        <span style={{ color: '#10b981', fontWeight: '600' }}>{county.active}</span>/{county.nodes}
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <div style={{
                            width: '60px',
                            height: '6px',
                            background: '#e2e8f0',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${county.quality}%`,
                              height: '100%',
                              background: county.quality >= 90 ? '#10b981' : county.quality >= 80 ? '#3b82f6' : '#f59e0b',
                              borderRadius: '3px'
                            }}></div>
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{county.quality}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                        <span style={{
                          padding: '4px 12px',
                          background: county.status === 'good' ? '#d1fae5' : '#fef3c7',
                          color: county.status === 'good' ? '#059669' : '#d97706',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {county.status === 'good' ? 'Good' : 'Moderate'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Quick Actions</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  style={{
                    padding: '16px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = action.color + '10';
                    e.currentTarget.style.borderColor = action.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <action.icon style={{ width: '24px', height: '24px', color: action.color }} />
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>{action.label}</span>
                </button>
              ))}
            </div>

            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #eff6ff, #f0fdfa)',
              borderRadius: '12px',
              border: '1px solid #bfdbfe'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <Shield style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>System Health</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>All services operational</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b' }}>Uptime</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#10b981' }}>99.9%</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b' }}>Latency</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#3b82f6' }}>45ms</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b' }}>Last Sync</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>2m</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity & Weather */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '24px'
        }}>
          {/* Activity Feed */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Recent Activity</h3>
              <button style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#3b82f6',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                View All
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'flex-start',
                    padding: '12px',
                    borderRadius: '12px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: activity.color + '15',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <activity.icon style={{ width: '20px', height: '20px', color: activity.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                      {activity.action}
                    </p>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>
                      {activity.location}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock style={{ width: '12px', height: '12px' }} />
                      {activity.time}
                    </p>
                  </div>
                  <button style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px'
                  }}>
                    <MoreVertical style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Weather Widget */}
          <div style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700' }}>Weather Conditions</h3>
            
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <weatherData.icon style={{ width: '64px', height: '64px', margin: '0 auto 12px' }} />
              <p style={{ margin: '0 0 8px 0', fontSize: '48px', fontWeight: '700' }}>{weatherData.temp}°C</p>
              <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>{weatherData.condition}</p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255,255,255,0.2)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Droplets style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '12px', opacity: 0.8 }}>Humidity</span>
                </div>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>{weatherData.humidity}%</p>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Wind style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '12px', opacity: 0.8 }}>Wind</span>
                </div>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>{weatherData.wind} km/h</p>
              </div>
            </div>

            <div style={{
              marginTop: '20px',
              padding: '12px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '13px',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0 }}>💧 Optimal conditions for water collection</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
