
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatConditions } from '@/utils/conditionFormatter.js';
import { formatActions } from '@/utils/actionFormatter.js';

const TemplatePreview = ({ template, isOpen, onInstall, onCancel }) => {
  if (!template) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{template.name}</DialogTitle>
          <DialogDescription className="text-base mt-2">
            {template.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Category:</span>
            <Badge variant="outline" className="capitalize">
              {template.category.replace('_', ' ')}
            </Badge>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 border-b">
              <h4 className="text-sm font-semibold">Rule Logic Preview</h4>
            </div>
            <div className="p-4 space-y-4 bg-card">
              <div className="space-y-1">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">IF Event Is</span>
                <div className="text-sm font-mono bg-muted/30 p-2 rounded border">
                  {template.event_type}
                </div>
              </div>

              {template.conditions_json && template.conditions_json.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">AND Conditions Match</span>
                  <div className="text-sm bg-muted/30 p-2 rounded border">
                    {formatConditions(template.conditions_json)}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">THEN Execute Actions</span>
                <div className="text-sm bg-muted/30 p-2 rounded border whitespace-pre-wrap">
                  {formatActions(template.actions_json)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Close Preview</Button>
          <Button onClick={() => onInstall(template)}>Proceed to Install</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplatePreview;
