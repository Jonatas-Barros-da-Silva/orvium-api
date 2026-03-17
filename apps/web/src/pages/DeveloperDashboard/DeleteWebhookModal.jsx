
import React, { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.jsx';
import { useToast } from '@/hooks/use-toast.js';
import apiServerClient from '@/lib/apiServerClient.js';

export default function DeleteWebhookModal({ isOpen, onClose, subscription, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  if (!subscription) return null;

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const response = await apiServerClient.fetch(`/webhooks/subscriptions/${subscription.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to delete webhook');
      }

      toast({
        title: 'Webhook Deleted',
        description: 'The webhook subscription has been permanently removed.',
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Webhook</DialogTitle>
          <DialogDescription>
            Permanently remove this webhook subscription.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800 font-semibold">This action cannot be undone</AlertTitle>
            <AlertDescription className="text-red-700 mt-1">
              You will no longer receive events at this endpoint. Delivery logs associated with this webhook will also be deleted.
            </AlertDescription>
          </Alert>

          <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
            <p className="text-sm font-medium text-slate-700">Endpoint:</p>
            <p className="text-sm font-mono text-slate-600 mt-1 truncate">{subscription.endpoint_url}</p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Delete Webhook
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
