
import React from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { formatCondition, parseConditionFromUI, validateCondition } from '@/utils/conditionFormatter.js';

const FIELD_OPTIONS = [
  { value: 'amount', label: 'Amount' },
  { value: 'professional_id', label: 'Professional ID' },
  { value: 'status', label: 'Status' },
  { value: 'field_exists', label: 'Field Exists' },
  { value: 'event_type', label: 'Event Type' },
  { value: 'organization_id', label: 'Organization ID' },
];

const OPERATOR_OPTIONS = [
  { value: 'greater_than', label: 'Greater than (>)' },
  { value: 'less_than', label: 'Less than (<)' },
  { value: 'equals', label: 'Equals (=)' },
  { value: 'not_equals', label: 'Not equals (≠)' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than_or_equal', label: 'Greater than or equal (≥)' },
  { value: 'less_than_or_equal', label: 'Less than or equal (≤)' },
];

const ConditionBuilder = ({ conditions, onConditionsChange }) => {
  const addCondition = () => {
    onConditionsChange([...conditions, { field: '', operator: '', value: '' }]);
  };

  const removeCondition = (index) => {
    const updated = conditions.filter((_, i) => i !== index);
    onConditionsChange(updated);
  };

  const updateCondition = (index, field, value) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    onConditionsChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Conditions</Label>
        <Button onClick={addCondition} size="sm" variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Condition
        </Button>
      </div>

      {conditions.length === 0 && (
        <Card className="p-6 text-center text-muted-foreground">
          No conditions added. Click "Add Condition" to start.
        </Card>
      )}

      {conditions.map((condition, index) => (
        <Card key={index} className="p-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Field</Label>
                <Select
                  value={condition.field}
                  onValueChange={(value) => updateCondition(index, 'field', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Operator</Label>
                <Select
                  value={condition.operator}
                  onValueChange={(value) => updateCondition(index, 'operator', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATOR_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Value</Label>
                <Input
                  value={condition.value}
                  onChange={(e) => updateCondition(index, 'value', e.target.value)}
                  placeholder="Enter value"
                />
              </div>
            </div>

            <Button
              onClick={() => removeCondition(index)}
              size="icon"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {validateCondition(condition) && (
            <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
              <span className="font-medium">Preview:</span> {formatCondition(condition)}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default ConditionBuilder;
