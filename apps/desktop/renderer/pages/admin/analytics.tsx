import { Activity, Database, Server, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { analyticsApi } from '../../lib/api';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await analyticsApi.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  return (
    <AdminLayout>
      <div className="p-6 w-full max-w-[1400px] mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">System Analytics</h1>
          <p className="text-muted-foreground">Real-time monitoring of system health and data.</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* System Status */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">System Status</span>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground flex items-center gap-2">
                {isLoading ? (
                  'Loading...'
                ) : (
                  <>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    Online
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Uptime: {isLoading ? '-' : formatUptime(stats?.system?.uptime || 0)}
              </p>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Online Users</span>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? '-' : stats?.users?.active || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total Users: {isLoading ? '-' : stats?.users?.total || 0}
              </p>
            </div>
          </div>

          {/* Data Points */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Total Data Points</span>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? '-' : stats?.data?.estimatedDataPoints?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Across all modules</p>
            </div>
          </div>

          {/* Server Info */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Server Info</span>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Server className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">
                v{isLoading ? '-' : stats?.system?.version || '1.0.0'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">API Version</p>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Data Distribution</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Users</span>
                <span className="text-sm font-medium text-foreground">
                  {isLoading ? '-' : stats?.data?.totalUsers}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${(stats?.data?.totalUsers / (stats?.data?.estimatedDataPoints || 1)) * 100}%`,
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Suppliers</span>
                <span className="text-sm font-medium text-foreground">
                  {isLoading ? '-' : stats?.data?.totalSuppliers}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${(stats?.data?.totalSuppliers / (stats?.data?.estimatedDataPoints || 1)) * 100}%`,
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Rubber Types</span>
                <span className="text-sm font-medium text-foreground">
                  {isLoading ? '-' : stats?.data?.totalRubberTypes}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{
                    width: `${(stats?.data?.totalRubberTypes / (stats?.data?.estimatedDataPoints || 1)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
