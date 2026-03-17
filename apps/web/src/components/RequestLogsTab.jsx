
import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Eye, Copy, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx';
import { useToast } from '@/hooks/use-toast.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { formatDate, formatLatency, getStatusBadgeVariant, copyToClipboard } from '@/utils/apiKeyUtils.js';

export default function RequestLogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    status_code: '',
    method: '',
    endpoint: '',
    request_id: ''
  });

  const limit = 50;

  useEffect(() => {
    fetchLogs();
  }, [currentPage, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * limit;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await apiServerClient.fetch(`/developer/logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      
      setLogs(data.logs || []);
      setTotalCount(data.total_count || 0);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (log) => {
    try {
      const response = await apiServerClient.fetch(`/developer/logs/${log.request_id}`);
      if (!response.ok) throw new Error('Failed to fetch log details');
      const data = await response.json();
      setSelectedLog(data.log);
      setDetailsModalOpen(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleCopyRequestId = async (requestId, e) => {
    if (e) e.stopPropagation();
    const success = await copyToClipboard(requestId);
    if (success) {
      toast({
        title: 'Copied',
        description: 'Request ID copied to clipboard'
      });
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Request Logs</h2>
          <p className="text-sm text-slate-600 mt-1">View and filter API request logs</p>
        </div>
        <Button onClick={fetchLogs} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Status Code</label>
            <Select value={filters.status_code} onValueChange={(value) => setFilters({ ...filters, status_code: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="200">200 OK</SelectItem>
                <SelectItem value="201">201 Created</SelectItem>
                <SelectItem value="400">400 Bad Request</SelectItem>
                <SelectItem value="401">401 Unauthorized</SelectItem>
                <SelectItem value="404">404 Not Found</SelectItem>
                <SelectItem value="429">429 Rate Limit</SelectItem>
                <SelectItem value="500">500 Server Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Method</label>
            <Select value={filters.method} onValueChange={(value) => setFilters({ ...filters, method: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Endpoint</label>
            <Input
              placeholder="Filter by endpoint"
              value={filters.endpoint}
              onChange={(e) => setFilters({ ...filters, endpoint: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Request ID</label>
            <div className="relative">
              <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by request ID"
                value={filters.request_id}
                onChange={(e) => setFilters({ ...filters, request_id: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Endpoint</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Latency</TableHead>
              <TableHead>Request ID</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  Loading logs...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  No logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map(log => {
                const isError = log.status_code >= 400;
                return (
                  <TableRow key={log.id} className={isError ? "bg-red-50/30" : ""}>
                    <TableCell className="text-sm text-slate-600">{formatDate(log.created_at)}</TableCell>
                    <TableCell className="font-mono text-sm">{log.endpoint}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.method}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(log.status_code)}>
                        {log.status_code}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono-num text-sm">{formatLatency(log.latency_ms)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs ${isError ? 'text-red-700 font-semibold' : 'text-slate-600'}`}>
                          {log.request_id}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => handleCopyRequestId(log.request_id, e)}
                          title="Copy Request ID"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(log)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalCount)} of {totalCount} logs
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => setCurrentPage(Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1)))}
              className="w-20 text-center"
            />
            <span className="text-sm text-slate-600">of {totalPages}</span>
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Log Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>Complete information about this API request</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-4">
              {/* Prominent Request ID Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Request ID</p>
                  <p className="font-mono text-lg font-semibold text-slate-900">{selectedLog.request_id}</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => handleCopyRequestId(selectedLog.request_id)}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy ID
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Timestamp</label>
                  <p className="text-sm mt-1">{formatDate(selectedLog.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Endpoint</label>
                  <p className="text-sm mt-1 font-mono">{selectedLog.endpoint}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Method</label>
                  <p className="text-sm mt-1">
                    <Badge variant="outline">{selectedLog.method}</Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Status Code</label>
                  <p className="text-sm mt-1">
                    <Badge variant={getStatusBadgeVariant(selectedLog.status_code)}>
                      {selectedLog.status_code}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Latency</label>
                  <p className="text-sm mt-1 font-mono-num">{formatLatency(selectedLog.latency_ms)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">IP Address</label>
                  <p className="text-sm mt-1 font-mono">{selectedLog.ip_address || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-slate-600">User Agent</label>
                  <p className="text-sm mt-1 truncate">{selectedLog.user_agent || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Request Size</label>
                  <p className="text-sm mt-1">{selectedLog.request_payload_size || 0} bytes</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Response Size</label>
                  <p className="text-sm mt-1">{selectedLog.response_payload_size || 0} bytes</p>
                </div>
              </div>
              {selectedLog.error_message && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Error Message</label>
                  <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 font-mono">{selectedLog.error_message}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
