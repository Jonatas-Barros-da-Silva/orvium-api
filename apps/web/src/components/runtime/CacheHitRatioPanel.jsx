
import React from 'react';
import { Card } from '@/components/ui/card';
import { Database, Check, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import apiServerClient from '@/lib/apiServerClient';

export function CacheHitRatioPanel({ cacheStats, onClear }) {
  if (!cacheStats) return null;

  const handleClearCache = async () => {
    try {
      const res = await apiServerClient.fetch('/runtime/cache/clear', { method: 'POST' });
      if (res.ok) {
        toast.success('In-memory cache cleared successfully');
        if (onClear) onClear();
      } else {
        throw new Error('Failed to clear cache');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Card className="p-6 border-border/50 shadow-sm bg-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Database className="w-5 h-5 text-muted-foreground" />
          In-Memory Cache
        </h3>
        <Button variant="outline" size="sm" onClick={handleClearCache} className="h-8 text-xs">
          <RefreshCw className="w-3 h-3 mr-2" /> Clear Cache
        </Button>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-end justify-between mb-2">
          <span className="text-4xl font-bold text-foreground">{cacheStats.hitRate}%</span>
          <span className="text-sm text-muted-foreground mb-1">
            Hit Ratio
          </span>
        </div>
        
        <div className="h-4 w-full bg-secondary rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500" 
            style={{ width: `${cacheStats.hitRate}%` }}
          />
          <div 
            className="h-full bg-rose-500 transition-all duration-500" 
            style={{ width: `${100 - cacheStats.hitRate}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-500" /> Hits
            </p>
            <p className="text-lg font-semibold">{cacheStats.hits.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
              <X className="w-3 h-3 text-rose-500" /> Misses
            </p>
            <p className="text-lg font-semibold">{cacheStats.misses.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Size</p>
            <p className="text-lg font-semibold">{cacheStats.size} keys</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
