
import pb from '../../../utils/pocketbaseClient.js';

/**
 * Service for managing Integration Versions and Permissions
 */
export class IntegrationVersionService {
  /**
   * Publish a new version for an integration
   * @param {Object} data - Version data
   * @returns {Promise<Object>} Created version
   */
  async publishVersion(data) {
    try {
      return await pb.collection('integration_versions').create(data, { $autoCancel: false });
    } catch (error) {
      throw new Error(`Failed to publish version: ${error.message}`);
    }
  }

  /**
   * Get a specific version by ID
   * @param {string} id - Version ID
   * @returns {Promise<Object>} Version object
   */
  async getVersion(id) {
    try {
      return await pb.collection('integration_versions').getOne(id, { $autoCancel: false });
    } catch (error) {
      throw new Error(`Failed to get version: ${error.message}`);
    }
  }

  /**
   * Get the absolute latest version for an app (regardless of stability)
   * @param {string} appId - Integration App ID
   * @returns {Promise<Object|null>} Latest version or null
   */
  async getLatestVersion(appId) {
    try {
      const result = await pb.collection('integration_versions').getList(1, 1, {
        filter: `integration_app_id="${appId}"`,
        sort: '-created',
        $autoCancel: false
      });
      return result.items.length > 0 ? result.items[0] : null;
    } catch (error) {
      throw new Error(`Failed to get latest version: ${error.message}`);
    }
  }

  /**
   * Get the latest stable version for an app
   * @param {string} appId - Integration App ID
   * @returns {Promise<Object|null>} Latest stable version or null
   */
  async getLatestStableVersion(appId) {
    try {
      const result = await pb.collection('integration_versions').getList(1, 1, {
        filter: `integration_app_id="${appId}" && is_stable=true`,
        sort: '-created',
        $autoCancel: false
      });
      return result.items.length > 0 ? result.items[0] : null;
    } catch (error) {
      throw new Error(`Failed to get latest stable version: ${error.message}`);
    }
  }

  /**
   * List all versions for an app
   * @param {string} appId - Integration App ID
   * @param {number} page - Page number
   * @param {number} perPage - Items per page
   * @returns {Promise<Object>} Paginated list of versions
   */
  async listVersions(appId, page = 1, perPage = 50) {
    try {
      return await pb.collection('integration_versions').getList(page, perPage, {
        filter: `integration_app_id="${appId}"`,
        sort: '-created',
        $autoCancel: false
      });
    } catch (error) {
      throw new Error(`Failed to list versions: ${error.message}`);
    }
  }

  /**
   * Mark a version as stable
   * @param {string} id - Version ID
   * @returns {Promise<Object>} Updated version
   */
  async markAsStable(id) {
    try {
      return await pb.collection('integration_versions').update(id, { is_stable: true }, { $autoCancel: false });
    } catch (error) {
      throw new Error(`Failed to mark version as stable: ${error.message}`);
    }
  }

  /**
   * Deprecate a version (mark as not stable)
   * @param {string} id - Version ID
   * @returns {Promise<Object>} Updated version
   */
  async deprecateVersion(id) {
    try {
      return await pb.collection('integration_versions').update(id, { is_stable: false }, { $autoCancel: false });
    } catch (error) {
      throw new Error(`Failed to deprecate version: ${error.message}`);
    }
  }

  /**
   * Add a required permission to a version
   * @param {Object} data - Permission data
   * @returns {Promise<Object>} Created permission
   */
  async addPermission(data) {
    try {
      return await pb.collection('integration_permissions').create(data, { $autoCancel: false });
    } catch (error) {
      throw new Error(`Failed to add permission: ${error.message}`);
    }
  }

  /**
   * Get all permissions for a specific version
   * @param {string} versionId - Version ID
   * @returns {Promise<Array>} List of permissions
   */
  async getPermissions(versionId) {
    try {
      return await pb.collection('integration_permissions').getFullList({
        filter: `integration_version_id="${versionId}"`,
        $autoCancel: false
      });
    } catch (error) {
      throw new Error(`Failed to get permissions: ${error.message}`);
    }
  }
}
