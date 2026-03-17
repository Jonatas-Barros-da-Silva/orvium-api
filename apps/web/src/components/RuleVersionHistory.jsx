
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RotateCcw, Eye, AlertCircle } from 'lucide-react';
import { fetchRuleVersions, rollbackRule } from '@/services/versionService.js';
import { formatConditions } from '@/utils/conditionFormatter.js';
import RollbackConfirmationDialog from './RollbackConfirmationDialog.jsx';
import { useToast } from '@/hooks/use-toast';

const RuleVersionHistory = ({ ruleId, currentVersion, onRollbackSuccess }) => {
  const { toast } = useToast();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [selectedVersionForRollback, setSelectedVersionForRollback] = useState(null);

  useEffect(() => {
    if (ruleId) {
      loadVersions();
    }
  }, [ruleId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRuleVersions(ruleId);
      setVersions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRollbackDialog = (version) => {
    setSelectedVersionForRollback(version);
    setRollbackDialogOpen(true);
  };

  const handleConfirmRollback = async (versionNumber) => {
    try {
      const result = await rollbackRule(ruleId, versionNumber);
      toast({
        title: 'Rollback successful',
        description: `Rule has been rolled back. New version is v${result.newVersion}.`,
      });
      setRollbackDialogOpen(false);
      setSelectedVersionForRollback(null);
      if (onRollbackSuccess) {
        onRollbackSuccess();
      }
      loadVersions(); // Reload history
    } catch (err) {
      toast({
        title: 'Rollback failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="text-sm text-destructive font-medium">Failed to load version history</p>
        <p className="text-xs text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={loadVersions}>Retry</Button>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No version history found for this rule.
      </div>
    );
  }

  // Determine the actual current version (highest number) if not provided
  const actualCurrentVersion = currentVersion || Math.max(...versions.map(v => v.version_number));

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Version</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Conditions</TableHead>
              <TableHead>Actions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((version) => {
              const isCurrent = version.version_number === actualCurrentVersion;
              
              return (
                <TableRow key={version.id} className={isCurrent ? 'bg-muted/30' : ''}>
                  <TableCell className="font-medium">
                    v{version.version_number}
                    {isCurrent && (
                      <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                        Current
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(version.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">
                    {version.conditions_json?.length > 0 
                      ? formatConditions(version.conditions_json) 
                      : <span className="text-muted-foreground italic">None</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {version.actions_json?.length || 0} action(s)
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!isCurrent && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 gap-1.5"
                          onClick={() => handleOpenRollbackDialog(version)}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Rollback</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <RollbackConfirmationDialog
        isOpen={rollbackDialogOpen}
        currentVersion={actualCurrentVersion}
        targetVersion={selectedVersionForRollback}
        onConfirm={handleConfirmRollback}
        onCancel={() => setRollbackDialogOpen(false)}
      />
    </div>
  );
};

export default RuleVersionHistory;
