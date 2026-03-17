
import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function SpanDurationChart({ trace }) {
  const data = useMemo(() => {
    if (!trace || !trace.spans) return [];
    
    return trace.spans.map(span => ({
      name: span.span_name,
      duration: span.duration_ms || 0,
      type: span.span_type
    }));
  }, [trace]);

  if (data.length === 0) return null;

  const getBarColor = (type) => {
    if (type === 'sandbox_execution') return '#a855f7'; // purple-500
    if (type === 'external_api_call') return '#f97316'; // orange-500
    if (type === 'execution_failed') return '#ef4444'; // red-500
    if (type === 'execution_completed') return '#22c55e'; // green-500
    return '#3b82f6'; // blue-500
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border/50 p-3 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-foreground mb-1">{data.name}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{data.type.replace(/_/g, ' ')}</p>
          <p className="text-sm font-mono text-primary">{data.duration}ms</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-5 border-border/50 shadow-sm bg-card mt-6">
      <h3 className="font-semibold text-foreground mb-6">Duration by Span</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(val) => `${val}ms`}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.5)' }} />
            <Bar dataKey="duration" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.type)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
