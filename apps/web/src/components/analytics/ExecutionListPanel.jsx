
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Filter, Clock, Zap, AlertCircle } from 'lucide-react';

export function ExecutionListPanel({ executions, filters, onFilterChange }) {
  
  const toggleStatusFilter = (status) => {
    if (filters.status === status) {
      onFilterChange({ ...filters, status: '' });
    } else {
      onFilterChange({ ...filters, status });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Success</Badge>;
      case 'failure':
      case 'error':
        return <Badge variant="destructive" className="capitalize">{status}</Badge>;
      case 'timeout':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200">Timeout</Badge>;
      default:
        return <Badge variant="secondary" className="capitalize">{status}</Badge>;
    }
  };

  return (
    <Card className="rounded-xl shadow-sm border-border/50 bg-card overflow-hidden flex flex-col">
      <div className="p-5 border-b border-border/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/10">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Execution Logs</h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {['success', 'failure', 'timeout', 'error'].map(status => (
            <Button
              key={status}
              variant={filters.status === status ? "default" : "outline"}
              size="sm"
              onClick={() => toggleStatusFilter(status)}
              className="capitalize h-8 text-xs"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[180px]">Integration</TableHead>
              <TableHead>Capability / Action</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Latency</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead className="text-right">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {executions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                    <p>No executions found matching the current filters.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              executions.map((exec) => (
                <TableRow key={exec.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium text-foreground">
                    {exec.integration_id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{exec.capability}</span>
                      <span className="text-xs text-muted-foreground">{exec.action}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(exec.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 mr-1.5" />
                      {exec.latency_ms}ms
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground capitalize">
                      <Zap className="w-3.5 h-3.5 mr-1.5" />
                      {exec.trigger_type}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {new Date(exec.created).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
