
import React from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Clock } from 'lucide-react';

export function ErrorListPanel({ errors, selectedErrorId, onSelectError }) {
  return (
    <Card className="flex flex-col h-full border-border/50 shadow-sm bg-card overflow-hidden">
      <div className="p-4 border-b border-border/50 bg-muted/10">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-destructive" />
          Recent Errors
        </h3>
      </div>
      
      <ScrollArea className="flex-1">
        {errors.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No recent errors found.
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {errors.map((error) => {
              const isSelected = selectedErrorId === error.id;
              const appName = error.expand?.integration_id?.name || 'Unknown Integration';
              
              return (
                <button
                  key={error.id}
                  onClick={() => onSelectError(error)}
                  className={`w-full text-left p-4 transition-colors hover:bg-muted/50 ${
                    isSelected ? 'bg-destructive/5 border-l-2 border-l-destructive' : 'border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium text-foreground truncate pr-2">
                      {appName}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(error.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`text-xs line-clamp-2 ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {error.message}
                  </p>
                  {error.capability && (
                    <div className="mt-2">
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        {error.capability}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}
