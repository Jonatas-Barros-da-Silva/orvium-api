
import { ManifestParser } from './manifest.parser.js';
import { ManifestValidator } from './manifest.validator.js';
import { ManifestCompiler } from './manifest.compiler.js';

export class ManifestService {
  constructor() {
    this.parser = new ManifestParser();
    this.validator = new ManifestValidator();
    this.compiler = new ManifestCompiler();
  }

  /**
   * Validates a manifest string/buffer without registering it
   */
  validateManifest(content) {
    try {
      const parsed = this.parser.parseManifestContent(content);
      const validation = this.validator.validate(parsed);
      
      return {
        success: true,
        parsed,
        validation
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        validation: { valid: false, errors: [error.message], warnings: [] }
      };
    }
  }

  /**
   * Parses, validates, and compiles a manifest into the database
   */
  async registerFromManifest(content, developerId) {
    if (!developerId) {
      throw new Error('developerId is required to register an integration');
    }

    // 1. Parse
    const parsed = this.parser.parseManifestContent(content);
    
    // 2. Validate
    const validation = this.validator.validate(parsed);
    if (!validation.valid) {
      throw new Error(`Manifest validation failed: ${validation.errors.join(', ')}`);
    }

    // 3. Compile (Save to DB)
    const result = await this.compiler.compile(parsed, developerId);
    
    return {
      ...result,
      manifest: parsed,
      warnings: validation.warnings
    };
  }

  /**
   * Generates markdown documentation from a parsed manifest
   */
  generateDocumentation(manifest) {
    let docs = `# ${manifest.name} (v${manifest.version})\n\n`;
    docs += `${manifest.description}\n\n`;
    
    if (manifest.configSchema) {
      docs += `## Configuration\n\n`;
      Object.entries(manifest.configSchema).forEach(([key, field]) => {
        docs += `- **${key}** (${field.type}): ${field.description || field.title}\n`;
      });
      docs += `\n`;
    }

    docs += `## Capabilities\n\n`;
    manifest.capabilities.forEach(cap => {
      docs += `### ${cap.name} (\`${cap.capability_key}\`)\n`;
      if (cap.description) docs += `${cap.description}\n\n`;
      
      cap.actions.forEach(action => {
        docs += `#### Action: ${action.name} (\`${action.action_key}\`)\n`;
        if (action.description) docs += `${action.description}\n`;
        docs += `- **Handler**: \`${action.handler}\`\n\n`;
      });
    });

    return docs;
  }
}
