
import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Server, Activity } from 'lucide-react';

export function WorkerUtilizationChart({ utilization }) {
  if (!utilization) return null;

  const pct = utilization.estimated_utilization_pct;
  
  let statusColor = 'bg-green-500';
  let textColor = 'text-green-600 dark:text-green-400';
  let statusText = 'Healthy';

  if (pct >= 80) {
    statusColor = 'bg-red-500';
    textColor = 'text-red-600 dark:text-red-400';
    statusText = 'Critical Load';
  } else if (pct >= 50) {
    statusColor = 'bg-orange-500';
    textColor = 'text-orange-600 dark:text-orange-400';
    statusText = 'Moderate Load';
  }

  return (
    <Card className="p-6 border-border/50 shadow-sm bg-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Server className="w-5 h-5 text-muted-foreground" />
          Worker Utilization
        </h3>
        <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full bg-muted ${textColor}`}>
          {statusText}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-end justify-between mb-2">
          <span className="text-4xl font-bold text-foreground">{pct}%</span>
          <span className="text-sm text-muted-foreground mb-1">
            {utilization.estimated_active_workers} / {utilization.max_concurrency} Active
          </span>
        </div>
        
        {/* Custom progress bar to allow color overrides */}
        <div className="h-4 w-full bg-secondary rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-in-out ${statusColor}`} 
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Recent Load (1m)</p>
            <p className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              {utilization.recent_minute_executions} execs
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Recent Latency</p>
            <p className="text-lg font-semibold font-mono">
              {utilization.recent_avg_latency_ms}ms
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
