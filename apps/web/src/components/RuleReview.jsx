
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { formatConditions } from '@/utils/conditionFormatter.js';
import { formatActions } from '@/utils/actionFormatter.js';

const RuleReview = ({ ruleName, eventType, conditions, actions, onEdit }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Rule Summary</CardTitle>
          <Button onClick={onEdit} variant="outline" size="sm" className="gap-2">
            <Edit className="w-4 h-4" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Rule Name</p>
            <p className="text-base font-semibold">{ruleName || 'Unnamed Rule'}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Event Type</p>
            <Badge variant="secondary" className="text-sm">
              {eventType || 'No event selected'}
            </Badge>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Conditions</p>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm leading-relaxed">
                {conditions.length > 0 ? formatConditions(conditions) : 'No conditions'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Actions</p>
            <div className="bg-muted/50 rounded-lg p-4">
              <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {actions.length > 0 ? formatActions(actions) : 'No actions'}
              </pre>
            </div>
          </div>

          <div className="border-t pt-6">
            <p className="text-sm font-medium text-muted-foreground mb-3">Rule Logic</p>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm leading-relaxed">
                <span className="font-semibold text-primary">IF</span> {eventType || '[event]'}
                {conditions.length > 0 && (
                  <>
                    {' '}<span className="font-semibold text-primary">AND</span> {formatConditions(conditions)}
                  </>
                )}
                {' '}<span className="font-semibold text-primary">THEN</span>
              </p>
              <ul className="mt-2 space-y-1 ml-4">
                {actions.map((action, index) => (
                  <li key={index} className="text-sm">• {formatActions([action]).replace(/^\d+\.\s/, '')}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RuleReview;
