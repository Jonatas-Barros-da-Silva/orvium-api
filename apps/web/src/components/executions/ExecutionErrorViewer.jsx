
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle } from 'lucide-react';

export function ExecutionErrorViewer({ ioData }) {
  if (!ioData) return null;

  if (!ioData.error_payload) {
    return (
      <Card className="p-12 text-center text-muted-foreground border-border/50 shadow-sm flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-green-600" />
        </div>
        <p className="font-medium text-foreground">No Errors Recorded</p>
        <p className="text-sm mt-1">This execution completed without throwing any errors.</p>
      </Card>
    );
  }

  const error = ioData.error_payload;

  return (
    <div className="space-y-6">
      <Card className="border-destructive/30 shadow-sm bg-destructive/5 overflow-hidden">
        <div className="p-4 border-b border-destructive/20 bg-destructive/10 flex items-center justify-between">
          <h3 className="font-semibold text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Error Details
          </h3>
          {ioData.error_truncated && (
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Truncated
            </Badge>
          )}
        </div>
        
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">Error Name</p>
              <p className="text-sm font-mono text-destructive font-semibold">{error.name || 'UnknownError'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">Error Code</p>
              <p className="text-sm font-mono">{error.code || 'N/A'}</p>
            </div>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">Message</p>
            <p className="text-sm text-foreground bg-background/50 p-3 rounded-md border border-border/50">
              {error.message || 'No error message provided.'}
            </p>
          </div>
        </div>
      </Card>

      {error.stack && (
        <Card className="border-border/50 shadow-sm bg-card overflow-hidden">
          <div className="p-4 border-b border-border/50 bg-muted/10">
            <h3 className="font-semibold text-foreground">Stack Trace</h3>
          </div>
          <div className="p-0">
            <pre className="text-xs bg-gray-950 text-gray-300 p-4 overflow-x-auto font-mono m-0 max-h-[400px] overflow-y-auto">
              {error.stack}
            </pre>
          </div>
        </Card>
      )}

      {error.details && (
        <Card className="border-border/50 shadow-sm bg-card overflow-hidden">
          <div className="p-4 border-b border-border/50 bg-muted/10">
            <h3 className="font-semibold text-foreground">Additional Details</h3>
          </div>
          <div className="p-0">
            <pre className="text-xs bg-gray-950 text-gray-300 p-4 overflow-x-auto font-mono m-0">
              {JSON.stringify(error.details, null, 2)}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
}
