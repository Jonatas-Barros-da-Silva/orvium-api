
import React from 'react';
import { Button } from '@/components/ui/button';
import { XCircle, Loader2 } from 'lucide-react';

export function RejectButton({ onClick, isLoading, disabled, className = '' }) {
  return (
    <Button 
      variant="destructive"
      onClick={onClick} 
      disabled={disabled || isLoading}
      className={`shadow-sm transition-all active:scale-[0.98] ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <XCircle className="w-4 h-4 mr-2" />
      )}
      Reject Submission
    </Button>
  );
}
