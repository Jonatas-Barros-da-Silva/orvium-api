
import React, { useState, useEffect } from 'react';
import { Copy, Plus, Trash2, XCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { useToast } from '@/hooks/use-toast.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { maskApiKey, copyToClipboard, formatDate } from '@/utils/apiKeyUtils.js';

const PERMISSIONS = [
  { id: 'wallet.read', label: 'Wallet Read' },
  { id: 'wallet.write', label: 'Wallet Write' },
  { id: 'ledger.read', label: 'Ledger Read' },
  { id: 'payout.create', label: 'Payout Create' },
  { id: 'payout.read', label: 'Payout Read' },
  { id: 'payout.execute', label: 'Payout Execute' },
  { id: 'event.create', label: 'Event Create' },
  { id: 'event.read', label: 'Event Read' }
];

export default function ApiKeysTab() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newKeyModalOpen, setNewKeyModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [generatedKey, setGeneratedKey] = useState(null);
  const [keySaved, setKeySaved] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    environment: 'live',
    permissions: []
  });

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const response = await apiServerClient.fetch('/developer/api-keys');
      if (!response.ok) throw new Error('Failed to fetch API keys');
      const data = await response.json();
      setKeys(data.keys || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Name is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await apiServerClient.fetch('/developer/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to create API key');
      const data = await response.json();

      setGeneratedKey(data);
      setCreateModalOpen(false);
      setNewKeyModalOpen(true);
      setKeySaved(false);
      setFormData({ name: '', environment: 'live', permissions: [] });
      
      toast({
        title: 'Success',
        description: 'API key created successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleCopyKey = async (key) => {
    const success = await copyToClipboard(key);
    if (success) {
      toast({
        title: 'Copied',
        description: 'API key copied to clipboard'
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      });
    }
  };

  const handleRevokeKey = async () => {
    if (!selectedKey) return;

    try {
      const response = await apiServerClient.fetch(`/developer/api-keys/${selectedKey.api_key_id}/revoke`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to revoke API key');

      setRevokeModalOpen(false);
      setSelectedKey(null);
      fetchKeys();
      
      toast({
        title: 'Success',
        description: 'API key revoked successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handlePermissionToggle = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const handleNewKeyModalClose = () => {
    if (keySaved) {
      setNewKeyModalOpen(false);
      setGeneratedKey(null);
      fetchKeys();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">API Keys</h2>
          <p className="text-sm text-slate-600 mt-1">Manage your API keys for authentication</p>
        </div>
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create New Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key for your application
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Production API Key"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="environment">Environment</Label>
                <Select value={formData.environment} onValueChange={(value) => setFormData({ ...formData, environment: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">Test</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg bg-slate-50">
                  {PERMISSIONS.map(permission => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission.id}
                        checked={formData.permissions.includes(permission.id)}
                        onCheckedChange={() => handlePermissionToggle(permission.id)}
                      />
                      <label htmlFor={permission.id} className="text-sm font-medium cursor-pointer">
                        {permission.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateKey}>Create Key</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Generated Key Modal */}
      <Dialog open={newKeyModalOpen} onOpenChange={handleNewKeyModalClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              API Key Created Successfully
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Save this key now</p>
                <p>This is the only time you will see the full API key. Store it securely.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Your API Key</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedKey?.api_key || ''}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopyKey(generatedKey?.api_key)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="key-saved"
                checked={keySaved}
                onCheckedChange={setKeySaved}
              />
              <label htmlFor="key-saved" className="text-sm font-medium cursor-pointer">
                I have saved this key securely
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleNewKeyModalClose} disabled={!keySaved}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Modal */}
      <Dialog open={revokeModalOpen} onOpenChange={setRevokeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this API key? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRevokeKey}>Revoke Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keys Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Environment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  Loading...
                </TableCell>
              </TableRow>
            ) : keys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  No API keys found. Create your first key to get started.
                </TableCell>
              </TableRow>
            ) : (
              keys.map(key => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell className="font-mono text-sm">{maskApiKey(key.key_prefix)}</TableCell>
                  <TableCell>
                    <Badge variant={key.environment === 'live' ? 'default' : 'secondary'}>
                      {key.environment}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={key.status === 'active' ? 'success' : 'destructive'}>
                      {key.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{formatDate(key.created)}</TableCell>
                  <TableCell className="text-sm text-slate-600">{formatDate(key.last_used_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyKey(key.key_prefix)}
                        disabled={key.status === 'revoked'}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedKey(key);
                          setRevokeModalOpen(true);
                        }}
                        disabled={key.status === 'revoked'}
                      >
                        <XCircle className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
