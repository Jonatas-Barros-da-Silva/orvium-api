
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, LayoutTemplate, RefreshCw } from 'lucide-react';
import { fetchTemplates } from '@/services/templateService.js';
import { fetchEventTypes } from '@/services/automationService.js';
import TemplatePreview from '@/components/TemplatePreview.jsx';
import TemplateInstallationDialog from '@/components/TemplateInstallationDialog.jsx';
import { formatConditions } from '@/utils/conditionFormatter.js';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'financial_alerts', label: 'Financial Alerts' },
  { value: 'operations', label: 'Operations' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'risk_monitoring', label: 'Risk Monitoring' },
];

const AutomationTemplatesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [templates, setTemplates] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    category: 'all',
    event_type: 'all',
  });

  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [installTemplate, setInstallTemplate] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      const events = await fetchEventTypes();
      setEventTypes(events);
    } catch (err) {
      console.error('Failed to load event types:', err);
    }
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTemplates(filters);
      setTemplates(data);
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error loading templates',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleInstallSuccess = () => {
    setInstallTemplate(null);
    navigate('/automations');
  };

  const getCategoryColor = (category) => {
    const colors = {
      financial_alerts: 'bg-blue-100 text-blue-800 border-blue-200',
      operations: 'bg-purple-100 text-purple-800 border-purple-200',
      analytics: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      risk_monitoring: 'bg-rose-100 text-rose-800 border-rose-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <Helmet>
        <title>Automation Templates</title>
        <meta name="description" content="Browse and install pre-built automation templates" />
      </Helmet>

      <div className="flex items-center gap-4">
        <Button onClick={() => navigate('/automations')} variant="ghost" size="icon" className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation Templates</h1>
          <p className="text-muted-foreground mt-1">Quickly set up automations using pre-built templates</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-muted/30 p-4 rounded-xl border">
        <div className="w-full sm:w-64 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Category</label>
          <Select value={filters.category} onValueChange={(val) => handleFilterChange('category', val)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full sm:w-64 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Event Type</label>
          <Select value={filters.event_type} onValueChange={(val) => handleFilterChange('event_type', val)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select event type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {eventTypes.map(event => (
                <SelectItem key={event.event_name} value={event.event_name}>{event.event_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full rounded-md" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 border rounded-xl bg-muted/10">
          <p className="text-destructive font-medium">Failed to load templates</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={loadTemplates} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4 border-2 border-dashed rounded-xl">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <LayoutTemplate className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-lg font-medium">No templates found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters to see more results.</p>
          </div>
          <Button onClick={() => setFilters({ category: 'all', event_type: 'all' })} variant="outline">
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <Card key={template.id} className="flex flex-col h-full hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <Badge variant="outline" className={`text-[10px] uppercase tracking-wider font-semibold ${getCategoryColor(template.category)}`}>
                    {template.category.replace('_', ' ')}
                  </Badge>
                </div>
                <CardTitle className="text-xl leading-tight">{template.name}</CardTitle>
                <CardDescription className="text-sm mt-2 line-clamp-2">
                  {template.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1">
                <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-3 border">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Trigger</span>
                    <code className="text-xs bg-background px-1.5 py-0.5 rounded border">{template.event_type}</code>
                  </div>
                  
                  {template.conditions_json && template.conditions_json.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Conditions</span>
                      <p className="text-xs text-foreground line-clamp-2">
                        {formatConditions(template.conditions_json)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="pt-4 border-t gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setPreviewTemplate(template)}
                >
                  Preview
                </Button>
                <Button 
                  className="flex-1 gap-2"
                  onClick={() => setInstallTemplate(template)}
                >
                  <Download className="w-4 h-4" />
                  Install
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <TemplatePreview 
        template={previewTemplate} 
        isOpen={!!previewTemplate} 
        onCancel={() => setPreviewTemplate(null)}
        onInstall={(t) => {
          setPreviewTemplate(null);
          setInstallTemplate(t);
        }}
      />

      <TemplateInstallationDialog
        template={installTemplate}
        isOpen={!!installTemplate}
        onCancel={() => setInstallTemplate(null)}
        onSuccess={handleInstallSuccess}
      />
    </div>
  );
};

export default AutomationTemplatesPage;
