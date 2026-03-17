
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { IntegrationCard } from '@/components/integrations/IntegrationCard.jsx';
import { Loader } from '@/components/ui/Loader.jsx';
import { Blocks } from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient';

export default function IntegrationMarketplacePage() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const response = await apiServerClient.fetch('/marketplace/integrations');
        if (!response.ok) throw new Error('Failed to fetch integrations');
        const data = await response.json();
        setIntegrations(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrations();
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <Helmet>
        <title>Integration Marketplace | Platform</title>
        <meta name="description" content="Discover and install integrations to extend your workspace capabilities." />
      </Helmet>

      <div className="bg-muted/30 border-b border-border/50 pt-16 pb-12 mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4" style={{ letterSpacing: '-0.02em' }}>
            Integration Marketplace
          </h1>
          <p className="text-lg text-muted-foreground max-w-[65ch] leading-relaxed">
            Connect your favorite tools and extend your workspace capabilities. Browse our collection of verified integrations to automate your workflows.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="py-24">
            <Loader text="Loading integrations..." size={32} />
          </div>
        ) : error ? (
          <div className="text-center py-24 bg-destructive/5 rounded-2xl border border-destructive/20">
            <p className="text-destructive font-medium">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 text-sm underline hover:text-destructive/80 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : integrations.length === 0 ? (
          <div className="text-center py-32 border border-dashed rounded-2xl bg-muted/10">
            <Blocks className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground">No integrations available</h3>
            <p className="text-muted-foreground mt-2">Check back later for new tools and connections.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {integrations.map((integration) => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
