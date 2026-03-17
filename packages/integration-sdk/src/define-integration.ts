
/**
 * Integration Manifest Type Definitions
 */

export interface ConfigField {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  title: string;
  description?: string;
  required?: boolean;
  default?: any;
  format?: 'password' | 'email' | 'url' | 'date-time';
}

export interface ActionInput {
  type: 'object';
  required?: string[];
  properties: Record<string, any>;
}

export interface ActionOutput {
  type: 'object';
  properties: Record<string, any>;
}

export interface Action {
  action_key: string;
  name: string;
  description?: string;
  handler: string;
  input_schema?: ActionInput;
  output_schema?: ActionOutput;
}

export interface Capability {
  capability_key: string;
  name: string;
  description?: string;
  actions: Action[];
}

export interface IntegrationManifest {
  name: string;
  slug: string;
  version: string;
  description: string;
  category: 'analytics' | 'crm' | 'communication' | 'marketing' | 'finance' | 'productivity';
  icon_url?: string;
  authentication_type?: 'oauth2' | 'api_key' | 'basic' | 'none';
  rate_limit?: number;
  timeout_ms?: number;
  configSchema?: Record<string, ConfigField>;
  capabilities: Capability[];
}

/**
 * Helper function to define an integration manifest with full type safety.
 * 
 * @example
 * 