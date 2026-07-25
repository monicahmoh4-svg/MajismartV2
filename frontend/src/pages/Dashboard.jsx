import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Droplets, Activity, AlertTriangle, ServerOff, MapPin, TrendingUp, RefreshCw } from 'lucide-react';

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
      setError('Failed to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <RefreshCw className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="text-gray-500 font-medium">Loading real-time data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4 bg-red-50 rounded-2xl border border-red-100 p-8">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="text-red-600 font-semibold text-lg">{error}</p>
        <button onClick={fetchStats} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium">
          Retry
        </button>
      </div>
    );
  }

  const hasData = stats?.nodes?.total > 0;

  return (
    <div className="space-y-8 transition-opacity duration-500 ease-in-out">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Welcome back, <span className="font-semibold text-blue-600">{user?.name || 'User'}</span>. Here is the real-time status of Kenyan water networks.</p>
        </div>
        <button onClick={fetchStats} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Water Nodes" value={stats?.nodes?.total || 0} icon={Droplets} color="blue" trend="Active monitoring" />
        <StatCard title="Active & Online" value={stats?.nodes?.active || 0} icon={Activity} color="emerald" trend="Operating normally" />
        <StatCard title="Warnings / Maintenance" value={stats?.nodes?.warning || 0} icon={AlertTriangle} color="amber" trend="Requires attention" />
        <StatCard title="Offline Nodes" value={stats?.nodes?.offline || 0} icon={ServerOff} color="rose" trend="Connection lost" />
      </div>

      {/* Empty State or Data View */}
      {!hasData ? (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 p-12 text-center">
          <div className="mx-auto h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <MapPin className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Awaiting Real-Time Data</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            No water nodes have been registered yet. The dashboard will display real-time telemetry from Kenyan counties as soon as the first node is added to the network.
          </p>
          <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
            Add First Water Node
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Network Status</h3>
          </div>
          <p className="text-gray-600">
            Successfully connected to <span className="font-bold text-gray-900">{stats.nodes.total}</span> water nodes across Kenya. 
            Real-time telemetry is actively being processed. Navigate to the <span className="font-semibold text-blue-600">Water Points</span> or <span className="font-semibold text-blue-600">Alerts</span> sections for detailed regional data.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
          <p className="text-xs font-medium text-gray-400 mt-2 flex items-center gap-1">
            <span className={`inline-block w-2 h-2 rounded-full ${color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : color === 'rose' ? 'bg-rose-500' : 'bg-blue-500'}`}></span>
            {trend}
          </p>
        </div>
        <div className={`p-3 rounded-xl border ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
