
import React, { useState } from 'react';
import { Copy, Clock, AlertCircle, CheckCircle2, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { useToast } from '@/hooks/use-toast.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { copyToClipboard } from '@/utils/webhookUtils.js';
import { formatDate } from '@/utils/apiKeyUtils.js';

export default function LogDetailsModal({ isOpen, onClose, log, onSuccess }) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [showRetryConfirm, setShowRetryConfirm] = useState(false);
  const { toast } = useToast();

  if (!log) return null;

  const handleCopyEventId = async () => {
    const success = await copyToClipboard(log.event_id);
    if (success) {
      toast({ title: 'Copied', description: 'Event ID copied to clipboard.' });
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const response = await apiServerClient.fetch(`/webhooks/logs/${log.id}/retry`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || errorData.error || 'Failed to retry webhook');
      }

      toast({
        title: 'Webhook redelivery triggered',
        description: 'A new delivery attempt has been scheduled.',
      });
      setShowRetryConfirm(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: 'Retry Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'retrying': return <RefreshCw className="w-5 h-5 text-amber-600" />;
      default: return <Clock className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'success': return 'webhook-status-success';
      case 'failed': return 'webhook-status-failed';
      case 'retrying': return 'webhook-status-retrying';
      default: return 'webhook-status-pending';
    }
  };

  const getTriggerBadgeClass = (triggerType) => {
    switch (triggerType) {
      case 'manual_retry': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'event_replay': return 'bg-green-100 text-green-800 border-green-200';
      case 'automatic':
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getStatusIcon(log.status)}
              Webhook Delivery Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this delivery attempt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Header Info */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Event ID</p>
                <p className="font-mono text-sm font-semibold text-slate-900">{log.event_id}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCopyEventId}
                className="shrink-0"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy ID
              </Button>
            </div>

            {/* Grid Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Status</label>
                <div className="mt-1">
                  <Badge className={getStatusBadgeClass(log.status)}>
                    {log.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Triggered By</label>
                <div className="mt-1">
                  <Badge variant="outline" className={getTriggerBadgeClass(log.trigger_type)}>
                    {(log.trigger_type || 'automatic').replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Timestamp</label>
                <p className="text-sm mt-1">{formatDate(log.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Attempt Number</label>
                <p className="text-sm mt-1 font-mono-num">{log.attempt_number} / 10</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-slate-600">Endpoint URL</label>
                <p className="text-sm mt-1 font-mono break-all bg-slate-50 p-2 rounded border border-slate-100">
                  {log.endpoint_url}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Response Code</label>
                <p className="text-sm mt-1 font-mono-num">
                  {log.response_code ? (
                    <span className={log.response_code >= 200 && log.response_code < 300 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {log.response_code}
                    </span>
                  ) : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Response Time</label>
                <p className="text-sm mt-1 font-mono-num">{log.response_time_ms ? `${log.response_time_ms}ms` : 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Next Retry</label>
                <p className="text-sm mt-1">
                  {log.next_retry_at ? formatDate(log.next_retry_at) : 'None scheduled'}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {log.error_message && (
              <div>
                <label className="text-sm font-medium text-slate-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  Error Details
                </label>
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-mono whitespace-pre-wrap break-words">
                    {log.error_message}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={() => setShowRetryConfirm(true)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showRetryConfirm} onOpenChange={setShowRetryConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resend this webhook delivery?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately trigger a new delivery attempt for this event to the configured endpoint. A new log entry will be created.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRetrying}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleRetry(); }} disabled={isRetrying}>
              {isRetrying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Retry Delivery
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
