
import React from 'react';
import { Card } from '@/components/ui/card';
import { CapabilityBadge } from './CapabilityBadge.jsx';
import { Zap, ChevronRight } from 'lucide-react';

export function IntegrationCapabilities({ capabilities }) {
  if (!capabilities || capabilities.length === 0) {
    return (
      <div className="py-12 text-center border border-dashed rounded-2xl bg-muted/30">
        <Zap className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-foreground">No capabilities found</h3>
        <p className="text-muted-foreground text-sm mt-1">This integration doesn't expose any capabilities yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Capabilities & Actions</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {capabilities.map((cap) => (
          <Card key={cap.id} className="p-6 flex flex-col border-border/50 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{cap.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {cap.description || 'No description provided.'}
                </p>
              </div>
              <CapabilityBadge name={cap.is_active ? 'Active' : 'Inactive'} isActive={cap.is_active} />
            </div>
            
            <div className="mt-auto pt-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Available Actions</h4>
              {cap.actions && cap.actions.length > 0 ? (
                <ul className="space-y-2">
                  {cap.actions.map(action => (
                    <li key={action.id} className="flex items-center text-sm bg-muted/50 rounded-md p-2 border border-border/30">
                      <ChevronRight className="w-4 h-4 text-primary/70 mr-2 shrink-0" />
                      <span className="font-medium text-foreground">{action.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground font-mono bg-background px-2 py-0.5 rounded border border-border/50">
                        {action.action_key}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">No actions defined.</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
