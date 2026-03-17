
import React from 'react';
import { Card } from '@/components/ui/card';
import { Activity, CheckCircle2, XCircle, Clock, Zap, Layers } from 'lucide-react';

export function PlatformMetricsCard({ metrics }) {
  if (!metrics) return null;

  const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num || 0);
  const formatPercent = (num) => `${(num || 0).toFixed(1)}%`;
  const formatMs = (num) => `${Math.round(num || 0)}ms`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Executions */}
      <Card className="p-6 rounded-xl shadow-sm border-border/50 bg-card flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">Total Executions</p>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h3 className="text-3xl font-bold text-foreground tracking-tight">
            {formatNumber(metrics.total_executions)}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="text-foreground font-medium">{formatNumber(metrics.executions_today)}</span> today
          </p>
        </div>
      </Card>

      {/* Success Rate */}
      <Card className="p-6 rounded-xl shadow-sm border-border/50 bg-card flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h3 className="text-3xl font-bold text-green-600 tracking-tight">
            {formatPercent(metrics.success_rate)}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {formatNumber(metrics.success_count)} successful
          </p>
        </div>
      </Card>

      {/* Failure Rate */}
      <Card className="p-6 rounded-xl shadow-sm border-border/50 bg-card flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">Failure Rate</p>
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h3 className="text-3xl font-bold text-red-600 tracking-tight">
            {formatPercent(metrics.failure_rate)}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {formatNumber(metrics.failure_count)} failed
          </p>
        </div>
      </Card>

      {/* Avg Latency */}
      <Card className="p-6 rounded-xl shadow-sm border-border/50 bg-card flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">Avg Latency</p>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h3 className="text-3xl font-bold text-foreground tracking-tight">
            {formatMs(metrics.avg_latency)}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Min: {formatMs(metrics.min_latency)} / Max: {formatMs(metrics.max_latency)}
          </p>
        </div>
      </Card>

      {/* Breakdown Row */}
      <Card className="p-6 rounded-xl shadow-sm border-border/50 bg-card md:col-span-2">
        <h4 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4" /> Executions by Status
        </h4>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(metrics.executions_by_status || {}).map(([status, count]) => (
            <div key={status} className="bg-muted/30 p-3 rounded-lg border border-border/50">
              <p className="text-xs text-muted-foreground capitalize mb-1">{status}</p>
              <p className="text-lg font-semibold text-foreground">{formatNumber(count)}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 rounded-xl shadow-sm border-border/50 bg-card md:col-span-2">
        <h4 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4" /> Executions by Trigger
        </h4>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(metrics.executions_by_trigger || {}).map(([trigger, count]) => (
            <div key={trigger} className="bg-muted/30 p-3 rounded-lg border border-border/50">
              <p className="text-xs text-muted-foreground capitalize mb-1">{trigger}</p>
              <p className="text-lg font-semibold text-foreground">{formatNumber(count)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
