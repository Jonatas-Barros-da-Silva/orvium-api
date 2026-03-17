
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';

export function ApproveButton({ onClick, isLoading, disabled, className = '' }) {
  return (
    <Button 
      onClick={onClick} 
      disabled={disabled || isLoading}
      className={`bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all active:scale-[0.98] ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <CheckCircle2 className="w-4 h-4 mr-2" />
      )}
      Approve Integration
    </Button>
  );
}
