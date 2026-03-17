
/**
 * Config Validator
 * Validates integration configuration against schema
 */
export class ConfigValidator {
  /**
   * Validate configuration against schema
   * @static
   * @param {Object} config - Configuration object to validate
   * @param {Object} schema - Validation schema
   * @returns {Object} - {valid: boolean, errors: Array<string>}
   */
  static validateConfig(config, schema) {
    if (!config || typeof config !== 'object') {
      return {
        valid: false,
        errors: ['Configuration must be a non-empty object'],
      };
    }

    if (!schema || typeof schema !== 'object') {
      return {
        valid: false,
        errors: ['Schema must be a non-empty object'],
      };
    }

    const errors = [];

    // Validate required fields
    if (schema.required && Array.isArray(schema.required)) {
      const requiredValidation = ConfigValidator.validateRequiredFields(config, schema.required);
      if (!requiredValidation.valid) {
        errors.push(...requiredValidation.errors);
      }
    }

    // Validate field types
    if (schema.properties && typeof schema.properties === 'object') {
      const typeValidation = ConfigValidator.validateTypes(config, schema.properties);
      if (!typeValidation.valid) {
        errors.push(...typeValidation.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate required fields are present
   * @static
   * @param {Object} config - Configuration object
   * @param {Array<string>} requiredFields - Array of required field names
   * @returns {Object} - {valid: boolean, errors: Array<string>}
   */
  static validateRequiredFields(config, requiredFields) {
    if (!config || typeof config !== 'object') {
      return {
        valid: false,
        errors: ['Configuration must be a non-empty object'],
      };
    }

    if (!Array.isArray(requiredFields)) {
      return {
        valid: false,
        errors: ['Required fields must be an array'],
      };
    }

    const errors = [];

    for (const field of requiredFields) {
      if (!(field in config) || config[field] === null || config[field] === undefined) {
        errors.push(`Required field '${field}' is missing`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate field types
   * @static
   * @param {Object} config - Configuration object
   * @param {Object} schema - Schema with field type definitions
   * @returns {Object} - {valid: boolean, errors: Array<string>}
   */
  static validateTypes(config, schema) {
    if (!config || typeof config !== 'object') {
      return {
        valid: false,
        errors: ['Configuration must be a non-empty object'],
      };
    }

    if (!schema || typeof schema !== 'object') {
      return {
        valid: false,
        errors: ['Schema must be a non-empty object'],
      };
    }

    const errors = [];

    for (const [field, fieldSchema] of Object.entries(schema)) {
      if (!(field in config)) {
        continue; // Skip if field not present (required check is separate)
      }

      const value = config[field];
      const expectedType = fieldSchema.type || fieldSchema;

      // Skip null/undefined values (required check is separate)
      if (value === null || value === undefined) {
        continue;
      }

      // Validate type
      const actualType = Array.isArray(value) ? 'array' : typeof value;

      if (actualType !== expectedType) {
        errors.push(
          `Field '${field}' has invalid type. Expected '${expectedType}', got '${actualType}'`
        );
      }

      // Validate enum values if specified
      if (fieldSchema.enum && Array.isArray(fieldSchema.enum)) {
        if (!fieldSchema.enum.includes(value)) {
          errors.push(
            `Field '${field}' has invalid value. Must be one of: ${fieldSchema.enum.join(', ')}`
          );
        }
      }

      // Validate array items if specified
      if (expectedType === 'array' && fieldSchema.items) {
        const itemType = fieldSchema.items.type || fieldSchema.items;
        for (let i = 0; i < value.length; i++) {
          const itemActualType = Array.isArray(value[i]) ? 'array' : typeof value[i];
          if (itemActualType !== itemType) {
            errors.push(
              `Field '${field}[${i}]' has invalid type. Expected '${itemType}', got '${itemActualType}'`
            );
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
