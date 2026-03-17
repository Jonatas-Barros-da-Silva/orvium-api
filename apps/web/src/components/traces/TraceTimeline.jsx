
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';

export function TraceTimeline({ trace }) {
  const [expandedSpans, setExpandedSpans] = useState({});

  if (!trace || !trace.spans || trace.spans.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground border-border/50 shadow-sm">
        No spans recorded for this trace.
      </Card>
    );
  }

  const traceStart = new Date(trace.started_at).getTime();
  const traceDuration = trace.total_duration_ms || 1; // Prevent division by zero

  const toggleSpan = (spanId) => {
    setExpandedSpans(prev => ({
      ...prev,
      [spanId]: !prev[spanId]
    }));
  };

  const getSpanColor = (type) => {
    if (type === 'sandbox_execution') return 'bg-purple-500';
    if (type === 'external_api_call') return 'bg-orange-500';
    if (type === 'execution_failed') return 'bg-red-500';
    if (type === 'execution_completed') return 'bg-green-500';
    return 'bg-blue-500';
  };

  return (
    <Card className="border-border/50 shadow-sm bg-card overflow-hidden">
      <div className="p-4 border-b border-border/50 bg-muted/10 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Span Timeline</h3>
        <div className="text-xs text-muted-foreground">
          Total: {trace.total_duration_ms}ms
        </div>
      </div>

      <div className="p-0">
        {/* Timeline Header (Scale) */}
        <div className="relative h-8 border-b border-border/50 bg-muted/5 flex items-center px-4">
          <div className="absolute left-4 right-24 h-full">
            {[0, 25, 50, 75, 100].map(percent => (
              <div 
                key={percent} 
                className="absolute top-0 bottom-0 border-l border-border/50 flex flex-col justify-end pb-1"
                style={{ left: `${percent}%` }}
              >
                <span className="text-[10px] text-muted-foreground -ml-3 bg-muted/5 px-1">
                  {Math.round((percent / 100) * traceDuration)}ms
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Spans List */}
        <div className="divide-y divide-border/50">
          {trace.spans.map((span) => {
            const spanStart = new Date(span.start_time).getTime();
            const leftPercent = Math.max(0, ((spanStart - traceStart) / traceDuration) * 100);
            const widthPercent = Math.max(0.5, ((span.duration_ms || 0) / traceDuration) * 100); // Min 0.5% width for visibility
            
            const hasMetadata = span.metadata && Object.keys(span.metadata).length > 0;

            return (
              <div key={span.id} className="flex flex-col">
                <div 
                  className={`p-3 flex items-center gap-4 hover:bg-muted/30 transition-colors ${hasMetadata ? 'cursor-pointer' : ''}`}
                  onClick={() => hasMetadata && toggleSpan(span.id)}
                >
                  {/* Span Info */}
                  <div className="w-48 shrink-0 flex items-center gap-2 overflow-hidden">
                    {hasMetadata ? (
                      expandedSpans[span.id] ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <div className="w-4 shrink-0" />
                    )}
                    <div className="truncate">
                      <p className="text-sm font-medium text-foreground truncate" title={span.span_name}>
                        {span.span_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">
                        {span.span_type.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>

                  {/* Timeline Bar */}
                  <div className="flex-1 relative h-8 flex items-center">
                    <div 
                      className={`absolute h-4 rounded-sm ${getSpanColor(span.span_type)} opacity-80 hover:opacity-100 transition-opacity`}
                      style={{ 
                        left: `${leftPercent}%`, 
                        width: `${Math.min(widthPercent, 100 - leftPercent)}%`,
                        minWidth: '4px'
                      }}
                      title={`${span.span_name}: ${span.duration_ms}ms`}
                    />
                  </div>

                  {/* Duration & Status */}
                  <div className="w-24 shrink-0 text-right flex flex-col items-end justify-center">
                    <span className="text-sm font-mono">{span.duration_ms || 0}ms</span>
                    {span.status === 'failed' && (
                      <Badge variant="destructive" className="text-[9px] h-4 px-1 mt-0.5">Failed</Badge>
                    )}
                  </div>
                </div>

                {/* Expanded Metadata */}
                {hasMetadata && expandedSpans[span.id] && (
                  <div className="px-12 py-3 bg-muted/10 border-t border-border/50">
                    <div className="flex items-start gap-2 mb-2">
                      <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span className="text-xs font-medium text-foreground">Span Metadata</span>
                    </div>
                    <pre className="text-xs bg-gray-950 text-gray-300 p-3 rounded-md overflow-x-auto font-mono">
                      {JSON.stringify(span.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
