import 'dotenv/config';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

/**
 * Integration Configuration Service
 * Manages integration adapter configurations per workspace
 */
class IntegrationConfigService {
  /**
   * Get integration configuration for a workspace and adapter
   * @param {string} workspaceId - Workspace ID
   * @param {string} adapterName - Adapter name (matches adapter_name field in integration_configs)
   * @returns {Promise<Object|null>} - Config object or null if not found
   */
  async getIntegrationConfig(workspaceId, adapterName) {
    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new Error('Workspace ID must be a non-empty string');
    }

    if (!adapterName || typeof adapterName !== 'string') {
      throw new Error('Adapter name must be a non-empty string');
    }

    try {
      const config = await pb.collection('integration_configs').getFirstListItem(
        `workspace_id="${workspaceId}" && adapter_name="${adapterName}"`,
        { $autoCancel: false }
      );
      return config || null;
    } catch (error) {
      if (error.message.includes('Failed to find')) {
        return null;
      }
      logger.error(`Error getting integration config: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if adapter is enabled for workspace
   * @param {string} workspaceId - Workspace ID
   * @param {string} adapterName - Adapter name
   * @returns {Promise<boolean>} - True if enabled, false otherwise
   */
  async isAdapterEnabled(workspaceId, adapterName) {
    const config = await this.getIntegrationConfig(workspaceId, adapterName);
    return config ? config.enabled === true : false;
  }

  /**
   * Get allowed event types for adapter
   * @param {string} workspaceId - Workspace ID
   * @param {string} adapterName - Adapter name
   * @returns {Promise<Array>} - Array of allowed event types or empty array
   */
  async getAdapterEventFilter(workspaceId, adapterName) {
    const config = await this.getIntegrationConfig(workspaceId, adapterName);
    if (!config || !config.config_json) {
      return [];
    }

    const configJson = typeof config.config_json === 'string'
      ? JSON.parse(config.config_json)
      : config.config_json;

    return Array.isArray(configJson.events) ? configJson.events : [];
  }

  /**
   * Check if event type is allowed for adapter
   * @param {string} workspaceId - Workspace ID
   * @param {string} adapterName - Adapter name
   * @param {string} eventType - Event type to check
   * @returns {Promise<boolean>} - True if event is allowed
   */
  async isEventAllowed(workspaceId, adapterName, eventType) {
    if (!eventType || typeof eventType !== 'string') {
      return false;
    }

    const allowedEvents = await this.getAdapterEventFilter(workspaceId, adapterName);
    if (allowedEvents.length === 0) {
      return true; // No filter means all events allowed
    }

    return allowedEvents.includes(eventType);
  }

  /**
   * Get all integration configurations for workspace
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise<Array>} - Array of config objects
   */
  async getAllAdapterConfigs(workspaceId) {
    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new Error('Workspace ID must be a non-empty string');
    }

    try {
      const configs = await pb.collection('integration_configs').getFullList({
        filter: `workspace_id="${workspaceId}"`,
        sort: '-created',
        $autoCancel: false,
      });
      return configs;
    } catch (error) {
      logger.error(`Error getting all adapter configs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create new integration configuration
   * @param {string} workspaceId - Workspace ID
   * @param {string} adapterName - Adapter name
   * @param {boolean} enabled - Whether adapter is enabled
   * @param {Object} configJson - Configuration JSON object
   * @returns {Promise<Object>} - Created config record
   */
  async createIntegrationConfig(workspaceId, adapterName, enabled, configJson) {
    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new Error('Workspace ID must be a non-empty string');
    }

    if (!adapterName || typeof adapterName !== 'string') {
      throw new Error('Adapter name must be a non-empty string');
    }

    if (typeof enabled !== 'boolean') {
      throw new Error('Enabled must be a boolean');
    }

    if (!configJson || typeof configJson !== 'object') {
      throw new Error('Config JSON must be a non-empty object');
    }

    try {
      const config = await pb.collection('integration_configs').create({
        workspace_id: workspaceId,
        adapter_name: adapterName,
        enabled,
        config_json: configJson,
      }, { $autoCancel: false });

      logger.info(`Integration config created: ${adapterName} for workspace ${workspaceId}`);
      return config;
    } catch (error) {
      logger.error(`Error creating integration config: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update integration configuration
   * @param {string} configId - Configuration record ID
   * @param {boolean} enabled - Whether adapter is enabled
   * @param {Object} configJson - Configuration JSON object
   * @returns {Promise<Object>} - Updated config record
   */
  async updateIntegrationConfig(configId, enabled, configJson) {
    if (!configId || typeof configId !== 'string') {
      throw new Error('Config ID must be a non-empty string');
    }

    if (typeof enabled !== 'boolean') {
      throw new Error('Enabled must be a boolean');
    }

    if (!configJson || typeof configJson !== 'object') {
      throw new Error('Config JSON must be a non-empty object');
    }

    try {
      const config = await pb.collection('integration_configs').update(
        configId,
        {
          enabled,
          config_json: configJson,
        },
        { $autoCancel: false }
      );

      logger.info(`Integration config updated: ${configId}`);
      return config;
    } catch (error) {
      logger.error(`Error updating integration config: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete integration configuration
   * @param {string} configId - Configuration record ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteIntegrationConfig(configId) {
    if (!configId || typeof configId !== 'string') {
      throw new Error('Config ID must be a non-empty string');
    }

    try {
      await pb.collection('integration_configs').delete(configId, { $autoCancel: false });
      logger.info(`Integration config deleted: ${configId}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting integration config: ${error.message}`);
      throw error;
    }
  }
}

// Export singleton instance
const integrationConfigService = new IntegrationConfigService();

export { integrationConfigService, IntegrationConfigService };
export default integrationConfigService;
