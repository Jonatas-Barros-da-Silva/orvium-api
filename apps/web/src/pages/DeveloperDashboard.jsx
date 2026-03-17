
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Key, Activity, FileText, BookOpen, TrendingUp, Webhook, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { useToast } from '@/hooks/use-toast.js';
import apiServerClient from '@/lib/apiServerClient.js';
import ApiKeysTab from '@/components/ApiKeysTab.jsx';
import UsageMetricsTab from '@/components/UsageMetricsTab.jsx';
import RequestLogsTab from '@/components/RequestLogsTab.jsx';
import DocumentationTab from '@/components/DocumentationTab.jsx';
import WebhooksTab from '@/pages/DeveloperDashboard/WebhooksTab.jsx';
import EventReplayTab from '@/pages/DeveloperDashboard/EventReplayTab.jsx';
import { formatNumber } from '@/utils/apiKeyUtils.js';

export default function DeveloperDashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      
      // Fetch API keys count
      const keysResponse = await apiServerClient.fetch('/developer/api-keys');
      const keysData = await keysResponse.json();
      const activeKeys = keysData.keys?.filter(k => k.status === 'active').length || 0;
      const revokedKeys = keysData.keys?.filter(k => k.status === 'revoked').length || 0;

      // Fetch 24h metrics
      const metricsResponse = await apiServerClient.fetch('/developer/metrics?time_period=24h');
      const metricsData = await metricsResponse.json();

      setOverview({
        total_keys: keysData.keys?.length || 0,
        active_keys: activeKeys,
        revoked_keys: revokedKeys,
        total_requests: metricsData.metrics?.total_requests || 0,
        average_latency: metricsData.metrics?.average_latency || 0,
        error_rate: metricsData.metrics?.error_rate || 0
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load overview data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Developer Dashboard - Orvium API</title>
        <meta name="description" content="Manage API keys, webhooks, monitor usage, and access documentation for the Orvium API" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Developer Dashboard</h1>
          <p className="text-slate-600 mt-2">Manage your API integration, webhooks, and monitor usage</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1 flex-wrap h-auto">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Key className="w-4 h-4 mr-2" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Webhook className="w-4 h-4 mr-2" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="event-replay" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Event Replay
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              Request Logs
            </TabsTrigger>
            <TabsTrigger value="metrics" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Activity className="w-4 h-4 mr-2" />
              Usage Metrics
            </TabsTrigger>
            <TabsTrigger value="docs" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <BookOpen className="w-4 h-4 mr-2" />
              Documentation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">API Keys</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono-num text-slate-900">
                    {loading ? '...' : overview?.total_keys || 0}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="success">{overview?.active_keys || 0} active</Badge>
                    <Badge variant="destructive">{overview?.revoked_keys || 0} revoked</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Requests (24h)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono-num text-slate-900">
                    {loading ? '...' : formatNumber(overview?.total_requests || 0)}
                  </div>
                  <p className="text-sm text-slate-600 mt-2">Total API calls in the last 24 hours</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-slate-600">Avg Latency:</span>
                      <span className="text-lg font-bold font-mono-num text-slate-900 ml-2">
                        {loading ? '...' : `${parseFloat(overview?.average_latency || 0).toFixed(0)}ms`}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-600">Error Rate:</span>
                      <span className="text-lg font-bold font-mono-num text-red-600 ml-2">
                        {loading ? '...' : `${parseFloat(overview?.error_rate || 0).toFixed(1)}%`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and resources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start h-auto py-4" asChild>
                    <a href="#api-keys" onClick={(e) => { e.preventDefault(); document.querySelector('[value="api-keys"]').click(); }}>
                      <div className="text-left">
                        <div className="font-semibold">Create API Key</div>
                        <div className="text-sm text-slate-600">Generate a new API key for your application</div>
                      </div>
                    </a>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-4" asChild>
                    <a href="#webhooks" onClick={(e) => { e.preventDefault(); document.querySelector('[value="webhooks"]').click(); }}>
                      <div className="text-left">
                        <div className="font-semibold">Configure Webhooks</div>
                        <div className="text-sm text-slate-600">Set up real-time event notifications</div>
                      </div>
                    </a>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-4" asChild>
                    <a href="#event-replay" onClick={(e) => { e.preventDefault(); document.querySelector('[value="event-replay"]').click(); }}>
                      <div className="text-left">
                        <div className="font-semibold">Replay Events</div>
                        <div className="text-sm text-slate-600">Resend historical events to endpoints</div>
                      </div>
                    </a>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-4" asChild>
                    <a href="#docs" onClick={(e) => { e.preventDefault(); document.querySelector('[value="docs"]').click(); }}>
                      <div className="text-left">
                        <div className="font-semibold">View Documentation</div>
                        <div className="text-sm text-slate-600">Learn how to integrate with the API</div>
                      </div>
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-keys">
            <ApiKeysTab />
          </TabsContent>

          <TabsContent value="webhooks">
            <WebhooksTab />
          </TabsContent>

          <TabsContent value="event-replay">
            <EventReplayTab />
          </TabsContent>

          <TabsContent value="logs">
            <RequestLogsTab />
          </TabsContent>

          <TabsContent value="metrics">
            <UsageMetricsTab />
          </TabsContent>

          <TabsContent value="docs">
            <DocumentationTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
