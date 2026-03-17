
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { formatAction, validateAction } from '@/utils/actionFormatter.js';
import { fetchIntegrationAdapters } from '@/services/automationService.js';

const ACTION_TYPES = [
  { value: 'send_notification', label: 'Send Notification' },
  { value: 'trigger_integration', label: 'Trigger Integration' },
  { value: 'create_internal_task', label: 'Create Internal Task' },
  { value: 'update_status', label: 'Update Status' },
  { value: 'send_webhook', label: 'Send Webhook' },
];

const NOTIFICATION_CHANNELS = [
  { value: 'internal', label: 'Internal' },
  { value: 'email', label: 'Email' },
  { value: 'slack', label: 'Slack' },
];

const ActionBuilder = ({ actions, onActionsChange }) => {
  const [adapters, setAdapters] = useState([]);

  useEffect(() => {
    loadAdapters();
  }, []);

  const loadAdapters = async () => {
    try {
      const data = await fetchIntegrationAdapters();
      setAdapters(data);
    } catch (err) {
      console.error('Failed to load adapters:', err);
    }
  };

  const addAction = () => {
    onActionsChange([...actions, { type: '', channel: '', adapter: '', task_type: '' }]);
  };

  const removeAction = (index) => {
    const updated = actions.filter((_, i) => i !== index);
    onActionsChange(updated);
  };

  const updateAction = (index, field, value) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], [field]: value };
    onActionsChange(updated);
  };

  const renderActionParameters = (action, index) => {
    switch (action.type) {
      case 'send_notification':
        return (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Channel</Label>
            <Select
              value={action.channel || ''}
              onValueChange={(value) => updateAction(index, 'channel', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_CHANNELS.map((channel) => (
                  <SelectItem key={channel.value} value={channel.value}>
                    {channel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'trigger_integration':
        return (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Integration Adapter</Label>
            <Select
              value={action.adapter || ''}
              onValueChange={(value) => updateAction(index, 'adapter', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select adapter" />
              </SelectTrigger>
              <SelectContent>
                {adapters.map((adapter) => (
                  <SelectItem key={adapter.adapter_name} value={adapter.adapter_name}>
                    {adapter.adapter_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'create_internal_task':
        return (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Task Type</Label>
            <Input
              value={action.task_type || ''}
              onChange={(e) => updateAction(index, 'task_type', e.target.value)}
              placeholder="Enter task type"
            />
          </div>
        );

      case 'update_status':
        return (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">New Status</Label>
            <Input
              value={action.new_status || ''}
              onChange={(e) => updateAction(index, 'new_status', e.target.value)}
              placeholder="Enter new status"
            />
          </div>
        );

      case 'send_webhook':
        return (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Webhook URL</Label>
            <Input
              value={action.webhook_url || ''}
              onChange={(e) => updateAction(index, 'webhook_url', e.target.value)}
              placeholder="https://example.com/webhook"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Actions</Label>
        <Button onClick={addAction} size="sm" variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Action
        </Button>
      </div>

      {actions.length === 0 && (
        <Card className="p-6 text-center text-muted-foreground">
          No actions added. Click "Add Action" to start.
        </Card>
      )}

      {actions.map((action, index) => (
        <Card key={index} className="p-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Action Type</Label>
                <Select
                  value={action.type}
                  onValueChange={(value) => updateAction(index, 'type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select action type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {renderActionParameters(action, index)}
            </div>

            <Button
              onClick={() => removeAction(index)}
              size="icon"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {validateAction(action) && (
            <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
              <span className="font-medium">Preview:</span> {formatAction(action)}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default ActionBuilder;
