
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChevronLeft, Settings, Code2, AlertCircle } from 'lucide-react';
import { VersionPublisher } from '@/components/developers/VersionPublisher.jsx';
import { CapabilityEditor } from '@/components/developers/CapabilityEditor.jsx';
import { Loader } from '@/components/ui/Loader.jsx';
import { Badge } from '@/components/ui/badge';
import apiServerClient from '@/lib/apiServerClient';

export default function IntegrationEditorPage() {
  const { id } = useParams();
  const [integration, setIntegration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIntegration = async () => {
    try {
      // In a real scenario, we would fetch the specific submission details
      // For now, we'll mock the response since we don't have a GET /integrations/:id endpoint in developers.js
      // We'll simulate a successful fetch
      setTimeout(() => {
        setIntegration({ 
          id, 
          name: 'Custom Integration', 
          description: 'Integration currently in development.', 
          status: 'draft' 
        });
        setLoading(false);
      }, 500);
    } catch (err) {
      console.error(err);
      setError('Failed to load integration details');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegration();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader text="Loading editor..." size={32} />
      </div>
    );
  }

  if (error || !integration) {
    return (
      <div className="min-h-[100dvh] bg-background pt-20 px-4">
        <div className="max-w-3xl mx-auto text-center py-24 bg-muted/30 rounded-3xl border border-border/50">
          <AlertCircle className="w-16 h-16 text-muted-foreground/50 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Integration Not Found</h2>
          <p className="text-muted-foreground mb-8">{error || 'The requested integration could not be found.'}</p>
          <Link to="/developers" className="text-primary hover:underline font-medium">
            Return to Developer Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-24 pt-8">
      <Helmet>
        <title>{`Edit ${integration.name} | Developer Portal`}</title>
      </Helmet>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link 
          to="/developers" 
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> 
          Back to Dashboard
        </Link>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-8 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center border border-border/50 shrink-0">
              <Code2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">{integration.name}</h1>
              <p className="text-muted-foreground mt-1 max-w-[60ch]">{integration.description}</p>
            </div>
          </div>
          <Badge variant="secondary" className="capitalize px-3 py-1 text-sm">
            {integration.status}
          </Badge>
        </div>

        <Tabs defaultValue="versions" className="w-full">
          <TabsList className="mb-8 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="versions" className="rounded-lg px-6">Versions</TabsTrigger>
            <TabsTrigger value="capabilities" className="rounded-lg px-6">Capabilities</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg px-6">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="versions" className="space-y-6 animate-in fade-in-50 duration-300">
            <div className="bg-card rounded-2xl border border-border/50 p-6 md:p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">Manage Versions</h2>
                <p className="text-muted-foreground mt-1">Publish new versions of your integration to the marketplace.</p>
              </div>
              <VersionPublisher integrationId={id} onPublished={fetchIntegration} />
            </div>
          </TabsContent>
          
          <TabsContent value="capabilities" className="space-y-6 animate-in fade-in-50 duration-300">
            <div className="bg-card rounded-2xl border border-border/50 p-6 md:p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">Manage Capabilities</h2>
                <p className="text-muted-foreground mt-1">Define what your integration can do by adding capabilities and actions.</p>
              </div>
              {/* Note: In a real app, we'd pass the active version ID here instead of integration ID */}
              <CapabilityEditor versionId={id} onSaved={fetchIntegration} />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="animate-in fade-in-50 duration-300">
            <div className="bg-card rounded-2xl border border-border/50 p-6 text-center py-24 shadow-sm">
              <Settings className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-foreground">Integration Settings</h3>
              <p className="text-muted-foreground mt-2">Advanced configuration and webhook settings coming soon.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
