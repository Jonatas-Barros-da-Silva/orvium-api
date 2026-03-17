
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Loader2, Blocks } from 'lucide-react';
import { toast } from 'sonner';
import apiServerClient from '@/lib/apiServerClient';

export default function CreateIntegrationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // In a real app, developer_id would come from auth context
      const res = await apiServerClient.fetch('/developers/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          developer_id: 'dev_mock_123', 
          status: 'draft' 
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create integration');
      }
      
      const data = await res.json();
      toast.success('Integration created successfully');
      navigate(`/developers/integrations/${data.id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-24 pt-8">
      <Helmet>
        <title>Create Integration | Developer Portal</title>
      </Helmet>
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link 
          to="/developers" 
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> 
          Back to Dashboard
        </Link>
        
        <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-8 md:p-10 border-b border-border/50 bg-muted/10">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Blocks className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Integration</h1>
                <p className="text-muted-foreground mt-1">Start building a new integration for the marketplace.</p>
              </div>
            </div>
          </div>
          
          <div className="p-8 md:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base">Integration Name</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                  placeholder="e.g., Stripe Payments" 
                  className="text-foreground bg-background h-12 text-lg" 
                />
                <p className="text-sm text-muted-foreground">This is the public name that will appear in the marketplace.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base">Description</Label>
                <Textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  required 
                  placeholder="Briefly describe what this integration does and the value it provides..." 
                  className="text-foreground bg-background min-h-[150px] resize-y text-base" 
                />
              </div>
              
              <div className="pt-6 flex flex-col sm:flex-row justify-end gap-4 border-t border-border/50">
                <Button type="button" variant="outline" onClick={() => navigate('/developers')} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !formData.name} className="w-full sm:w-auto active:scale-[0.98] transition-transform">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Integration'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
