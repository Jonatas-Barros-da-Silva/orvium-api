
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Loader } from '@/components/ui/Loader.jsx';
import { AlertCircle, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorListPanel } from '@/components/logs/ErrorListPanel.jsx';
import { ExecutionLogViewer } from '@/components/logs/ExecutionLogViewer.jsx';
import apiServerClient from '@/lib/apiServerClient';

export default function ErrorExplorerPage() {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  
  const [selectedError, setSelectedError] = useState(null);
  const [executionDetails, setExecutionDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchErrors = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await apiServerClient.fetch('/logs?log_level=error&limit=50');
      if (!res.ok) throw new Error('Failed to fetch error logs');
      const data = await res.json();
      
      if (data.success) {
        setErrors(data.data.items || []);
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error(err);
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrors();
  }, []);

  useEffect(() => {
    if (!selectedError?.execution_id) return;

    const fetchExecutionDetails = async () => {
      setDetailsLoading(true);
      try {
        const res = await apiServerClient.fetch(`/logs/executions/${selectedError.execution_id}/details`);
        if (!res.ok) throw new Error('Failed to fetch execution details');
        const data = await res.json();
        
        if (data.success) {
          setExecutionDetails(data.data);
        }
      } catch (err) {
        console.error('Error fetching details:', err);
        // Fallback: just show the selected error as a log if details fail
        setExecutionDetails({
          execution: null,
          logs: [selectedError]
        });
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchExecutionDetails();
  }, [selectedError]);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <Helmet>
        <title>Error Explorer | Platform</title>
      </Helmet>

      <div className="bg-card border-b border-border/50 pt-8 pb-6 shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center text-destructive shrink-0">
              <Bug className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                Error Explorer
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Investigate integration failures, view stack traces, and analyze execution logs.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {fetchError && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-destructive">Failed to load errors</h3>
              <p className="text-sm text-destructive/90 mt-1">{fetchError}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchErrors}>
                Retry
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-24 flex justify-center">
            <Loader text="Loading recent errors..." size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
            {/* Left Column: Error List */}
            <div className="lg:col-span-1 h-full">
              <ErrorListPanel 
                errors={errors} 
                selectedErrorId={selectedError?.id}
                onSelectError={setSelectedError}
              />
            </div>

            {/* Right Column: Execution Details & Logs */}
            <div className="lg:col-span-2 h-full overflow-y-auto pr-2">
              {detailsLoading ? (
                <div className="h-full flex items-center justify-center bg-card rounded-xl border border-border/50">
                  <Loader text="Loading execution details..." size={24} />
                </div>
              ) : (
                <ExecutionLogViewer executionDetails={executionDetails} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
