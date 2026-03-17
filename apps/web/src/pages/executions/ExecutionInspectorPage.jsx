
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Loader } from '@/components/ui/Loader.jsx';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, SearchCode, AlertCircle } from 'lucide-react';
import { ExecutionIOPanel } from '@/components/executions/ExecutionIOPanel.jsx';
import { ExecutionInputViewer } from '@/components/executions/ExecutionInputViewer.jsx';
import { ExecutionOutputViewer } from '@/components/executions/ExecutionOutputViewer.jsx';
import { ExecutionErrorViewer } from '@/components/executions/ExecutionErrorViewer.jsx';
import { ReplayExecutionButton } from '@/components/executions/ReplayExecutionButton.jsx';
import { ReplayHistoryPanel } from '@/components/executions/ReplayHistoryPanel.jsx';
import apiServerClient from '@/lib/apiServerClient';

export default function ExecutionInspectorPage() {
  const { execution_id } = useParams();
  const navigate = useNavigate();
  
  const [ioData, setIoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExecutionIO = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiServerClient.fetch(`/executions/${execution_id}/io`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('Execution IO data not found');
          throw new Error('Failed to fetch execution IO data');
        }
        const data = await res.json();
        if (data.success) {
          setIoData(data.data);
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

    if (execution_id) {
      fetchExecutionIO();
    }
  }, [execution_id]);

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <Helmet>
        <title>Execution Inspector | Platform</title>
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
              <SearchCode className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                Execution Inspector
                <span className="text-sm font-mono font-normal text-muted-foreground bg-muted px-2 py-1 rounded-md">
                  {execution_id}
                </span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {ioData?.expand?.integration_id?.name || 'Integration'} • Version {ioData?.expand?.version_id?.version || 'Unknown'}
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
              <h3 className="text-sm font-semibold text-destructive">Error Loading Execution Data</h3>
              <p className="text-sm text-destructive/90 mt-1">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-24 flex justify-center">
            <Loader text="Loading execution IO data..." size={32} />
          </div>
        ) : ioData ? (
          <div className="space-y-10 animate-in fade-in duration-500">
            
            {/* IO Data Section */}
            <div className="space-y-6">
              <ExecutionIOPanel ioData={ioData} />
              
              <Tabs defaultValue="input" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
                  <TabsTrigger value="input">Input</TabsTrigger>
                  <TabsTrigger value="output">Output</TabsTrigger>
                  <TabsTrigger value="error">Error</TabsTrigger>
                </TabsList>
                
                <TabsContent value="input" className="mt-0 outline-none">
                  <ExecutionInputViewer ioData={ioData} />
                </TabsContent>
                
                <TabsContent value="output" className="mt-0 outline-none">
                  <ExecutionOutputViewer ioData={ioData} />
                </TabsContent>
                
                <TabsContent value="error" className="mt-0 outline-none">
                  <ExecutionErrorViewer ioData={ioData} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Replay Section */}
            <div className="pt-8 border-t border-border/50">
              <h2 className="text-xl font-bold text-foreground mb-6">Execution Replay</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                <div className="h-full">
                  <ReplayExecutionButton 
                    executionId={execution_id} 
                    integrationName={ioData?.expand?.integration_id?.name} 
                  />
                </div>
                <div className="h-full min-h-[300px]">
                  <ReplayHistoryPanel executionId={execution_id} />
                </div>
              </div>
            </div>

          </div>
        ) : null}
      </div>
    </div>
  );
}
