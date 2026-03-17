
import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, Blocks } from 'lucide-react';

export function IntegrationCard({ integration }) {
  const { name, slug, description, category, capabilityCount, icon_url } = integration;

  return (
    <Link to={`/integrations/${slug}`} className="block group h-full">
      <Card className="h-full flex flex-col p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 hover:border-primary/20 bg-card">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden border border-border/50">
            {icon_url ? (
              <img src={icon_url} alt={`${name} logo`} className="w-full h-full object-cover" />
            ) : (
              <Blocks className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <Badge variant="outline" className="capitalize tracking-wide text-xs font-medium">
            {category}
          </Badge>
        </div>
        
        <div className="flex-grow">
          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors flex items-center gap-2">
            {name}
            <ArrowUpRight className="w-4 h-4 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-border/50 flex items-center text-sm text-muted-foreground font-medium">
          <Blocks className="w-4 h-4 mr-2 opacity-70" />
          {capabilityCount} {capabilityCount === 1 ? 'Capability' : 'Capabilities'}
        </div>
      </Card>
    </Link>
  );
}
