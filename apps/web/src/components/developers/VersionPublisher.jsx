
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, UploadCloud } from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient';

export function VersionPublisher({ integrationId, onPublished }) {
  const [version, setVersion] = useState('');
  const [adapterType, setAdapterType] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiServerClient.fetch(`/developers/integrations/${integrationId}/version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          version_name: version, 
          adapter_type: adapterType, 
          status: 'active' 
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to publish version');
      }
      
      toast.success('Version published successfully');
      setVersion('');
      setAdapterType('');
      if (onPublished) onPublished();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-card p-6 rounded-xl border border-border/50 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <UploadCloud className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Publish New Version</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="version">Version Name</Label>
          <Input 
            id="version" 
            value={version} 
            onChange={e => setVersion(e.target.value)} 
            required 
            placeholder="e.g., 1.0.0" 
            className="text-foreground bg-background" 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="adapterType">Adapter Type</Label>
          <Input 
            id="adapterType" 
            value={adapterType} 
            onChange={e => setAdapterType(e.target.value)} 
            required 
            placeholder="e.g., custom_rest_adapter" 
            className="text-foreground bg-background" 
          />
        </div>
      </div>
      
      <Button type="submit" disabled={loading || !version || !adapterType} className="w-full sm:w-auto">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Publishing...
          </>
        ) : (
          'Publish Version'
        )}
      </Button>
    </form>
  );
}
