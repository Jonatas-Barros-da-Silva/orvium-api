
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ApproveButton } from './ApproveButton.jsx';
import { RejectButton } from './RejectButton.jsx';
import { Blocks, User, Mail, Calendar, ShieldCheck, Zap, AlertCircle } from 'lucide-react';

export function SubmissionReviewPanel({ submission, onApprove, onReject, isProcessing }) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');

  if (!submission) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border/50 p-8">
        <ShieldCheck className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-lg font-medium">Select a submission to review</p>
        <p className="text-sm mt-1">Review integration details, capabilities, and approve or reject.</p>
      </div>
    );
  }

  const app = submission.app || {};
  const dev = submission.developer || {};
  const versions = submission.versions || [];
  const capabilities = submission.capabilities || [];
  const activeVersion = versions[0];

  const handleRejectSubmit = () => {
    if (!rejectNotes.trim()) return;
    onReject(submission.id, rejectNotes);
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
      <ScrollArea className="flex-grow">
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Header Section */}
          <div className="flex items-start gap-5 pb-6 border-b border-border/50">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0 border border-primary/20">
              {app.icon_url ? (
                <img src={app.icon_url} alt={app.name} className="w-10 h-10 object-contain" />
              ) : (
                <Blocks className="w-8 h-8" />
              )}
            </div>
            <div className="flex-grow">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">{app.name || 'Unknown App'}</h2>
                <Badge variant="outline" className="capitalize">{app.category || 'Uncategorized'}</Badge>
              </div>
              <p className="text-muted-foreground mt-2 leading-relaxed">{app.description || 'No description provided.'}</p>
              <div className="flex items-center gap-4 mt-4 text-sm font-medium text-muted-foreground">
                <span className="bg-muted px-2.5 py-1 rounded-md">Slug: {app.slug || 'N/A'}</span>
                {activeVersion && (
                  <span className="bg-muted px-2.5 py-1 rounded-md">Version: {activeVersion.version_name}</span>
                )}
              </div>
            </div>
          </div>

          {/* Developer Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-muted-foreground" />
              Developer Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Name</p>
                <p className="font-medium">{dev.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email
                </p>
                <p className="font-medium">{dev.email || 'N/A'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Submitted On
                </p>
                <p className="font-medium">{new Date(submission.created).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Capabilities & Actions */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-muted-foreground" />
              Capabilities & Actions
            </h3>
            
            {capabilities.length === 0 ? (
              <div className="text-center py-8 bg-muted/20 rounded-xl border border-dashed border-border/50">
                <p className="text-muted-foreground">No capabilities defined for this version.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {capabilities.map((cap) => (
                  <Card key={cap.id} className="p-5 border-border/50 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-foreground">{cap.name}</h4>
                      <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{cap.capability_key}</code>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{cap.description}</p>
                    
                    {cap.actions && cap.actions.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Available Actions</p>
                        <div className="grid gap-2">
                          {cap.actions.map(action => (
                            <div key={action.id} className="flex items-start gap-3 bg-muted/30 p-3 rounded-lg">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-foreground">{action.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Action Footer */}
      <div className="p-6 border-t border-border/50 bg-muted/10">
        {isRejecting ? (
          <div className="space-y-4 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-destructive font-medium mb-2">
              <AlertCircle className="w-5 h-5" />
              Provide Rejection Reason
            </div>
            <Textarea 
              placeholder="Explain why this integration is being rejected. This will be visible to the developer."
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              className="min-h-[100px] bg-background"
            />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsRejecting(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleRejectSubmit} 
                disabled={!rejectNotes.trim() || isProcessing}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <RejectButton 
              onClick={() => setIsRejecting(true)} 
              disabled={isProcessing} 
              className="w-full sm:w-auto"
            />
            <ApproveButton 
              onClick={() => onApprove(submission.id)} 
              isLoading={isProcessing} 
              className="w-full sm:w-auto"
            />
          </div>
        )}
      </div>
    </div>
  );
}
