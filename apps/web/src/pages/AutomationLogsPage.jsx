
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Eye, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchAutomationLogs, fetchAutomationRules, fetchEventTypes } from '@/services/automationService.js';
import LogDetailsDialog from '@/components/LogDetailsDialog.jsx';
import { useToast } from '@/hooks/use-toast';

const AutomationLogsPage = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [rules, setRules] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [filters, setFilters] = useState({
    rule_id: '',
    event_type: '',
    status: '',
    limit: 20,
    offset: 0,
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      const [rulesData, eventsData] = await Promise.all([
        fetchAutomationRules(),
        fetchEventTypes(),
      ]);
      setRules(rulesData);
      setEventTypes(eventsData);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAutomationLogs(filters);
      setLogs(data.logs || data);
      if (data.total) {
        setPagination({
          currentPage: Math.floor(filters.offset / filters.limit) + 1,
          totalPages: Math.ceil(data.total / filters.limit),
        });
      }
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error loading logs',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, offset: 0 }));
  };

  const handlePageChange = (direction) => {
    const newOffset = direction === 'next'
      ? filters.offset + filters.limit
      : Math.max(0, filters.offset - filters.limit);
    setFilters((prev) => ({ ...prev, offset: newOffset }));
  };

  const openLogDetails = (log) => {
    setSelectedLog(log);
    setDialogOpen(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      success: 'default',
      failed: 'destructive',
      skipped: 'secondary',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading && logs.length === 0) {
    return (
      <div className="p-8 space-y-6">
        <Helmet>
          <title>Automation Logs - Loading</title>
        </Helmet>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <Helmet>
        <title>Automation Logs</title>
        <meta name="description" content="View automation execution logs and history" />
      </Helmet>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation Logs</h1>
          <p className="text-muted-foreground mt-1">View automation execution history</p>
        </div>
        <Button onClick={loadLogs} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Rule</Label>
          <Select value={filters.rule_id} onValueChange={(value) => updateFilter('rule_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All rules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All rules</SelectItem>
              {rules.map((rule) => (
                <SelectItem key={rule.id} value={rule.id}>
                  {rule.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Event Type</Label>
          <Select value={filters.event_type} onValueChange={(value) => updateFilter('event_type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All events</SelectItem>
              {eventTypes.map((event) => (
                <SelectItem key={event.event_name} value={event.event_name}>
                  {event.event_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Status</Label>
          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="skipped">Skipped</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Per Page</Label>
          <Select value={String(filters.limit)} onValueChange={(value) => updateFilter('limit', Number(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 border-2 border-dashed rounded-lg">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Eye className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">No logs found</p>
            <p className="text-muted-foreground">Try adjusting your filters or wait for automations to run</p>
          </div>
        </div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Execution Time</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.rule_name || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.event_type}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.execution_time_ms || 0} ms
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button onClick={() => openLogDetails(log)} variant="ghost" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {pagination.currentPage} of {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handlePageChange('prev')}
                disabled={filters.offset === 0}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                onClick={() => handlePageChange('next')}
                disabled={pagination.currentPage >= pagination.totalPages}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      <LogDetailsDialog
        log={selectedLog}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
};

export default AutomationLogsPage;
