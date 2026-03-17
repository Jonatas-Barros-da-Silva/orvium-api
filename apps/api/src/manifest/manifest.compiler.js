
import crypto from 'crypto';
import pb from '../utils/pocketbaseClient.js';

export class ManifestCompiler {
  /**
   * Compiles a validated manifest into database records
   */
  async compile(manifest, developerId) {
    try {
      // 1. Create or update the App
      const app = await this.createIntegrationApp(manifest, developerId);
      
      // 2. Create the Version
      const version = await this.createIntegrationVersion(app.id, manifest);
      
      // 3. Create Capabilities and Actions
      await this.createCapabilities(version.id, manifest.capabilities);
      
      // 4. Create Metadata
      await this.createMetadata(app.id, manifest);

      return {
        success: true,
        appId: app.id,
        versionId: version.id
      };
    } catch (error) {
      throw new Error(`Compilation failed: ${error.message}`);
    }
  }

  async createIntegrationApp(manifest, developerId) {
    try {
      // Check if app already exists by slug
      const existing = await pb.collection('integration_apps').getFirstListItem(`slug="${manifest.slug}"`, { $autoCancel: false });
      
      // Update existing
      return await pb.collection('integration_apps').update(existing.id, {
        name: manifest.name,
        description: manifest.description,
        category: manifest.category,
        icon_url: manifest.icon_url || '',
        developer_id: developerId
      }, { $autoCancel: false });
    } catch (e) {
      // Create new
      return await pb.collection('integration_apps').create({
        name: manifest.name,
        slug: manifest.slug,
        description: manifest.description,
        category: manifest.category,
        icon_url: manifest.icon_url || '',
        status: 'active',
        developer_id: developerId
      }, { $autoCancel: false });
    }
  }

  async createIntegrationVersion(appId, manifest) {
    return await pb.collection('integration_versions').create({
      integration_app_id: appId,
      version: manifest.version,
      entry_point: 'index.js',
      is_stable: true,
      manifest_json: manifest
    }, { $autoCancel: false });
  }

  async createCapabilities(versionId, capabilities) {
    for (const cap of capabilities) {
      const capabilityRecord = await pb.collection('integration_capabilities').create({
        integration_version_id: versionId,
        capability_key: cap.capability_key,
        name: cap.name,
        display_name: cap.name,
        description: cap.description || '',
        is_active: true
      }, { $autoCancel: false });

      if (cap.actions && cap.actions.length > 0) {
        for (const action of cap.actions) {
          await pb.collection('capability_actions').create({
            capability_id: capabilityRecord.id,
            action_key: action.action_key,
            name: action.name,
            display_name: action.name,
            description: action.description || '',
            handler: action.handler,
            input_schema_json: action.input_schema || null,
            output_schema_json: action.output_schema || null,
            is_active: true
          }, { $autoCancel: false });
        }
      }
    }
  }

  async createMetadata(appId, manifest) {
    try {
      // Check if metadata exists
      const existing = await pb.collection('integration_metadata').getFirstListItem(`integration_app_id="${appId}"`, { $autoCancel: false });
      
      return await pb.collection('integration_metadata').update(existing.id, {
        config_schema_json: manifest.configSchema || null,
        authentication_type: manifest.authentication_type || 'none',
        rate_limit: manifest.rate_limit || 0,
        timeout_ms: manifest.timeout_ms || 30000
      }, { $autoCancel: false });
    } catch (e) {
      return await pb.collection('integration_metadata').create({
        integration_app_id: appId,
        integration_id: appId,
        config_schema_json: manifest.configSchema || null,
        authentication_type: manifest.authentication_type || 'none',
        rate_limit: manifest.rate_limit || 0,
        timeout_ms: manifest.timeout_ms || 30000
      }, { $autoCancel: false });
    }
  }
}
