
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { ConfigField } from './ConfigField.jsx';
import { ConfigSaveButton } from './ConfigSaveButton.jsx';
import { Loader } from '@/components/ui/Loader.jsx';
import apiServerClient from '@/lib/apiServerClient';

export function IntegrationConfigForm({ installationId, configSchema, appSlug }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchExistingConfig = async () => {
      try {
        const res = await apiServerClient.fetch(`/installations/${installationId}/config`);
        if (res.ok) {
          const data = await res.json();
          if (data.values) {
            setFormData(data.values);
          }
        }
      } catch (error) {
        console.error('Failed to fetch existing config:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingConfig();
  }, [installationId]);

  const handleFieldChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await apiServerClient.fetch(`/installations/${installationId}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save configuration');
      }

      toast.success('Configuration saved successfully');
      navigate(`/integrations/${appSlug}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-12 flex justify-center items-center border-border/50 shadow-sm">
        <Loader text="Loading configuration..." size={24} />
      </Card>
    );
  }

  if (!configSchema || configSchema.length === 0) {
    return (
      <Card className="p-8 text-center border-border/50 shadow-sm bg-muted/10">
        <p className="text-muted-foreground">This integration does not require any configuration.</p>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden">
      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 bg-card">
        <div className="space-y-6">
          {configSchema.map((field) => (
            <ConfigField 
              key={field.key} 
              field={field} 
              value={formData[field.key]} 
              onChange={handleFieldChange} 
            />
          ))}
        </div>
        
        <ConfigSaveButton isSubmitting={isSubmitting} />
      </form>
    </Card>
  );
}
