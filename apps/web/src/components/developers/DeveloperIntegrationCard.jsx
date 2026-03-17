
import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, Settings, Code2 } from 'lucide-react';

export function DeveloperIntegrationCard({ integration }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400';
      case 'in_review': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <Link to={`/developers/integrations/${integration.id}`} className="block group h-full">
      <Card className="h-full flex flex-col p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 hover:border-primary/20 bg-card">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden border border-border/50">
            <Code2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <Badge variant="outline" className={`capitalize tracking-wide text-xs font-medium ${getStatusColor(integration.status)}`}>
            {integration.status.replace('_', ' ')}
          </Badge>
        </div>
        
        <div className="flex-grow">
          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors flex items-center gap-2">
            {integration.name}
            <ArrowUpRight className="w-4 h-4 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
            {integration.description || 'No description provided.'}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-border/50 flex items-center text-sm text-muted-foreground font-medium group-hover:text-primary transition-colors">
          <Settings className="w-4 h-4 mr-2" />
          Manage Integration
        </div>
      </Card>
    </Link>
  );
}
