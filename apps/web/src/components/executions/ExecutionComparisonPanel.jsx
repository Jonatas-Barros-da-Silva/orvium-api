
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, ArrowRight, Clock, AlertTriangle } from 'lucide-react';

export function ExecutionComparisonPanel({ comparison }) {
  if (!comparison) return null;

  const { original, replay, comparison: results } = comparison;

  const getStatusBadge = (status) => {
    if (status === 'success' || status === 'completed') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Success</Badge>;
    }
    if (status === 'failed') {
      return <Badge variant="destructive">Failed</Badge>;
    }
    return <Badge variant="secondary" className="capitalize">{status}</Badge>;
  };

  const renderJsonBlock = (data, title) => (
    <div className="flex-1 min-w-0">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
        {title}
      </div>
      <div className="bg-gray-950 rounded-lg border border-border/50 overflow-hidden h-full">
        {data ? (
          <pre className="text-xs text-gray-300 p-4 overflow-x-auto font-mono m-0 h-full max-h-[500px] overflow-y-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : (
          <div className="p-8 text-center text-muted-foreground text-sm h-full flex items-center justify-center">
            No data recorded
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border/50 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Status Match</div>
          {results.status_match ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
              <Check className="w-5 h-5" /> Identical
            </div>
          ) : (
            <div className="flex items-center gap-2 text-destructive font-semibold">
              <X className="w-5 h-5" /> Diverged
            </div>
          )}
        </Card>

        <Card className="p-4 border-border/50 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Output Match</div>
          {results.output_match ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
              <Check className="w-5 h-5" /> Identical
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500 font-semibold">
              <AlertTriangle className="w-5 h-5" /> Changed
            </div>
          )}
        </Card>

        <Card className="p-4 border-border/50 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Error Match</div>
          {results.error_match ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
              <Check className="w-5 h-5" /> Identical
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500 font-semibold">
              <AlertTriangle className="w-5 h-5" /> Changed
            </div>
          )}
        </Card>

        <Card className="p-4 border-border/50 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Latency Diff</div>
          <div className={`flex items-center gap-2 font-semibold font-mono ${results.latency_diff <= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-500'}`}>
            <Clock className="w-4 h-4" />
            {results.latency_diff > 0 ? '+' : ''}{results.latency_diff}ms
          </div>
        </Card>
      </div>

      {/* Side-by-side Headers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Original Execution</h3>
            {getStatusBadge(original.status)}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID:</span>
              <span className="font-mono">{original.execution_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Latency:</span>
              <span className="font-mono">{original.latency_ms}ms</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 border-border/50 shadow-sm relative">
          <div className="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-background border border-border/50 rounded-full items-center justify-center z-10 text-muted-foreground">
            <ArrowRight className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Replay Execution</h3>
            {getStatusBadge(replay.status)}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID:</span>
              <span className="font-mono">{replay.execution_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Latency:</span>
              <span className="font-mono">{replay.latency_ms}ms</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Side-by-side Outputs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderJsonBlock(original.output, 'Original Output')}
        {renderJsonBlock(replay.output, 'Replay Output')}
      </div>

      {/* Side-by-side Errors (if any) */}
      {(original.error || replay.error) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderJsonBlock(original.error, 'Original Error')}
          {renderJsonBlock(replay.error, 'Replay Error')}
        </div>
      )}
    </div>
  );
}
