
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient';

export function ReplayExecutionButton({ executionId, integrationName }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleReplay = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await apiServerClient.fetch(`/executions/${executionId}/replay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replay_source: 'manual_debug' })
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to trigger replay');
      }

      setSuccess(data.data.execution_id);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate(`/executions/${data.data.execution_id}/inspect`);
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 border-border/50 shadow-sm bg-card h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Play className="w-5 h-5 text-primary" />
          Replay Execution
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Trigger a new execution using the exact same input payload and context from this run. Useful for debugging {integrationName || 'this integration'}.
        </p>
      </div>

      <div className="mt-auto pt-4">
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Replay triggered successfully!</p>
              <p className="text-xs opacity-90 mt-0.5">Redirecting to new execution...</p>
            </div>
          </div>
        )}

        <Button 
          onClick={handleReplay} 
          disabled={loading || !!success} 
          className="w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Starting Replay...
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Replay Started
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2 fill-current" />
              Run Replay
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
