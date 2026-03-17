
import React, { useState, useEffect } from 'react';
import { Webhook, Plus, MoreVertical, RefreshCw, Eye, Trash2, Power, PowerOff, KeyRound, Activity, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu.jsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog.jsx';
import { useToast } from '@/hooks/use-toast.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { formatDate } from '@/utils/apiKeyUtils.js';

// Modals
import CreateWebhookModal from './CreateWebhookModal.jsx';
import RotateSecretModal from './RotateSecretModal.jsx';
import DisableEnableModal from './DisableEnableModal.jsx';
import DeleteWebhookModal from './DeleteWebhookModal.jsx';
import LogDetailsModal from './LogDetailsModal.jsx';

export default function WebhooksTab() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const { toast } = useToast();

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [rotateModalData, setRotateModalData] = useState(null);
  const [toggleModalData, setToggleModalData] = useState(null);
  const [deleteModalData, setDeleteModalData] = useState(null);
  const [logDetailsData, setLogDetailsData] = useState(null);
  
  // Retry State
  const [retryLogData, setRetryLogData] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
    fetchLogs();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoadingSubs(true);
      const response = await apiServerClient.fetch('/webhooks/subscriptions');
      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoadingSubs(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const response = await apiServerClient.fetch('/webhooks/logs?limit=20');
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleRefresh = () => {
    fetchSubscriptions();
    fetchLogs();
  };

  const handleRetryLog = async () => {
    if (!retryLogData) return;
    
    setIsRetrying(true);
    try {
      const response = await apiServerClient.fetch(`/webhooks/logs/${retryLogData.id}/retry`, {
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
      fetchLogs(); // Refresh logs to show the new attempt
    } catch (error) {
      toast({
        title: 'Retry Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsRetrying(false);
      setRetryLogData(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
      case 'success': return 'webhook-status-success';
      case 'failed': return 'webhook-status-failed';
      case 'retrying': return 'webhook-status-retrying';
      case 'disabled':
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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Webhooks</h2>
          <p className="text-sm text-slate-600 mt-1">Manage event subscriptions and monitor deliveries</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Endpoint
          </Button>
        </div>
      </div>

      {/* Subscriptions Section */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-primary" />
            Endpoints
          </CardTitle>
          <CardDescription>Active webhook subscriptions for your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Endpoint URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingSubs ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">Loading endpoints...</TableCell>
                  </TableRow>
                ) : subscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <Webhook className="w-12 h-12 mb-3 text-slate-300" />
                        <p className="text-base font-medium text-slate-900">No webhooks configured</p>
                        <p className="text-sm mt-1 mb-4">Create an endpoint to start receiving real-time events.</p>
                        <Button variant="outline" onClick={() => setIsCreateOpen(true)}>Add Endpoint</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  subscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        {sub.event_type}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-slate-600 max-w-[300px] truncate">
                        {sub.endpoint_url}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(sub.status)}>
                          {sub.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {formatDate(sub.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setRotateModalData(sub)}>
                              <KeyRound className="w-4 h-4 mr-2" /> Rotate Secret
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setToggleModalData(sub)}>
                              {sub.status === 'active' ? (
                                <><PowerOff className="w-4 h-4 mr-2" /> Disable</>
                              ) : (
                                <><Power className="w-4 h-4 mr-2" /> Enable</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setDeleteModalData(sub)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Logs Section */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Recent Deliveries
          </CardTitle>
          <CardDescription>Log of recent webhook delivery attempts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Event ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingLogs ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">Loading logs...</TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      No delivery logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-slate-600">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-600">
                        {log.event_id}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(log.status)}>
                          {log.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getTriggerBadgeClass(log.trigger_type)}>
                          {(log.trigger_type || 'automatic').replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono-num text-sm">
                        {log.response_code ? (
                          <span className={log.response_code >= 200 && log.response_code < 300 ? 'text-green-600' : 'text-red-600'}>
                            {log.response_code}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" title="View Details" onClick={() => setLogDetailsData(log)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Retry Delivery" onClick={() => setRetryLogData(log)}>
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateWebhookModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onSuccess={handleRefresh} 
      />
      
      <RotateSecretModal 
        isOpen={!!rotateModalData} 
        onClose={() => setRotateModalData(null)} 
        subscription={rotateModalData}
        onSuccess={handleRefresh}
      />
      
      <DisableEnableModal 
        isOpen={!!toggleModalData} 
        onClose={() => setToggleModalData(null)} 
        subscription={toggleModalData}
        onSuccess={handleRefresh}
      />
      
      <DeleteWebhookModal 
        isOpen={!!deleteModalData} 
        onClose={() => setDeleteModalData(null)} 
        subscription={deleteModalData}
        onSuccess={handleRefresh}
      />
      
      <LogDetailsModal 
        isOpen={!!logDetailsData} 
        onClose={() => setLogDetailsData(null)} 
        log={logDetailsData}
        onSuccess={handleRefresh}
      />

      <AlertDialog open={!!retryLogData} onOpenChange={(open) => !open && !isRetrying && setRetryLogData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resend this webhook delivery?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately trigger a new delivery attempt for this event to the configured endpoint. A new log entry will be created.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRetrying}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleRetryLog(); }} disabled={isRetrying}>
              {isRetrying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Retry Delivery
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
