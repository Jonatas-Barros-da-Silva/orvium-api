
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const LogDetailsDialog = ({ log, isOpen, onClose }) => {
  if (!log) return null;

  const getStatusBadge = (status) => {
    const variants = {
      success: 'default',
      failed: 'destructive',
      skipped: 'secondary',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Automation Log Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Rule Name</p>
              <p className="text-base font-semibold">{log.rule_name || 'Unknown'}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Event Type</p>
              <Badge variant="secondary">{log.event_type}</Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              {getStatusBadge(log.status)}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Execution Time</p>
              <p className="text-base">{log.execution_time_ms || 0} ms</p>
            </div>

            <div className="space-y-1 col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p className="text-base">{new Date(log.created_at).toLocaleString()}</p>
            </div>
          </div>

          {log.error_message && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">Error Message</p>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm text-destructive leading-relaxed">{log.error_message}</p>
                </div>
              </div>
            </>
          )}

          {log.action_results && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Action Results</p>
                <div className="bg-muted/50 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs font-mono leading-relaxed">
                    {JSON.stringify(log.action_results, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LogDetailsDialog;
