
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Database, HardDrive, Info } from 'lucide-react';

export function ExecutionIOPanel({ ioData }) {
  if (!ioData) return null;

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasError = !!ioData.error_payload_json;
  const hasOutput = !!ioData.output_payload_json;
  const isTruncated = ioData.input_truncated || ioData.output_truncated || ioData.error_truncated;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="p-5 border-border/50 shadow-sm bg-card flex flex-col justify-center">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Info className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Status</span>
        </div>
        <div>
          {hasError ? (
            <Badge variant="destructive" className="flex w-fit items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Failed
            </Badge>
          ) : hasOutput ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 flex w-fit items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Success
            </Badge>
          ) : (
            <Badge variant="secondary">Pending / No Output</Badge>
          )}
        </div>
      </Card>

      <Card className="p-5 border-border/50 shadow-sm bg-card flex flex-col justify-center">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Database className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Total Payload Size</span>
        </div>
        <div className="text-2xl font-bold text-foreground">
          {formatBytes(ioData.payload_size_bytes)}
        </div>
      </Card>

      <Card className="p-5 border-border/50 shadow-sm bg-card flex flex-col justify-center">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <HardDrive className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Data Integrity</span>
        </div>
        <div>
          {isTruncated ? (
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
              Truncated (Exceeded Limit)
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Full Capture
            </Badge>
          )}
        </div>
      </Card>

      <Card className="p-5 border-border/50 shadow-sm bg-card flex flex-col justify-center">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Info className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Action</span>
        </div>
        <div className="text-sm font-medium text-foreground truncate" title={`${ioData.capability} / ${ioData.action}`}>
          {ioData.capability} <span className="text-muted-foreground mx-1">/</span> {ioData.action}
        </div>
      </Card>
    </div>
  );
}
