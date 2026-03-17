
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Activity, Layers, Hash, Calendar } from 'lucide-react';

export function TraceSummaryPanel({ trace }) {
  if (!trace) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">In Progress</Badge>;
      default:
        return <Badge variant="secondary" className="capitalize">{status}</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <Card className="p-5 border-border/50 shadow-sm bg-card flex flex-col justify-center">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Activity className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Status</span>
        </div>
        <div>{getStatusBadge(trace.status)}</div>
      </Card>

      <Card className="p-5 border-border/50 shadow-sm bg-card flex flex-col justify-center">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Clock className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Total Duration</span>
        </div>
        <div className="text-2xl font-bold text-foreground">
          {trace.total_duration_ms ? `${trace.total_duration_ms}ms` : 'N/A'}
        </div>
      </Card>

      <Card className="p-5 border-border/50 shadow-sm bg-card flex flex-col justify-center">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Layers className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Spans</span>
        </div>
        <div className="text-2xl font-bold text-foreground">
          {trace.span_count || trace.spans?.length || 0}
        </div>
      </Card>

      <Card className="p-5 border-border/50 shadow-sm bg-card flex flex-col justify-center">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Hash className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Execution ID</span>
        </div>
        <div className="text-sm font-mono text-foreground truncate" title={trace.execution_id}>
          {trace.execution_id}
        </div>
      </Card>

      <Card className="p-5 border-border/50 shadow-sm bg-card flex flex-col justify-center">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Calendar className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Started At</span>
        </div>
        <div className="text-sm font-medium text-foreground">
          {new Date(trace.started_at).toLocaleString()}
        </div>
      </Card>
    </div>
  );
}
