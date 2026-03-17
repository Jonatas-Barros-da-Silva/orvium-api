
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

export function ExecutionOutputViewer({ ioData }) {
  if (!ioData) return null;

  return (
    <Card className="border-border/50 shadow-sm bg-card overflow-hidden">
      <div className="p-4 border-b border-border/50 bg-muted/10 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Output Payload</h3>
        {ioData.output_truncated && (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Truncated
          </Badge>
        )}
      </div>
      <div className="p-0">
        {ioData.output_payload ? (
          <pre className="text-xs bg-gray-950 text-gray-300 p-4 overflow-x-auto font-mono m-0 min-h-[300px]">
            {JSON.stringify(ioData.output_payload, null, 2)}
          </pre>
        ) : (
          <div className="p-12 text-center text-muted-foreground text-sm flex flex-col items-center">
            <p>No output payload recorded.</p>
            <p className="text-xs mt-2 opacity-70">This execution may have failed or returned no data.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
