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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchStats} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
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
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      trend: 'Active monitoring'
    },
    { 
      title: 'Active & Online', 
      value: stats?.nodes?.active || 0, 
      icon: Activity, 
      color: 'emerald',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-200',
      trend: 'Operating normally'
    },
    { 
      title: 'Warnings / Maintenance', 
      value: stats?.nodes?.warning || 0, 
      icon: AlertTriangle, 
      color: 'amber',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-200',
      trend: 'Requires attention'
    },
    { 
      title: 'Offline Nodes', 
      value: stats?.nodes?.offline || 0, 
      icon: ServerOff, 
      color: 'rose',
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-600',
      borderColor: 'border-rose-200',
      trend: 'Connection lost'
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, <span className="font-semibold text-blue-600">{user?.name || 'User'}</span>. 
            Real-time status of Kenyan water networks.
          </p>
        </div>
        <button 
          onClick={fetchStats} 
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <div 
            key={index}
            className={`${stat.bgColor} border ${stat.borderColor} rounded-xl p-6 hover:shadow-lg transition-shadow`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 mb-2">{stat.title}</p>
                <p className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</p>
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${stat.color === 'emerald' ? 'bg-emerald-500' : stat.color === 'amber' ? 'bg-amber-500' : stat.color === 'rose' ? 'bg-rose-500' : 'bg-blue-500'}`}></span>
                  <p className="text-xs text-gray-600">{stat.trend}</p>
                </div>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className={`h-8 w-8 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {(!stats || stats.nodes.total === 0) && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-12 text-center">
          <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Droplets className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Awaiting Real-Time Data</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            No water nodes registered yet. The dashboard will display real-time telemetry from Kenyan counties once nodes are added.
          </p>
          <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg">
            Add First Water Node
          </button>
        </div>
      )}
    </div>
  );
}
