
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/Loader.jsx';
import { Plus, Settings, Activity, BookOpen, ArrowRight } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';

export default function DeveloperDashboardPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIntegrations = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        // Fetch submissions by this developer
        const submissions = await pb.collection('integration_submissions').getFullList({
          filter: `developer_id = "${currentUser.id}"`,
          sort: '-created',
          $autoCancel: false
        });

        // For a real app, we'd expand the integration_id, but since it's a text field in schema,
        // we fetch the apps manually if there are any submissions.
        let apps = [];
        if (submissions.length > 0) {
          const appIds = submissions.map(s => `"${s.integration_id}"`).join(',');
          apps = await pb.collection('integration_apps').getFullList({
            filter: `id ?= [${appIds}]`,
            $autoCancel: false
          });
        }

        const combined = submissions.map(sub => {
          const app = apps.find(a => a.id === sub.integration_id);
          return {
            ...sub,
            appDetails: app || { name: 'Unknown App', description: 'Details not found' }
          };
        });

        setIntegrations(combined);
      } catch (err) {
        console.error('Error fetching integrations:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrations();
  }, [currentUser]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'submitted': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Review</Badge>;
      default: return <Badge variant="secondary">Draft</Badge>;
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <Helmet>
        <title>Developer Dashboard | Platform</title>
      </Helmet>

      <div className="bg-card border-b border-border/50 pt-8 pb-6 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Developer Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your custom integrations and monitor their performance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/developers/docs/getting-started')}>
              <BookOpen className="w-4 h-4 mr-2" />
              Documentation
            </Button>
            <Button onClick={() => navigate('/developers/integrations/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Integration
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-24 flex justify-center">
            <Loader text="Loading your integrations..." size={32} />
          </div>
        ) : integrations.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2 border-border/60 bg-muted/10 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
              <Settings className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Integrations Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Build your first integration to connect external services with the platform and publish it to the marketplace.
            </p>
            <Button onClick={() => navigate('/developers/integrations/new')}>
              Create Your First Integration
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => (
              <Card key={integration.id} className="flex flex-col h-full border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="p-5 border-b border-border/50 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg line-clamp-1">
                      {integration.appDetails.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      ID: {integration.integration_id.substring(0, 8)}...
                    </p>
                  </div>
                  {getStatusBadge(integration.status)}
                </div>
                
                <div className="p-5 flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {integration.appDetails.description || 'No description provided.'}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-4 h-4" />
                      <span>v1.0.0</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Settings className="w-4 h-4" />
                      <span className="capitalize">{integration.appDetails.category || 'General'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted/20 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Updated {new Date(integration.updated).toLocaleDateString()}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:text-primary/80 hover:bg-primary/10"
                    onClick={() => navigate(`/developers/integrations/${integration.integration_id}`)}
                  >
                    Manage <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
