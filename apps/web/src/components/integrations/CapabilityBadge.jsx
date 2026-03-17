
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function CapabilityBadge({ name, isActive = true, className }) {
  return (
    <Badge 
      variant={isActive ? "secondary" : "outline"} 
      className={cn(
        "font-medium transition-colors",
        isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-muted-foreground",
        className
      )}
    >
      {name}
    </Badge>
  );
}
