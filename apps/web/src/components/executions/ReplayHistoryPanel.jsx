
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, GitCompare, ChevronRight, AlertCircle } from 'lucide-react';
import { Loader } from '@/components/ui/Loader.jsx';
import apiServerClient from '@/lib/apiServerClient';

export function ReplayHistoryPanel({ executionId }) {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await apiServerClient.fetch(`/executions/${executionId}/replays`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to fetch history');
        setHistory(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (executionId) {
      fetchHistory();
    }
  }, [executionId]);

  const getStatusColor = (status) => {
    if (status === 'success' || status === 'completed') return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'failed') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-secondary text-secondary-foreground';
  };

  return (
    <Card className="border-border/50 shadow-sm bg-card h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-border/50 bg-muted/10 flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          Replay History
        </h3>
        <Badge variant="secondary">{history.length} Replays</Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-0">
        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader text="Loading history..." size={24} />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-destructive flex flex-col items-center">
            <AlertCircle className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-sm">{error}</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No replays have been triggered for this execution yet.
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {history.map((replay) => (
              <div 
                key={replay.id} 
                className="p-4 hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono font-medium text-foreground">
                        {replay.execution_id}
                      </span>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider h-5">
                        {replay.replay_source?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(replay.created).toLocaleString()}
                    </div>
                  </div>
                  <Badge className={getStatusColor(replay.status)}>
                    {replay.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs font-mono text-muted-foreground">
                    {replay.latency_ms}ms
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => navigate(`/executions/${executionId}/compare/${replay.execution_id}`)}
                      className="text-xs flex items-center gap-1 text-primary hover:underline font-medium"
                    >
                      <GitCompare className="w-3 h-3" /> Compare
                    </button>
                    <button 
                      onClick={() => navigate(`/executions/${replay.execution_id}/inspect`)}
                      className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Inspect <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
