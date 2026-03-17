
import React, { useState, useEffect } from 'react';
import { Copy, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { useToast } from '@/hooks/use-toast.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { copyToClipboard } from '@/utils/webhookUtils.js';

export default function CreateWebhookModal({ isOpen, onClose, onSuccess }) {
  const [eventTypes, setEventTypes] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secret, setSecret] = useState(null);
  const [hasSavedSecret, setHasSavedSecret] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchEventTypes();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setSelectedEvent('');
    setEndpointUrl('');
    setSecret(null);
    setHasSavedSecret(false);
    setIsSubmitting(false);
  };

  const fetchEventTypes = async () => {
    try {
      const response = await apiServerClient.fetch('/webhooks/event-types');
      if (response.ok) {
        const data = await response.json();
        setEventTypes(data.event_types || []);
      }
    } catch (error) {
      console.error('Failed to fetch event types:', error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!endpointUrl.startsWith('https://')) {
      toast({
        title: 'Invalid URL',
        description: 'Endpoint URL must use HTTPS for security.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiServerClient.fetch('/webhooks/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: selectedEvent,
          event_types: [selectedEvent], // Send both to be safe with backend expectations
          endpoint_url: endpointUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create webhook');
      }

      const data = await response.json();
      setSecret(data.secret);
      toast({
        title: 'Webhook Created',
        description: 'Successfully subscribed to event.',
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
    const success = await copyToClipboard(secret);
    if (success) {
      toast({ title: 'Copied', description: 'Webhook secret copied to clipboard.' });
    }
  };

  const handleClose = () => {
    if (secret && !hasSavedSecret) {
      toast({
        title: 'Warning',
        description: 'Please confirm you have saved the secret before closing.',
        variant: 'destructive'
      });
      return;
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Webhook Subscription</DialogTitle>
          <DialogDescription>
            Receive real-time HTTP notifications when events occur in your workspace.
          </DialogDescription>
        </DialogHeader>

        {!secret ? (
          <form onSubmit={handleCreate} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="event_type">Event Type</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent} required>
                <SelectTrigger id="event_type">
                  <SelectValue placeholder="Select an event to listen for" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((et) => (
                    <SelectItem key={et.event_name} value={et.event_name}>
                      {et.event_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endpoint_url">Endpoint URL</Label>
              <Input
                id="endpoint_url"
                type="url"
                placeholder="https://your-domain.com/webhooks"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                required
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-500">Must be a publicly accessible HTTPS URL.</p>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || !selectedEvent || !endpointUrl}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Webhook
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-6 py-4 animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col items-center justify-center text-center space-y-2 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Webhook Created Successfully</h3>
            </div>

            <Alert variant="warning" className="bg-amber-50 border-amber-200 text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 font-semibold">Save your secret now</AlertTitle>
              <AlertDescription className="text-amber-700 mt-1">
                This secret is used to verify webhook signatures. <strong>It will not be shown again.</strong> If you lose it, you will need to rotate the secret.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Webhook Secret</Label>
              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={secret} 
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
                id="saved-secret" 
                checked={hasSavedSecret} 
                onCheckedChange={setHasSavedSecret} 
              />
              <Label htmlFor="saved-secret" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                I have securely saved this secret
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
