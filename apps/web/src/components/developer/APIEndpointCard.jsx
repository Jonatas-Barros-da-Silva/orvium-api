
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function APIEndpointCard({ method, endpoint, description, parameters, response }) {
  const getMethodColor = (m) => {
    switch (m.toUpperCase()) {
      case 'GET': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'POST': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'PUT': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'PATCH': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <Card className="overflow-hidden border-border/50 shadow-sm mb-8">
      <div className="p-4 border-b border-border/50 bg-muted/30 flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className={cn("font-mono text-xs px-2 py-0.5", getMethodColor(method))}>
          {method.toUpperCase()}
        </Badge>
        <code className="text-sm font-semibold text-foreground break-all">
          {endpoint}
        </code>
      </div>
      
      <div className="p-5 space-y-6">
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}

        {parameters && parameters.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">Parameters</h4>
            <div className="border border-border/50 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium border-b border-border/50">Name</th>
                    <th className="px-4 py-2 font-medium border-b border-border/50">Type</th>
                    <th className="px-4 py-2 font-medium border-b border-border/50">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {parameters.map((param, idx) => (
                    <tr key={idx} className="bg-card">
                      <td className="px-4 py-3 font-mono text-xs text-foreground">
                        {param.name}
                        {param.required && <span className="text-destructive ml-1">*</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{param.type}</td>
                      <td className="px-4 py-3 text-muted-foreground">{param.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {response && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">Response Example</h4>
            <div className="rounded-lg overflow-hidden border border-border/50 bg-[hsl(var(--code-bg))]">
              <pre className="p-4 text-xs font-mono text-[hsl(var(--code-foreground))] overflow-x-auto m-0">
                <code>{JSON.stringify(response, null, 2)}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
