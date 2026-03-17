
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Clock, Activity, ChevronDown, ChevronRight, TerminalSquare } from 'lucide-react';
import { ErrorStackViewer } from './ErrorStackViewer.jsx';

export function ExecutionLogViewer({ executionDetails }) {
  const [expandedLogs, setExpandedLogs] = useState({});

  if (!executionDetails) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
        <TerminalSquare className="w-12 h-12 mb-4 opacity-20" />
        <p>Select an error from the list to view execution details and logs.</p>
      </div>
    );
  }

  const { execution, logs } = executionDetails;

  const toggleLog = (logId) => {
    setExpandedLogs(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  const getLogLevelBadge = (level) => {
    switch (level) {
      case 'error': return <Badge variant="destructive" className="text-[10px] uppercase">Error</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 text-[10px] uppercase">Warn</Badge>;
      case 'debug': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 text-[10px] uppercase">Debug</Badge>;
      default: return <Badge variant="secondary" className="text-[10px] uppercase">Info</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Execution Header */}
      <Card className="p-5 border-border/50 shadow-sm bg-card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              Execution Details
              {execution?.status === 'success' ? (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Success</Badge>
              ) : execution?.status ? (
                <Badge variant="destructive" className="capitalize">{execution.status}</Badge>
              ) : null}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 font-mono">
              {execution?.execution_id || logs?.[0]?.execution_id || 'Unknown ID'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Latency
            </p>
            <p className="text-sm font-medium">{execution?.latency_ms ? `${execution.latency_ms}ms` : 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Activity className="w-3 h-3" /> Trigger
            </p>
            <p className="text-sm font-medium capitalize">{execution?.trigger_type || 'N/A'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground mb-1">Started At</p>
            <p className="text-sm font-medium">
              {execution?.started_at ? new Date(execution.started_at).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>
      </Card>

      {/* Error Details Section */}
      {(execution?.error_type || execution?.error_message || execution?.error_stack) && (
        <Card className="p-5 border-destructive/30 bg-destructive/5 shadow-sm">
          <h3 className="text-sm font-semibold text-destructive flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4" />
            Error Information
          </h3>
          <div className="space-y-2">
            {execution.error_type && (
              <p className="text-sm"><span className="font-medium text-foreground">Type:</span> <span className="font-mono text-destructive">{execution.error_type}</span></p>
            )}
            {execution.error_message && (
              <p className="text-sm"><span className="font-medium text-foreground">Message:</span> {execution.error_message}</p>
            )}
          </div>
          <ErrorStackViewer stack={execution.error_stack} />
        </Card>
      )}

      {/* Logs List */}
      <Card className="flex-1 flex flex-col border-border/50 shadow-sm bg-card overflow-hidden min-h-[400px]">
        <div className="p-4 border-b border-border/50 bg-muted/10 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Execution Logs</h3>
          <Badge variant="secondary">{logs?.length || 0} entries</Badge>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-0">
            {logs?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No logs found for this execution.</div>
            ) : (
              <div className="divide-y divide-border/50">
                {logs?.map((log) => (
                  <div key={log.id} className="flex flex-col">
                    <div 
                      className={`p-3 flex items-start gap-3 hover:bg-muted/30 transition-colors ${log.metadata ? 'cursor-pointer' : ''}`}
                      onClick={() => log.metadata && toggleLog(log.id)}
                    >
                      <div className="mt-0.5 shrink-0 w-16">
                        {getLogLevelBadge(log.log_level)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground break-words font-mono text-[13px]">{log.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {log.metadata && (
                        <div className="shrink-0 text-muted-foreground mt-1">
                          {expandedLogs[log.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </div>
                      )}
                    </div>
                    
                    {log.metadata && expandedLogs[log.id] && (
                      <div className="px-4 pb-4 pt-1 bg-muted/10 border-t border-border/50">
                        <pre className="text-xs bg-gray-950 text-gray-300 p-3 rounded-md overflow-x-auto font-mono">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
