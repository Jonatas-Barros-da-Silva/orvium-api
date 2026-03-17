
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { formatConditions } from '@/utils/conditionFormatter.js';
import { formatActions } from '@/utils/actionFormatter.js';

const RollbackConfirmationDialog = ({ isOpen, currentVersion, targetVersion, onConfirm, onCancel }) => {
  const [isRollingBack, setIsRollingBack] = useState(false);

  if (!targetVersion) return null;

  const handleConfirm = async () => {
    setIsRollingBack(true);
    try {
      await onConfirm(targetVersion.version_number);
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isRollingBack && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-primary" />
            Confirm Rollback
          </DialogTitle>
          <DialogDescription>
            You are about to rollback this automation rule from version {currentVersion} to version {targetVersion.version_number}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              This will immediately change how this automation rule behaves. A new version will be created with the configuration from version {targetVersion.version_number}.
            </AlertDescription>
          </Alert>

          <div className="space-y-3 bg-muted/50 p-4 rounded-lg border">
            <h4 className="text-sm font-semibold">Target Configuration (v{targetVersion.version_number})</h4>
            
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Event Type</p>
              <p className="text-sm">{targetVersion.event_type}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Conditions</p>
              <p className="text-sm line-clamp-2">
                {targetVersion.conditions_json?.length > 0 
                  ? formatConditions(targetVersion.conditions_json) 
                  : 'No conditions'}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Actions</p>
              <p className="text-sm line-clamp-2">
                {targetVersion.actions_json?.length > 0 
                  ? `${targetVersion.actions_json.length} action(s)` 
                  : 'No actions'}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isRollingBack}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isRollingBack} className="gap-2">
            {isRollingBack ? (
              'Rolling back...'
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                Confirm Rollback
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RollbackConfirmationDialog;
