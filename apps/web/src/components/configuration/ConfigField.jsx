
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ConfigField({ field, value, onChange }) {
  const { key, label, type, description, required, placeholder, options } = field;
  
  const handleChange = (e) => {
    onChange(key, e.target.value);
  };

  const handleSelectChange = (val) => {
    onChange(key, val);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={key} className="text-sm font-medium text-foreground flex items-center gap-1">
        {label || key}
        {required && <span className="text-destructive">*</span>}
      </Label>
      
      {description && (
        <p className="text-xs text-muted-foreground mb-2">{description}</p>
      )}

      {type === 'textarea' ? (
        <Textarea
          id={key}
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          className="min-h-[100px] bg-background border-border/50 focus-visible:ring-2 focus-visible:ring-primary"
        />
      ) : type === 'select' && options ? (
        <Select value={value || ''} onValueChange={handleSelectChange} required={required}>
          <SelectTrigger id={key} className="bg-background border-border/50 focus:ring-2 focus:ring-primary">
            <SelectValue placeholder={placeholder || "Select an option"} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={key}
          type={type === 'password' ? 'password' : type === 'email' ? 'email' : type === 'url' ? 'url' : 'text'}
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          className="bg-background border-border/50 focus-visible:ring-2 focus-visible:ring-primary"
        />
      )}
    </div>
  );
}
