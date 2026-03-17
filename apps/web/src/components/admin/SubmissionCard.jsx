
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User } from 'lucide-react';

export function SubmissionCard({ submission, isSelected, onClick }) {
  const appName = submission.app?.name || 'Unknown Integration';
  const devName = submission.developer?.name || submission.developer?.email || 'Unknown Developer';
  
  const date = new Date(submission.created).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <Card 
      onClick={onClick}
      className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected 
          ? 'ring-2 ring-primary border-transparent bg-primary/5' 
          : 'border-border/50 hover:border-primary/30 bg-card'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-foreground truncate pr-2">{appName}</h4>
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
          Pending
        </Badge>
      </div>
      
      <div className="space-y-1.5 mt-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <User className="w-3.5 h-3.5 mr-2 shrink-0" />
          <span className="truncate">{devName}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="w-3.5 h-3.5 mr-2 shrink-0" />
          <span>Submitted {date}</span>
        </div>
      </div>
    </Card>
  );
}
