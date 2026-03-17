
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Loader({ className, text, size = 24, ...props }) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-4 space-y-3", className)} {...props}>
      <Loader2 
        size={size} 
        className="animate-spin text-primary" 
        aria-hidden="true"
      />
      {text && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
