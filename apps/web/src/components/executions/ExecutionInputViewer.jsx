
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

export function ExecutionInputViewer({ ioData }) {
  if (!ioData) return null;

  return (
    <div className="space-y-6">
      <Card className="border-border/50 shadow-sm bg-card overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/10 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Input Payload</h3>
          {ioData.input_truncated && (
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Truncated
            </Badge>
          )}
        </div>
        <div className="p-0">
          {ioData.input_payload ? (
            <pre className="text-xs bg-gray-950 text-gray-300 p-4 overflow-x-auto font-mono m-0">
              {JSON.stringify(ioData.input_payload, null, 2)}
            </pre>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No input payload recorded.
            </div>
          )}
        </div>
      </Card>

      <Card className="border-border/50 shadow-sm bg-card overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/10">
          <h3 className="font-semibold text-foreground">Execution Context</h3>
        </div>
        <div className="p-0">
          {ioData.context ? (
            <pre className="text-xs bg-gray-950 text-gray-300 p-4 overflow-x-auto font-mono m-0">
              {JSON.stringify(ioData.context, null, 2)}
            </pre>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No context recorded.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
