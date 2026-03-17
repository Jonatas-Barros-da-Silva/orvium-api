
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import { IntegrationHeader } from '@/components/integrations/IntegrationHeader.jsx';
import { IntegrationCapabilities } from '@/components/integrations/IntegrationCapabilities.jsx';
import { InstallIntegrationButton } from '@/components/integrations/InstallIntegrationButton.jsx';
import { Loader } from '@/components/ui/Loader.jsx';
import { Button } from '@/components/ui/button';
import apiServerClient from '@/lib/apiServerClient';

export default function IntegrationDetailsPage() {
  const { slug } = useParams();
  const [integration, setIntegration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await apiServerClient.fetch(`/marketplace/integrations/${slug}`);
        if (!response.ok) {
          if (response.status === 404) throw new Error('Integration not found');
          throw new Error('Failed to load integration details');
        }
        const data = await response.json();
        setIntegration(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader text="Loading integration details..." size={32} />
      </div>
    );
  }

  if (error || !integration) {
    return (
      <div className="min-h-[100dvh] bg-background pt-20 px-4">
        <div className="max-w-3xl mx-auto text-center py-24 bg-muted/30 rounded-3xl border border-border/50">
          <AlertCircle className="w-16 h-16 text-muted-foreground/50 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Integration Unavailable</h2>
          <p className="text-muted-foreground mb-8">{error || 'The requested integration could not be found.'}</p>
          <Button asChild variant="outline">
            <Link to="/integrations">Back to Marketplace</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <Helmet>
        <title>{`${integration.name} Integration | Platform`}</title>
        <meta name="description" content={integration.description} />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link 
          to="/integrations" 
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Marketplace
        </Link>

        <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-8 md:p-10">
            <IntegrationHeader integration={integration} />
            
            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/30 p-6 rounded-2xl border border-border/50">
              <div>
                <h3 className="font-semibold text-foreground">Ready to connect?</h3>
                <p className="text-sm text-muted-foreground mt-1">Install this integration to enable its capabilities in your workspace.</p>
              </div>
              <InstallIntegrationButton 
                integrationSlug={integration.slug} 
                integrationId={integration.id}
                versionId={integration.versionId}
              />
            </div>
          </div>

          <div className="p-8 md:p-10 bg-muted/10 border-t border-border/50">
            <IntegrationCapabilities capabilities={integration.capabilities} />
          </div>
        </div>
      </div>
    </div>
  );
}
