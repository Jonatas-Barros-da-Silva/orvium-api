import 'dotenv/config';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

/**
 * Permission Engine Service
 * Validates integration permissions against app version requirements
 */
export class PermissionEngine {
  /**
   * Get permissions for an integration from its app version
   * @param {string} integrationId - Integration ID (UUID)
   * @returns {Promise<Array>} - Array of permission strings
   */
  async getIntegrationPermissions(integrationId) {
    if (!integrationId || typeof integrationId !== 'string') {
      throw new Error('Integration ID must be a non-empty string');
    }

    try {
      // Get workspace integration
      const integration = await pb.collection('workspace_integrations').getOne(integrationId, {
        $autoCancel: false,
      });

      if (!integration) {
        throw new Error('Integration not found');
      }

      // Get app version
      const appVersion = await pb.collection('integration_app_versions').getOne(
        integration.app_version_id,
        { $autoCancel: false }
      );

      if (!appVersion) {
        logger.warn(`No app version found for integration ${integrationId}`);
        return [];
      }

      // Return permissions array or empty array
      return Array.isArray(appVersion.permissions) ? appVersion.permissions : [];
    } catch (error) {
      logger.error(`Error getting integration permissions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if integration has a single permission
   * @param {string} integrationId - Integration ID (UUID)
   * @param {string} permission - Permission to check (e.g., 'integration.read')
   * @returns {Promise<boolean>} - True if permission is granted
   */
  async hasPermission(integrationId, permission) {
    if (!integrationId || typeof integrationId !== 'string') {
      throw new Error('Integration ID must be a non-empty string');
    }

    if (!permission || typeof permission !== 'string') {
      throw new Error('Permission must be a non-empty string');
    }

    try {
      const permissions = await this.getIntegrationPermissions(integrationId);
      return permissions.includes(permission);
    } catch (error) {
      logger.error(`Error checking permission: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate that integration has all required permissions
   * Queries app version to get granted permissions and compares against required
   * @param {Object} integration - Workspace integration record with app_version_id
   * @param {Array<string>} requiredPermissions - Array of required permissions
   * @returns {Promise<Object>} - {allowed: boolean, requiredPermissions: [], grantedPermissions: [], missingPermissions: []}
   */
  async validateIntegrationPermissions(integration, requiredPermissions) {
    if (!integration || typeof integration !== 'object') {
      throw new Error('Integration must be a non-empty object');
    }

    if (!integration.app_version_id || typeof integration.app_version_id !== 'string') {
      throw new Error('Integration must have app_version_id');
    }

    // If no required permissions, allow by default
    if (!requiredPermissions || !Array.isArray(requiredPermissions) || requiredPermissions.length === 0) {
      return {
        allowed: true,
        requiredPermissions: [],
        grantedPermissions: [],
        missingPermissions: [],
      };
    }

    try {
      // Query app version by integration.app_version_id
      const appVersion = await pb.collection('integration_app_versions').getOne(
        integration.app_version_id,
        { $autoCancel: false }
      );

      if (!appVersion) {
        logger.warn(`No app version found for integration ${integration.id}`);
        return {
          allowed: false,
          requiredPermissions,
          grantedPermissions: [],
          missingPermissions: requiredPermissions,
        };
      }

      // Get granted permissions from version
      const grantedPermissions = Array.isArray(appVersion.permissions) ? appVersion.permissions : [];

      // Find missing permissions
      const missingPermissions = requiredPermissions.filter(
        perm => !grantedPermissions.includes(perm)
      );

      const allowed = missingPermissions.length === 0;

      return {
        allowed,
        requiredPermissions,
        grantedPermissions,
        missingPermissions,
      };
    } catch (error) {
      logger.error(`Error validating permissions: ${error.message}`);
      return {
        allowed: false,
        requiredPermissions,
        grantedPermissions: [],
        missingPermissions: requiredPermissions,
      };
    }
  }
}

// Export singleton instance
export const permissionEngine = new PermissionEngine();

export default permissionEngine;
