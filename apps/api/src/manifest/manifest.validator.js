
export class ManifestValidator {
  validate(manifest) {
    const errors = [];
    const warnings = [];

    if (!manifest) {
      return { valid: false, errors: ['Manifest is empty or invalid'], warnings: [] };
    }

    // Core fields
    if (!manifest.name) errors.push('Missing required field: name');
    if (!manifest.slug) errors.push('Missing required field: slug');
    if (!manifest.version) errors.push('Missing required field: version');
    if (!manifest.description) errors.push('Missing required field: description');
    if (!manifest.category) errors.push('Missing required field: category');

    // Capabilities
    if (!manifest.capabilities || !Array.isArray(manifest.capabilities)) {
      errors.push('Manifest must include a capabilities array');
    } else {
      this.validateCapabilities(manifest.capabilities, errors, warnings);
    }

    // Config Schema
    if (manifest.configSchema) {
      this.validateConfigSchema(manifest.configSchema, errors, warnings);
    }

    // Linting (Best practices)
    this.lint(manifest, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateCapabilities(capabilities, errors, warnings) {
    if (capabilities.length === 0) {
      warnings.push('Integration has no capabilities defined');
    }

    capabilities.forEach((cap, index) => {
      if (!cap.capability_key) errors.push(`Capability at index ${index} missing capability_key`);
      if (!cap.name) errors.push(`Capability '${cap.capability_key || index}' missing name`);
      
      if (!cap.actions || !Array.isArray(cap.actions)) {
        errors.push(`Capability '${cap.capability_key}' missing actions array`);
      } else {
        cap.actions.forEach((action, aIndex) => {
          if (!action.action_key) errors.push(`Action at index ${aIndex} in '${cap.capability_key}' missing action_key`);
          if (!action.name) errors.push(`Action '${action.action_key || aIndex}' missing name`);
          if (!action.handler) errors.push(`Action '${action.action_key || aIndex}' missing handler function name`);
        });
      }
    });
  }

  validateConfigSchema(schema, errors, warnings) {
    if (typeof schema !== 'object') {
      errors.push('configSchema must be an object');
      return;
    }

    Object.entries(schema).forEach(([key, field]) => {
      if (!field.type) errors.push(`Config field '${key}' missing type`);
      if (!field.title) warnings.push(`Config field '${key}' missing title (UI label)`);
    });
  }

  lint(manifest, errors, warnings) {
    // Check slug format
    if (manifest.slug && !/^[a-z0-9-]+$/.test(manifest.slug)) {
      errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
    }

    // Check version format (semver)
    if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
      warnings.push('Version should follow semantic versioning (e.g., 1.0.0)');
    }

    // Check descriptions
    if (manifest.description && manifest.description.length < 10) {
      warnings.push('Description is very short. Provide more detail for the marketplace.');
    }
  }
}
