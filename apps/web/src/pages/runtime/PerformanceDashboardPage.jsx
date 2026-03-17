
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Loader } from '@/components/ui/Loader.jsx';
import { Button } from '@/components/ui/button';
import { RefreshCw, Activity } from 'lucide-react';
import { RuntimeMetricsPanel } from '@/components/runtime/RuntimeMetricsPanel.jsx';
import { WorkerUtilizationChart } from '@/components/runtime/WorkerUtilizationChart.jsx';
import { CacheHitRatioPanel } from '@/components/runtime/CacheHitRatioPanel.jsx';
import { SlowExecutionsPanel } from '@/components/runtime/SlowExecutionsPanel.jsx';
import apiServerClient from '@/lib/apiServerClient';

export default function PerformanceDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [utilization, setUtilization] = useState(null);
  const [slowExecutions, setSlowExecutions] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [metricsRes, utilRes, slowRes] = await Promise.all([
        apiServerClient.fetch('/runtime/metrics'),
        apiServerClient.fetch('/runtime/worker-utilization'),
        apiServerClient.fetch('/runtime/slow-executions')
      ]);

      if (!metricsRes.ok || !utilRes.ok || !slowRes.ok) {
        throw new Error('Failed to fetch performance data');
      }

      const [metricsData, utilData, slowData] = await Promise.all([
        metricsRes.json(),
        utilRes.json(),
        slowRes.json()
      ]);

      setMetrics(metricsData.data);
      setUtilization(utilData.data);
      setSlowExecutions(slowData.data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <Helmet>
        <title>Runtime Performance | Platform</title>
      </Helmet>

      <div className="bg-card border-b border-border/50 pt-8 pb-6 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                Runtime Performance
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Monitor integration execution metrics, cache efficiency, and worker load.
              </p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => fetchData(true)} 
            disabled={loading || refreshing}
            className="shrink-0"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Now'}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
            {error}
          </div>
        )}

        {loading && !metrics ? (
          <div className="py-24 flex justify-center">
            <Loader text="Loading performance metrics..." size={32} />
          </div>
        ) : metrics ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <RuntimeMetricsPanel metrics={metrics} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WorkerUtilizationChart utilization={utilization} />
              <CacheHitRatioPanel cacheStats={metrics.cache} onClear={() => fetchData(true)} />
            </div>

            <div className="h-[400px]">
              <SlowExecutionsPanel executions={slowExecutions} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
