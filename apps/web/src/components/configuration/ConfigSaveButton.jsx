
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, Save } from 'lucide-react';

export function ConfigSaveButton({ isSubmitting, disabled }) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/50">
      <div className="flex items-center text-sm text-muted-foreground">
        <Lock className="w-4 h-4 mr-2 text-primary/60" />
        Sensitive values are encrypted at rest using AES-256-GCM.
      </div>
      <Button 
        type="submit" 
        disabled={isSubmitting || disabled}
        className="w-full sm:w-auto shadow-sm transition-all active:scale-[0.98]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving Configuration...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </>
        )}
      </Button>
    </div>
  );
}
