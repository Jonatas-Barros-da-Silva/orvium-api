
import pb from '../../../utils/pocketbaseClient.js';

/**
 * Service for managing Integration Installations within workspaces
 */
export class IntegrationInstallationService {
  /**
   * Install an integration in a workspace
   * @param {string} workspaceId - Workspace ID
   * @param {string} appId - Integration App ID
   * @param {string} versionId - Integration Version ID
   * @param {Object} config - Installation configuration
   * @param {string} installedBy - User ID who installed it
   * @returns {Promise<Object>} Created installation
   */
  async installIntegration(workspaceId, appId, versionId, config = {}, installedBy = null) {
    try {
      // Prevent duplicate installations in the same workspace
      const existing = await pb.collection('integration_installations').getList(1, 1, {
        filter: `workspace_id="${workspaceId}" && integration_app_id="${appId}"`,
        $autoCancel: false
      });

      if (existing.items.length > 0) {
        throw new Error('Integration is already installed in this workspace');
      }

      return await pb.collection('integration_installations').create({
        workspace_id: workspaceId,
        integration_app_id: appId,
        integration_version_id: versionId,
        status: 'active',
        config: config,
        installed_by: installedBy,
        installed_at: new Date().toISOString()
      }, { $autoCancel: false });
    } catch (error) {
      throw new Error(`Failed to install integration: ${error.message}`);
    }
  }

  /**
   * Uninstall (delete) an integration from a workspace
   * @param {string} id - Installation ID
   * @returns {Promise<boolean>} Success status
   */
  async uninstallIntegration(id) {
    try {
      return await pb.collection('integration_installations').delete(id, { $autoCancel: false });
    } catch (error) {
      throw new Error(`Failed to uninstall integration: ${error.message}`);
    }
  }

  /**
   * Update the configuration of an existing installation
   * @param {string} id - Installation ID
   * @param {Object} config - New configuration object
   * @returns {Promise<Object>} Updated installation
   */
  async updateInstallationConfig(id, config) {
    try {
      return await pb.collection('integration_installations').update(id, { config }, { $autoCancel: false });
    } catch (error) {
      throw new Error(`Failed to update installation config: ${error.message}`);
    }
  }

  /**
   * Get a specific installation by ID
   * @param {string} id - Installation ID
   * @returns {Promise<Object>} Installation object
   */
  async getInstallation(id) {
    try {
      return await pb.collection('integration_installations').getOne(id, {
        expand: 'integration_app_id,integration_version_id',
        $autoCancel: false
      });
    } catch (error) {
      throw new Error(`Failed to get installation: ${error.message}`);
    }
  }

  /**
   * List all integrations installed in a workspace
   * @param {string} workspaceId - Workspace ID
   * @param {number} page - Page number
   * @param {number} perPage - Items per page
   * @returns {Promise<Object>} Paginated list of installations
   */
  async listWorkspaceIntegrations(workspaceId, page = 1, perPage = 50) {
    try {
      return await pb.collection('integration_installations').getList(page, perPage, {
        filter: `workspace_id="${workspaceId}"`,
        expand: 'integration_app_id,integration_version_id',
        sort: '-created',
        $autoCancel: false
      });
    } catch (error) {
      throw new Error(`Failed to list workspace integrations: ${error.message}`);
    }
  }

  /**
   * Disable an active installation
   * @param {string} id - Installation ID
   * @returns {Promise<Object>} Updated installation
   */
  async disableInstallation(id) {
    try {
      return await pb.collection('integration_installations').update(id, { status: 'disabled' }, { $autoCancel: false });
    } catch (error) {
      throw new Error(`Failed to disable installation: ${error.message}`);
    }
  }

  /**
   * Enable a disabled installation
   * @param {string} id - Installation ID
   * @returns {Promise<Object>} Updated installation
   */
  async enableInstallation(id) {
    try {
      return await pb.collection('integration_installations').update(id, {
        status: 'active',
        error_message: null
      }, { $autoCancel: false });
    } catch (error) {
      throw new Error(`Failed to enable installation: ${error.message}`);
    }
  }

  /**
   * Mark an installation as having an error
   * @param {string} id - Installation ID
   * @param {string} errorMessage - Error description
   * @returns {Promise<Object>} Updated installation
   */
  async markAsError(id, errorMessage) {
    try {
      return await pb.collection('integration_installations').update(id, {
        status: 'error',
        error_message: errorMessage
      }, { $autoCancel: false });
    } catch (error) {
      throw new Error(`Failed to mark installation as error: ${error.message}`);
    }
  }
}
