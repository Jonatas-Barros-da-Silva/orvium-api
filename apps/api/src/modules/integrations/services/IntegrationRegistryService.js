
import pb from '../../../utils/pocketbaseClient.js';

/**
 * Service for managing Integration Apps in the registry/marketplace
 */
export class IntegrationRegistryService {
  /**
   * Publish a new integration app
   * @param {Object} data - Integration app data
   * @returns {Promise<Object>} Created integration app
   */
  async publishIntegration(data) {
    try {
      return await pb.collection('integration_apps').create(data, { $autoCancel: false });
    } catch (error) {
      throw new Error(`Failed to publish integration: ${error.message}`);
    }
  }

  /**
   * Update an existing integration app
   * @param {string} id - Integration app ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Updated integration app
   */
  async updateIntegration(id, data) {
    try {
      return await pb.collection('integration_apps').update(id, data, { $autoCancel: false });
    } catch (error) {
      throw new Error(`Failed to update integration: ${error.message}`);
    }
  }

  /**
   * Get an integration app by ID
   * @param {string} id - Integration app ID
   * @returns {Promise<Object>} Integration app
   */
  async getIntegration(id) {
    try {
      return await pb.collection('integration_apps').getOne(id, { $autoCancel: false });
    } catch (error) {
      throw new Error(`Failed to get integration: ${error.message}`);
    }
  }

  /**
   * Get an integration app by its unique slug
   * @param {string} slug - Integration app slug
   * @returns {Promise<Object>} Integration app
   */
  async getIntegrationBySlug(slug) {
    try {
      return await pb.collection('integration_apps').getFirstListItem(`slug="${slug}"`, { $autoCancel: false });
    } catch (error) {
      throw new Error(`Failed to get integration by slug: ${error.message}`);
    }
  }

  /**
   * List all public, published integrations (Marketplace view)
   * @param {number} page - Page number
   * @param {number} perPage - Items per page
   * @returns {Promise<Object>} Paginated list of integrations
   */
  async listPublicIntegrations(page = 1, perPage = 50) {
    try {
      return await pb.collection('integration_apps').getList(page, perPage, {
        filter: 'is_public=true && status="published"',
        sort: '-created',
        $autoCancel: false
      });
    } catch (error) {
      throw new Error(`Failed to list public integrations: ${error.message}`);
    }
  }

  /**
   * List all integrations owned by a specific developer
   * @param {string} developerId - Developer ID
   * @param {number} page - Page number
   * @param {number} perPage - Items per page
   * @returns {Promise<Object>} Paginated list of integrations
   */
  async listDeveloperIntegrations(developerId, page = 1, perPage = 50) {
    try {
      return await pb.collection('integration_apps').getList(page, perPage, {
        filter: `developer_id="${developerId}"`,
        sort: '-created',
        $autoCancel: false
      });
    } catch (error) {
      throw new Error(`Failed to list developer integrations: ${error.message}`);
    }
  }

  /**
   * Publish an integration to the public marketplace
   * @param {string} id - Integration app ID
   * @returns {Promise<Object>} Updated integration app
   */
  async publishIntegrationToMarketplace(id) {
    try {
      return await pb.collection('integration_apps').update(id, {
        is_public: true,
        status: 'published'
      }, { $autoCancel: false });
    } catch (error) {
      throw new Error(`Failed to publish integration to marketplace: ${error.message}`);
    }
  }

  /**
   * Deprecate an integration app
   * @param {string} id - Integration app ID
   * @returns {Promise<Object>} Updated integration app
   */
  async deprecateIntegration(id) {
    try {
      return await pb.collection('integration_apps').update(id, {
        status: 'deprecated'
      }, { $autoCancel: false });
    } catch (error) {
      throw new Error(`Failed to deprecate integration: ${error.message}`);
    }
  }
}
