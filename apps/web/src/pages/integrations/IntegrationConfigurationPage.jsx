
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/Loader.jsx';
import { ArrowLeft, Settings2, AlertCircle } from 'lucide-react';
import { IntegrationConfigForm } from '@/components/configuration/IntegrationConfigForm.jsx';
import { ConfigStatusBadge } from '@/components/configuration/ConfigStatusBadge.jsx';
import { useWorkspace } from '@/hooks/useWorkspace.js';
import apiServerClient from '@/lib/apiServerClient';

export default function IntegrationConfigurationPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { workspace } = useWorkspace();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [configData, setConfigData] = useState(null);

  useEffect(() => {
    if (!workspace?.id) return;

    const fetchConfigData = async () => {
      setLoading(true);
      try {
        // 1. Check if installed and get installation ID
        const installRes = await apiServerClient.fetch(`/integrations/${slug}/installed?workspaceId=${workspace.id}`);
        if (!installRes.ok) throw new Error('Failed to check installation status');
        
        const installData = await installRes.json();
        if (!installData.installed || !installData.installationId) {
          throw new Error('Integration is not installed in this workspace');
        }

        // 2. Fetch schema using installation ID
        const schemaRes = await apiServerClient.fetch(`/installations/${installData.installationId}/config/schema`);
        if (!schemaRes.ok) throw new Error('Failed to fetch configuration schema');
        
        const schemaData = await schemaRes.json();
        setConfigData(schemaData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConfigData();
  }, [slug, workspace?.id]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader text="Loading configuration..." size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-background p-8">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" asChild className="mb-6">
            <Link to={`/integrations/${slug}`}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Integration
            </Link>
          </Button>
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4 opacity-80" />
            <h2 className="text-xl font-semibold text-destructive mb-2">Configuration Error</h2>
            <p className="text-destructive/80">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <Helmet>
        <title>Configure {configData?.appName || 'Integration'} | Platform</title>
      </Helmet>

      <div className="bg-muted/30 border-b border-border/50 pt-12 pb-10 mb-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" asChild className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
            <Link to={`/integrations/${slug}`}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Integration
            </Link>
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
              <Settings2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                  Configure {configData?.appName}
                </h1>
                <ConfigStatusBadge status={configData?.status} />
              </div>
              <p className="text-muted-foreground">
                Set up the required credentials and settings to activate this integration.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <IntegrationConfigForm 
          installationId={configData.installationId} 
          configSchema={configData.schema} 
          appSlug={slug}
        />
      </div>
    </div>
  );
}
