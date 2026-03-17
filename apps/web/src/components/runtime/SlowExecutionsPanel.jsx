
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';

export function SlowExecutionsPanel({ executions }) {
  if (!executions) return null;

  return (
    <Card className="border-border/50 shadow-sm bg-card overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-border/50 flex items-center justify-between bg-muted/10">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-500" />
          Slow Executions
        </h3>
        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
          &gt; 2000ms
        </Badge>
      </div>

      <div className="flex-1 overflow-auto">
        {executions.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-medium text-foreground">No Slow Executions</p>
            <p className="text-sm mt-1">All recent executions completed within the threshold.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {executions.map((ex, i) => (
              <div key={i} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-foreground">
                      {ex.integrationName || 'Unknown Integration'}
                    </span>
                    {ex.status === 'failed' && (
                      <AlertTriangle className="w-3 h-3 text-destructive" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {ex.id || 'unknown_id'} • {new Date(ex.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={ex.status === 'success' ? 'secondary' : 'destructive'} className="capitalize">
                    {ex.status}
                  </Badge>
                  <div className="text-sm font-mono font-semibold text-orange-600 dark:text-orange-400 w-20 text-right">
                    {ex.latencyMs}ms
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
