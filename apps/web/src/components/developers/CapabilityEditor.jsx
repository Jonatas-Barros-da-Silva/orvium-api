
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Zap } from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient';

export function CapabilityEditor({ versionId, onSaved }) {
  const [formData, setFormData] = useState({ name: '', capability_key: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiServerClient.fetch(`/developers/integrations/${versionId}/capabilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, is_active: true })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save capability');
      }
      
      toast.success('Capability added successfully');
      setFormData({ name: '', capability_key: '', description: '' });
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-card p-6 rounded-xl border border-border/50 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Add Capability</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cap_name">Capability Name</Label>
          <Input 
            id="cap_name" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            required 
            placeholder="e.g., Payment Processing" 
            className="text-foreground bg-background" 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capability_key">Unique Key</Label>
          <Input 
            id="capability_key" 
            value={formData.capability_key} 
            onChange={e => setFormData({...formData, capability_key: e.target.value})} 
            required 
            placeholder="e.g., payment_processing" 
            className="text-foreground bg-background font-mono text-sm" 
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="cap_description">Description</Label>
        <Textarea 
          id="cap_description" 
          value={formData.description} 
          onChange={e => setFormData({...formData, description: e.target.value})} 
          placeholder="Describe what this capability allows the integration to do..." 
          className="text-foreground bg-background min-h-[100px]" 
        />
      </div>
      
      <Button type="submit" disabled={loading || !formData.name || !formData.capability_key} className="w-full sm:w-auto">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Capability'
        )}
      </Button>
    </form>
  );
}
