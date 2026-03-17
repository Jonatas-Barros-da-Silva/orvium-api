
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Loader } from '@/components/ui/Loader.jsx';
import { PlatformMetricsCard } from '@/components/analytics/PlatformMetricsCard.jsx';
import { ExecutionListPanel } from '@/components/analytics/ExecutionListPanel.jsx';
import { BarChart3, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiServerClient from '@/lib/apiServerClient';

export default function AnalyticsDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    status: '',
    integration_id: '',
    limit: 50,
    offset: 0
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch platform metrics
      const metricsRes = await apiServerClient.fetch('/analytics/platform');
      if (!metricsRes.ok) throw new Error('Failed to fetch platform metrics');
      const metricsData = await metricsRes.json();
      
      if (metricsData.success) {
        setMetrics(metricsData.data);
      }

      // Fetch executions list
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.integration_id) queryParams.append('integration_id', filters.integration_id);
      queryParams.append('limit', filters.limit);
      queryParams.append('offset', filters.offset);

      const execRes = await apiServerClient.fetch(`/analytics/executions?${queryParams.toString()}`);
      if (!execRes.ok) throw new Error('Failed to fetch executions');
      const execData = await execRes.json();
      
      if (execData.success) {
        setExecutions(execData.data.items || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <Helmet>
        <title>Integration Analytics | Platform</title>
      </Helmet>

      <div className="bg-card border-b border-border/50 pt-10 pb-8 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Integration Analytics
              </h1>
              <p className="text-muted-foreground mt-1">
                Monitor platform performance, execution health, and integration metrics.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-destructive">Failed to load analytics</h3>
              <p className="text-sm text-destructive/90 mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchDashboardData}>
                Retry
              </Button>
            </div>
          </div>
        )}

        {loading && !metrics ? (
          <div className="py-24 flex justify-center">
            <Loader text="Loading analytics data..." size={32} />
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            <PlatformMetricsCard metrics={metrics} />
            
            <ExecutionListPanel 
              executions={executions} 
              filters={filters} 
              onFilterChange={setFilters} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
