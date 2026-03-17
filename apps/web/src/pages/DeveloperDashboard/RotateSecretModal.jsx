
import React, { useState } from 'react';
import { Copy, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { useToast } from '@/hooks/use-toast.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { copyToClipboard } from '@/utils/webhookUtils.js';

export default function RotateSecretModal({ isOpen, onClose, subscription, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSecret, setNewSecret] = useState(null);
  const [hasSavedSecret, setHasSavedSecret] = useState(false);
  const { toast } = useToast();

  const handleRotate = async () => {
    setIsSubmitting(true);
    try {
      const response = await apiServerClient.fetch(`/webhooks/subscriptions/${subscription.id}/rotate-secret`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to rotate secret');
      }

      const data = await response.json();
      setNewSecret(data.secret);
      toast({
        title: 'Secret Rotated',
        description: 'The webhook secret has been successfully rotated.',
      });
      if (onSuccess) onSuccess();
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

  const handleCopySecret = async () => {
    const success = await copyToClipboard(newSecret);
    if (success) {
      toast({ title: 'Copied', description: 'New webhook secret copied to clipboard.' });
    }
  };

  const handleClose = () => {
    if (newSecret && !hasSavedSecret) {
      toast({
        title: 'Warning',
        description: 'Please confirm you have saved the new secret before closing.',
        variant: 'destructive'
      });
      return;
    }
    // Reset state on close
    setTimeout(() => {
      setNewSecret(null);
      setHasSavedSecret(false);
    }, 300);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Rotate Webhook Secret</DialogTitle>
          <DialogDescription>
            Generate a new signing secret for this webhook subscription.
          </DialogDescription>
        </DialogHeader>

        {!newSecret ? (
          <div className="space-y-4 py-4">
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800 font-semibold">Are you sure?</AlertTitle>
              <AlertDescription className="text-red-700 mt-1">
                Rotating the secret will immediately invalidate the old secret. Any incoming webhooks will fail signature verification until you update your application with the new secret.
              </AlertDescription>
            </Alert>

            <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
              <p className="text-sm font-medium text-slate-700">Target Webhook:</p>
              <p className="text-sm font-mono text-slate-600 mt-1 truncate">{subscription?.endpoint_url}</p>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="button" variant="destructive" onClick={handleRotate} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Rotate Secret
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-6 py-4 animate-in fade-in zoom-in duration-300">
            <Alert variant="warning" className="bg-amber-50 border-amber-200 text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 font-semibold">Save your new secret</AlertTitle>
              <AlertDescription className="text-amber-700 mt-1">
                Update your application immediately. <strong>This secret will not be shown again.</strong>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>New Webhook Secret</Label>
              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={newSecret} 
                  className="font-mono text-sm bg-slate-50"
                />
                <Button type="button" variant="outline" onClick={handleCopySecret} className="shrink-0">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="saved-new-secret" 
                checked={hasSavedSecret} 
                onCheckedChange={setHasSavedSecret} 
              />
              <Label htmlFor="saved-new-secret" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                I have securely saved this new secret
              </Label>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} disabled={!hasSavedSecret} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
