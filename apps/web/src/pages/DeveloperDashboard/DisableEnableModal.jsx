
import React, { useState } from 'react';
import { Power, PowerOff, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { useToast } from '@/hooks/use-toast.js';
import apiServerClient from '@/lib/apiServerClient.js';

export default function DisableEnableModal({ isOpen, onClose, subscription, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  if (!subscription) return null;

  const isCurrentlyActive = subscription.status === 'active';
  const action = isCurrentlyActive ? 'disable' : 'enable';
  const title = isCurrentlyActive ? 'Disable Webhook' : 'Enable Webhook';

  const handleToggle = async () => {
    setIsSubmitting(true);
    try {
      const response = await apiServerClient.fetch(`/webhooks/subscriptions/${subscription.id}/${action}`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to ${action} webhook`);
      }

      toast({
        title: `Webhook ${isCurrentlyActive ? 'Disabled' : 'Enabled'}`,
        description: `The webhook has been successfully ${isCurrentlyActive ? 'disabled' : 'enabled'}.`,
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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isCurrentlyActive 
              ? 'Disabling this webhook will pause all event deliveries to this endpoint. You can re-enable it at any time.'
              : 'Enabling this webhook will resume event deliveries to this endpoint.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
            <p className="text-sm font-medium text-slate-700">Endpoint:</p>
            <p className="text-sm font-mono text-slate-600 mt-1 truncate">{subscription.endpoint_url}</p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            type="button" 
            variant={isCurrentlyActive ? 'destructive' : 'default'} 
            onClick={handleToggle} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : isCurrentlyActive ? (
              <PowerOff className="w-4 h-4 mr-2" />
            ) : (
              <Power className="w-4 h-4 mr-2" />
            )}
            {isCurrentlyActive ? 'Disable' : 'Enable'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
