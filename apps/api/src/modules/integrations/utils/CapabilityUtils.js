
/**
 * Utility class for Integration Capabilities
 */
export class CapabilityUtils {
  /**
   * Validates a payload against a JSON schema
   * @param {Object} schema - The JSON schema to validate against
   * @param {Object} payload - The data payload to validate
   * @returns {{isValid: boolean, errors: Array<string>}}
   */
  static validateInput(schema, payload) {
    if (!schema || Object.keys(schema).length === 0) {
      return { isValid: true, errors: [] };
    }

    const errors = [];
    
    // Basic required fields validation
    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (payload[field] === undefined || payload[field] === null) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // Basic type validation for provided fields
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (payload[key] !== undefined) {
          const expectedType = propSchema.type;
          const actualType = Array.isArray(payload[key]) ? 'array' : typeof payload[key];
          
          if (expectedType && expectedType !== 'any' && actualType !== expectedType) {
            // Allow integer/number flexibility
            if (!(expectedType === 'number' && actualType === 'number') && 
                !(expectedType === 'integer' && actualType === 'number')) {
              errors.push(`Invalid type for field '${key}'. Expected ${expectedType}, got ${actualType}`);
            }
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Formats a capability and its actions for API responses
   * @param {import('../types/capability.types.js').Capability} capability 
   * @param {import('../types/capability.types.js').CapabilityAction[]} actions 
   * @returns {Object}
   */
  static formatCapability(capability, actions = []) {
    return {
      id: capability.id,
      key: capability.capability_key,
      name: capability.name,
      description: capability.description || '',
      isActive: capability.is_active,
      schemas: {
        input: capability.input_schema || {},
        output: capability.output_schema || {}
      },
      actions: actions.map(action => ({
        id: action.id,
        key: action.action_key,
        name: action.name,
        description: action.description || '',
        handler: action.handler,
        schemas: {
          input: action.input_schema || {},
          output: action.output_schema || {}
        }
      }))
    };
  }

  /**
   * Groups an array of capabilities by their integration version ID
   * @param {import('../types/capability.types.js').Capability[]} capabilities 
   * @returns {Record<string, import('../types/capability.types.js').Capability[]>}
   */
  static groupByIntegration(capabilities) {
    return capabilities.reduce((acc, cap) => {
      const versionId = cap.integration_version_id;
      if (!acc[versionId]) {
        acc[versionId] = [];
      }
      acc[versionId].push(cap);
      return acc;
    }, {});
  }

  /**
   * Generates a standardized path string for a capability action
   * @param {string} integrationSlug 
   * @param {string} capabilityKey 
   * @param {string} actionKey 
   * @returns {string}
   */
  static getCapabilityPath(integrationSlug, capabilityKey, actionKey) {
    return `${integrationSlug}:${capabilityKey}:${actionKey}`;
  }

  /**
   * Parses a capability path string into its components
   * @param {string} path 
   * @returns {{integrationSlug: string, capabilityKey: string, actionKey: string}|null}
   */
  static parseCapabilityPath(path) {
    if (!path || typeof path !== 'string') return null;
    
    const parts = path.split(':');
    if (parts.length !== 3) return null;

    return {
      integrationSlug: parts[0],
      capabilityKey: parts[1],
      actionKey: parts[2]
    };
  }
}
