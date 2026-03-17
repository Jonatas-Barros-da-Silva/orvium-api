
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function ErrorStackViewer({ stack }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!stack) return null;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full border border-border/50 rounded-lg overflow-hidden bg-card mt-4"
    >
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full flex items-center justify-between p-3 h-auto rounded-none hover:bg-muted/50"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Code2 className="w-4 h-4 text-muted-foreground" />
            Stack Trace
          </div>
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="bg-gray-950 p-4 overflow-x-auto max-h-[400px] overflow-y-auto border-t border-border/50">
          <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-all">
            {stack}
          </pre>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
