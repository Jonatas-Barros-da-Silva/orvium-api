
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Blocks, Calendar, Tag } from 'lucide-react';

export function IntegrationHeader({ integration }) {
  const { name, description, category, icon_url, version, updated_at, capabilityCount } = integration;

  const formattedDate = updated_at 
    ? new Date(updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recently updated';

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center pb-8 border-b border-border/50">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border border-border/50 shrink-0 shadow-sm">
        {icon_url ? (
          <img src={icon_url} alt={`${name} logo`} className="w-full h-full object-cover" />
        ) : (
          <Blocks className="w-10 h-10 text-muted-foreground" />
        )}
      </div>
      
      <div className="flex-grow">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {name}
          </h1>
          <Badge variant="secondary" className="capitalize text-sm px-3 py-0.5">
            {category}
          </Badge>
        </div>
        
        <p className="text-lg text-muted-foreground max-w-[65ch] leading-relaxed mb-4">
          {description}
        </p>
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-medium">
          {version && (
            <div className="flex items-center gap-1.5">
              <Tag className="w-4 h-4 opacity-70" />
              v{version}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 opacity-70" />
            {formattedDate}
          </div>
          <div className="flex items-center gap-1.5">
            <Blocks className="w-4 h-4 opacity-70" />
            {capabilityCount} Capabilities
          </div>
        </div>
      </div>
    </div>
  );
}
