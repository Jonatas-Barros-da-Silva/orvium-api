
import pb from '../../../utils/pocketbaseClient.js';

/**
 * Resolver for constructing fully hydrated integration objects for execution
 */
export class IntegrationResolver {
  /**
   * Resolve a single integration by its slug for a specific workspace
   * @param {string} workspaceId - Workspace ID
   * @param {string} integrationSlug - Integration App slug
   * @returns {Promise<Object>} ResolvedIntegration object
   */
  async resolveIntegration(workspaceId, integrationSlug) {
    try {
      // 1. Get App by slug
      const app = await pb.collection('integration_apps').getFirstListItem(`slug="${integrationSlug}"`, { 
        $autoCancel: false 
      });

      // 2. Get active Installation for this workspace and app
      const installation = await pb.collection('integration_installations').getFirstListItem(
        `workspace_id="${workspaceId}" && integration_app_id="${app.id}" && status="active"`,
        { $autoCancel: false }
      );

      // 3. Get Version details
      const version = await pb.collection('integration_versions').getOne(installation.integration_version_id, { 
        $autoCancel: false 
      });

      // 4. Get Permissions
      const permissions = await pb.collection('integration_permissions').getFullList({
        filter: `integration_version_id="${version.id}"`,
        $autoCancel: false
      });

      // 5. Construct ResolvedIntegration
      return {
        id: installation.id,
        slug: app.slug,
        name: app.name,
        entryPoint: version.entry_point,
        config: installation.config || {},
        permissions: permissions.map(p => p.permission_key),
        version: version.version,
        appId: app.id,
        workspaceId: workspaceId
      };
    } catch (error) {
      throw new Error(`Failed to resolve integration '${integrationSlug}': ${error.message}`);
    }
  }

  /**
   * Resolve all active integrations installed in a workspace
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise<Array<Object>>} Array of ResolvedIntegration objects
   */
  async resolveWorkspaceIntegrations(workspaceId) {
    try {
      // Get all active installations with expanded app and version
      const installations = await pb.collection('integration_installations').getFullList({
        filter: `workspace_id="${workspaceId}" && status="active"`,
        expand: 'integration_app_id,integration_version_id',
        $autoCancel: false
      });

      const resolvedIntegrations = [];

      for (const inst of installations) {
        const app = inst.expand?.integration_app_id;
        const version = inst.expand?.integration_version_id;

        if (!app || !version) continue;

        // Fetch permissions for this version
        const permissions = await pb.collection('integration_permissions').getFullList({
          filter: `integration_version_id="${version.id}"`,
          $autoCancel: false
        });

        resolvedIntegrations.push({
          id: inst.id,
          slug: app.slug,
          name: app.name,
          entryPoint: version.entry_point,
          config: inst.config || {},
          permissions: permissions.map(p => p.permission_key),
          version: version.version,
          appId: app.id,
          workspaceId: workspaceId
        });
      }

      return resolvedIntegrations;
    } catch (error) {
      throw new Error(`Failed to resolve workspace integrations: ${error.message}`);
    }
  }
}
