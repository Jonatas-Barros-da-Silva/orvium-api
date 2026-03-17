
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Save, X } from 'lucide-react';
import EventSelector from '@/components/EventSelector.jsx';
import ConditionBuilder from '@/components/ConditionBuilder.jsx';
import ActionBuilder from '@/components/ActionBuilder.jsx';
import RuleReview from '@/components/RuleReview.jsx';
import { createAutomationRule, updateAutomationRule, fetchAutomationRule } from '@/services/automationService.js';
import { validateCondition } from '@/utils/conditionFormatter.js';
import { validateAction } from '@/utils/actionFormatter.js';
import { useToast } from '@/hooks/use-toast';

const STEPS = [
  { id: 1, title: 'Select Event', description: 'Choose the event that triggers this automation' },
  { id: 2, title: 'Configure Conditions', description: 'Define when this automation should run' },
  { id: 3, title: 'Define Actions', description: 'Specify what happens when conditions are met' },
  { id: 4, title: 'Review and Save', description: 'Review your automation rule before saving' },
];

const AutomationRuleWizard = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEditMode = !!id;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  const [formData, setFormData] = useState({
    ruleName: '',
    eventType: '',
    conditions: [],
    actions: [],
  });

  useEffect(() => {
    if (isEditMode) {
      loadExistingRule();
    }
  }, [id]);

  const loadExistingRule = async () => {
    try {
      setInitialLoading(true);
      const rule = await fetchAutomationRule(id);
      setFormData({
        ruleName: rule.name,
        eventType: rule.event_type,
        conditions: rule.conditions_json || [],
        actions: rule.actions_json || [],
      });
    } catch (err) {
      toast({
        title: 'Failed to load rule',
        description: err.message,
        variant: 'destructive',
      });
      navigate('/automations');
    } finally {
      setInitialLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.ruleName.trim() && formData.eventType;
      case 2:
        return true; // Conditions are optional
      case 3:
        return formData.actions.length > 0 && formData.actions.every(validateAction);
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceedToNextStep() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (isEditMode) {
        await updateAutomationRule(
          id,
          formData.ruleName,
          formData.eventType,
          formData.conditions,
          formData.actions,
          true
        );
        toast({
          title: 'Rule updated',
          description: 'Automation rule has been updated successfully.',
        });
      } else {
        await createAutomationRule(
          formData.ruleName,
          formData.eventType,
          formData.conditions,
          formData.actions
        );
        toast({
          title: 'Rule created',
          description: 'Automation rule has been created successfully.',
        });
      }
      navigate('/automations');
    } catch (err) {
      toast({
        title: 'Save failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/automations');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="rule-name" className="text-sm font-medium">Rule Name</Label>
              <Input
                id="rule-name"
                value={formData.ruleName}
                onChange={(e) => updateFormData('ruleName', e.target.value)}
                placeholder="Enter a descriptive name for this rule"
                className="text-base"
              />
            </div>
            <EventSelector
              selectedEvent={formData.eventType}
              onEventChange={(value) => updateFormData('eventType', value)}
            />
          </div>
        );

      case 2:
        return (
          <ConditionBuilder
            conditions={formData.conditions}
            onConditionsChange={(value) => updateFormData('conditions', value)}
          />
        );

      case 3:
        return (
          <ActionBuilder
            actions={formData.actions}
            onActionsChange={(value) => updateFormData('actions', value)}
          />
        );

      case 4:
        return (
          <RuleReview
            ruleName={formData.ruleName}
            eventType={formData.eventType}
            conditions={formData.conditions}
            actions={formData.actions}
            onEdit={() => setCurrentStep(1)}
          />
        );

      default:
        return null;
    }
  };

  if (initialLoading) {
    return (
      <div className="p-8">
        <Helmet>
          <title>Loading Rule...</title>
        </Helmet>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading rule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <Helmet>
        <title>{isEditMode ? 'Edit Automation Rule' : 'Create Automation Rule'}</title>
        <meta name="description" content="Create or edit an automation rule" />
      </Helmet>

      <div className="flex items-center gap-4">
        <Button onClick={handleCancel} variant="ghost" size="icon">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? 'Edit Automation Rule' : 'Create Automation Rule'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {STEPS[currentStep - 1].description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  currentStep === step.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : currentStep > step.id
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step.id}
              </div>
              <div className="hidden md:block">
                <p className={`text-sm font-medium ${currentStep === step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.title}
                </p>
              </div>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.id ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[400px]">
          {renderStepContent()}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button onClick={handleCancel} variant="outline" className="gap-2">
          <X className="w-4 h-4" />
          Cancel
        </Button>

        <div className="flex items-center gap-3">
          {currentStep > 1 && (
            <Button onClick={handlePrevious} variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>
          )}

          {currentStep < 4 ? (
            <Button onClick={handleNext} disabled={!canProceedToNextStep()} className="gap-2">
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={loading} className="gap-2">
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : isEditMode ? 'Update Rule' : 'Create Rule'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutomationRuleWizard;
