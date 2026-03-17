
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { installTemplate } from '@/services/templateService.js';
import { formatConditions } from '@/utils/conditionFormatter.js';
import { formatActions } from '@/utils/actionFormatter.js';

const TemplateInstallationDialog = ({ template, isOpen, onSuccess, onCancel }) => {
  const [ruleName, setRuleName] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (template && isOpen) {
      setRuleName(template.name);
      setError(null);
      setSuccess(false);
      setIsInstalling(false);
    }
  }, [template, isOpen]);

  if (!template) return null;

  const handleInstall = async () => {
    if (!ruleName.trim()) {
      setError('Rule name is required');
      return;
    }

    setIsInstalling(true);
    setError(null);

    try {
      await installTemplate(template.id, ruleName);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to install template');
      setIsInstalling(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isInstalling && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Install Template</DialogTitle>
          <DialogDescription>
            Configure and install "{template.name}" to your workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {success ? (
            <Alert className="bg-green-50 text-green-900 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Template installed successfully! Redirecting...
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="ruleName">Rule Name</Label>
                <Input
                  id="ruleName"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="Enter a name for this rule"
                  disabled={isInstalling}
                />
                <p className="text-xs text-muted-foreground">
                  You can customize the name to better fit your workflow.
                </p>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg border text-sm space-y-2">
                <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Summary</p>
                <p><span className="font-medium">Event:</span> {template.event_type}</p>
                <p className="line-clamp-1"><span className="font-medium">Conditions:</span> {template.conditions_json?.length ? formatConditions(template.conditions_json) : 'None'}</p>
                <p className="line-clamp-1"><span className="font-medium">Actions:</span> {template.actions_json?.length} action(s)</p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isInstalling || success}>
            Cancel
          </Button>
          <Button onClick={handleInstall} disabled={isInstalling || success || !ruleName.trim()}>
            {isInstalling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Installing...
              </>
            ) : (
              'Install Template'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateInstallationDialog;
