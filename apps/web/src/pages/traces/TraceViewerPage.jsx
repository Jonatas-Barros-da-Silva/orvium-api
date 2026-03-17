
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Loader } from '@/components/ui/Loader.jsx';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ActivitySquare, AlertCircle } from 'lucide-react';
import { TraceSummaryPanel } from '@/components/traces/TraceSummaryPanel.jsx';
import { TraceTimeline } from '@/components/traces/TraceTimeline.jsx';
import { SpanDurationChart } from '@/components/traces/SpanDurationChart.jsx';
import apiServerClient from '@/lib/apiServerClient';

export default function TraceViewerPage() {
  const { trace_id } = useParams();
  const navigate = useNavigate();
  
  const [trace, setTrace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrace = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiServerClient.fetch(`/traces/${trace_id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('Trace not found');
          throw new Error('Failed to fetch trace data');
        }
        const data = await res.json();
        if (data.success) {
          setTrace(data.data);
        } else {
          throw new Error(data.error || 'Unknown error occurred');
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (trace_id) {
      fetchTrace();
    }
  }, [trace_id]);

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <Helmet>
        <title>Trace Viewer | Platform</title>
      </Helmet>

      <div className="bg-card border-b border-border/50 pt-8 pb-6 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
              <ActivitySquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                Distributed Trace
                <span className="text-sm font-mono font-normal text-muted-foreground bg-muted px-2 py-1 rounded-md">
                  {trace_id}
                </span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {trace?.expand?.integration_id?.name || 'Integration'} • Version {trace?.expand?.version_id?.version || 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-destructive">Error Loading Trace</h3>
              <p className="text-sm text-destructive/90 mt-1">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-24 flex justify-center">
            <Loader text="Loading trace data..." size={32} />
          </div>
        ) : trace ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <TraceSummaryPanel trace={trace} />
            <TraceTimeline trace={trace} />
            <SpanDurationChart trace={trace} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
