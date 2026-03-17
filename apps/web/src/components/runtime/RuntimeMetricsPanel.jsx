
import React from 'react';
import { Card } from '@/components/ui/card';
import { Activity, Clock, CheckCircle2, Zap, Database, Server, Layers, Target } from 'lucide-react';

export function RuntimeMetricsPanel({ metrics }) {
  if (!metrics) return null;

  const formatUptime = (seconds) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${seconds % 60}s`;
  };

  const stats = [
    {
      label: 'System Uptime',
      value: formatUptime(metrics.uptime_seconds),
      icon: Activity,
      color: 'text-blue-500'
    },
    {
      label: 'Total Executions',
      value: metrics.executions.total.toLocaleString(),
      icon: Zap,
      color: 'text-yellow-500'
    },
    {
      label: 'Success Rate',
      value: `${metrics.executions.success_rate}%`,
      icon: CheckCircle2,
      color: 'text-green-500'
    },
    {
      label: 'Avg Latency',
      value: `${metrics.executions.avg_latency_ms}ms`,
      icon: Clock,
      color: 'text-purple-500'
    },
    {
      label: 'Cache Hit Rate',
      value: `${metrics.cache.hitRate}%`,
      icon: Database,
      color: 'text-emerald-500'
    },
    {
      label: 'Worker Concurrency',
      value: metrics.config.worker.concurrency,
      icon: Server,
      color: 'text-indigo-500'
    },
    {
      label: 'Queue Batch Size',
      value: metrics.config.queue.batch_size,
      icon: Layers,
      color: 'text-orange-500'
    },
    {
      label: 'Trace Sampling',
      value: `${(metrics.config.sampling.trace_sampling_rate * 100).toFixed(0)}%`,
      icon: Target,
      color: 'text-pink-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card key={i} className="p-5 border-border/50 shadow-sm bg-card flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 ${stat.color}`}>
            <stat.icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {stat.label}
            </p>
            <p className="text-2xl font-bold text-foreground leading-none">
              {stat.value}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
