
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Loader } from '@/components/ui/Loader.jsx';
import { Button } from '@/components/ui/button';
import { ArrowLeft, GitCompare, AlertCircle } from 'lucide-react';
import { ExecutionComparisonPanel } from '@/components/executions/ExecutionComparisonPanel.jsx';
import apiServerClient from '@/lib/apiServerClient';

export default function ExecutionComparisonPage() {
  const { original_id, replay_id } = useParams();
  const navigate = useNavigate();
  
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComparison = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiServerClient.fetch(`/executions/${original_id}/compare/${replay_id}`);
        const data = await res.json();
        
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to fetch comparison data');
        }
        
        setComparison(data.data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (original_id && replay_id) {
      fetchComparison();
    }
  }, [original_id, replay_id]);

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <Helmet>
        <title>Execution Comparison | Platform</title>
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
            Back to Inspector
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
              <GitCompare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                Execution Comparison
              </h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                Original <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{original_id}</span>
                vs Replay <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{replay_id}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-8 p-6 bg-destructive/10 border border-destructive/20 rounded-xl flex flex-col items-center text-center gap-3">
            <AlertCircle className="w-8 h-8 text-destructive opacity-80" />
            <div>
              <h3 className="text-base font-semibold text-destructive">Comparison Failed</h3>
              <p className="text-sm text-destructive/90 mt-1">{error}</p>
            </div>
            <Button variant="outline" className="mt-2" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </div>
        )}

        {loading ? (
          <div className="py-24 flex justify-center">
            <Loader text="Analyzing executions..." size={32} />
          </div>
        ) : comparison ? (
          <div className="animate-in fade-in duration-500">
            <ExecutionComparisonPanel comparison={comparison} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
