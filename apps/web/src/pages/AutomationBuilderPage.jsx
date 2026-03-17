
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Edit, Trash2, Power, PowerOff, RefreshCw, History, LayoutTemplate } from 'lucide-react';
import { fetchAutomationRules, deleteAutomationRule, enableAutomationRule, disableAutomationRule } from '@/services/automationService.js';
import { formatConditions } from '@/utils/conditionFormatter.js';
import RuleVersionHistory from '@/components/RuleVersionHistory.jsx';
import { useToast } from '@/hooks/use-toast';

const AutomationBuilderPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedRuleForHistory, setSelectedRuleForHistory] = useState(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAutomationRules();
      setRules(data);
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error loading rules',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!ruleToDelete) return;

    try {
      await deleteAutomationRule(ruleToDelete.id);
      toast({
        title: 'Rule deleted',
        description: 'Automation rule has been deleted successfully.',
      });
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
      loadRules();
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleEnabled = async (rule) => {
    try {
      if (rule.enabled) {
        await disableAutomationRule(rule.id);
        toast({
          title: 'Rule disabled',
          description: 'Automation rule has been disabled.',
        });
      } else {
        await enableAutomationRule(rule.id);
        toast({
          title: 'Rule enabled',
          description: 'Automation rule has been enabled.',
        });
      }
      loadRules();
    } catch (err) {
      toast({
        title: 'Toggle failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const openDeleteDialog = (rule) => {
    setRuleToDelete(rule);
    setDeleteDialogOpen(true);
  };

  const openHistoryDialog = (rule) => {
    setSelectedRuleForHistory(rule);
    setHistoryDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Helmet>
          <title>Automation Builder - Loading</title>
        </Helmet>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error && rules.length === 0) {
    return (
      <div className="p-8 space-y-6">
        <Helmet>
          <title>Automation Builder - Error</title>
        </Helmet>
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <p className="text-destructive text-lg font-medium">Failed to load automation rules</p>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={loadRules} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <Helmet>
        <title>Automation Builder</title>
        <meta name="description" content="Create and manage automation rules for your organization" />
      </Helmet>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation Builder</h1>
          <p className="text-muted-foreground mt-1">Create and manage automation rules</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/automations/templates')} variant="outline" className="gap-2">
            <LayoutTemplate className="w-4 h-4" />
            Browse Templates
          </Button>
          <Button onClick={() => navigate('/automations/new')} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Rule
          </Button>
        </div>
      </div>

      {rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 border-2 border-dashed rounded-lg">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">No automation rules yet</p>
            <p className="text-muted-foreground">Create your first automation rule or start from a template</p>
          </div>
          <div className="flex gap-3 mt-2">
            <Button onClick={() => navigate('/automations/templates')} variant="outline" className="gap-2">
              <LayoutTemplate className="w-4 h-4" />
              Browse Templates
            </Button>
            <Button onClick={() => navigate('/automations/new')} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Rule
            </Button>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Name</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <div className="font-medium">{rule.name}</div>
                    {rule.current_version && (
                      <div className="text-xs text-muted-foreground mt-0.5">v{rule.current_version}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{rule.event_type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {formatConditions(rule.conditions_json || [])}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {(rule.actions_json || []).length} action(s)
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(rule.updated_at || rule.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/automations/${rule.id}/edit`)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openHistoryDialog(rule)}>
                          <History className="w-4 h-4 mr-2" />
                          View History
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleEnabled(rule)}>
                          {rule.enabled ? (
                            <>
                              <PowerOff className="w-4 h-4 mr-2" />
                              Disable
                            </>
                          ) : (
                            <>
                              <Power className="w-4 h-4 mr-2" />
                              Enable
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDeleteDialog(rule)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete automation rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{ruleToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Version History: {selectedRuleForHistory?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRuleForHistory && (
            <RuleVersionHistory 
              ruleId={selectedRuleForHistory.id} 
              currentVersion={selectedRuleForHistory.current_version}
              onRollbackSuccess={() => {
                loadRules();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AutomationBuilderPage;
