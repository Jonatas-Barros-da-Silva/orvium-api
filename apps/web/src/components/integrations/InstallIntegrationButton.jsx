
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, DownloadCloud, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import apiServerClient from '@/lib/apiServerClient';
import { useWorkspace } from '@/hooks/useWorkspace.js';

export function InstallIntegrationButton({ integrationSlug, integrationId, versionId }) {
  const { workspace } = useWorkspace();
  const navigate = useNavigate();
  const [status, setStatus] = useState('LOADING'); // LOADING, NOT_INSTALLED, INSTALLING, INSTALLED, NEEDS_CONFIG

  useEffect(() => {
    if (!workspace?.id) return;

    const checkStatus = async () => {
      try {
        const response = await apiServerClient.fetch(`/integrations/${integrationSlug}/installed?workspaceId=${workspace.id}`);
        if (!response.ok) throw new Error('Failed to check status');
        const data = await response.json();
        
        if (data.installed) {
          setStatus(data.status === 'needs_configuration' ? 'NEEDS_CONFIG' : 'INSTALLED');
        } else {
          setStatus('NOT_INSTALLED');
        }
      } catch (error) {
        console.error('Status check error:', error);
        setStatus('NOT_INSTALLED');
      }
    };

    checkStatus();
  }, [integrationSlug, workspace?.id]);

  const handleInstall = async () => {
    if (!workspace?.id) {
      toast.error('Workspace context missing');
      return;
    }

    setStatus('INSTALLING');
    try {
      const response = await apiServerClient.fetch('/integrations/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: workspace.id,
          integrationAppId: integrationId,
          versionId: versionId
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Installation failed');
      }

      toast.success('Integration installed successfully');
      navigate(`/integrations/${integrationSlug}/configure`);
    } catch (error) {
      console.error('Install error:', error);
      toast.error(error.message || 'Failed to install integration');
      setStatus('NOT_INSTALLED');
    }
  };

  if (status === 'LOADING') {
    return (
      <Button disabled variant="outline" className="w-full md:w-auto min-w-[140px]">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Checking...
      </Button>
    );
  }

  if (status === 'NEEDS_CONFIG') {
    return (
      <Button 
        onClick={() => navigate(`/integrations/${integrationSlug}/configure`)}
        className="w-full md:w-auto min-w-[140px] bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition-all active:scale-[0.98]"
      >
        <Settings2 className="w-4 h-4 mr-2" />
        Configure Integration
      </Button>
    );
  }

  if (status === 'INSTALLED') {
    return (
      <Button 
        onClick={() => navigate(`/integrations/${integrationSlug}/configure`)}
        variant="secondary" 
        className="w-full md:w-auto min-w-[140px] bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-all"
      >
        <CheckCircle2 className="w-4 h-4 mr-2" />
        Installed (Edit Config)
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleInstall} 
      disabled={status === 'INSTALLING'}
      className="w-full md:w-auto min-w-[140px] shadow-sm transition-all active:scale-[0.98]"
    >
      {status === 'INSTALLING' ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Installing...
        </>
      ) : (
        <>
          <DownloadCloud className="w-4 h-4 mr-2" />
          Install Integration
        </>
      )}
    </Button>
  );
}
