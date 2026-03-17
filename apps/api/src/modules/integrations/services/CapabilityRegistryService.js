
/**
 * Service for managing Integration Capabilities and Actions in the registry
 */
export class CapabilityRegistryService {
  /**
   * @param {Object} pb - PocketBase client instance
   */
  constructor(pb) {
    this.pb = pb;
  }

  /**
   * Registers a new capability for an integration version
   * @param {Object} data 
   * @returns {Promise<import('../types/capability.types.js').Capability>}
   */
  async registerCapability(data) {
    try {
      if (!data.integration_version_id || !data.capability_key || !data.name) {
        throw new Error('Missing required fields: integration_version_id, capability_key, name');
      }

      const record = await this.pb.collection('integration_capabilities').create({
        ...data,
        is_active: data.is_active !== undefined ? data.is_active : true
      }, { $autoCancel: false });

      return record;
    } catch (error) {
      throw new Error(`Failed to register capability: ${error.message}`);
    }
  }

  /**
   * Registers a new action for a capability
   * @param {Object} data 
   * @returns {Promise<import('../types/capability.types.js').CapabilityAction>}
   */
  async registerAction(data) {
    try {
      if (!data.capability_id || !data.action_key || !data.name || !data.handler) {
        throw new Error('Missing required fields: capability_id, action_key, name, handler');
      }

      const record = await this.pb.collection('capability_actions').create({
        ...data,
        is_active: data.is_active !== undefined ? data.is_active : true
      }, { $autoCancel: false });

      return record;
    } catch (error) {
      throw new Error(`Failed to register action: ${error.message}`);
    }
  }

  /**
   * Retrieves a capability by its ID
   * @param {string} id 
   * @returns {Promise<import('../types/capability.types.js').Capability>}
   */
  async getCapability(id) {
    try {
      return await this.pb.collection('integration_capabilities').getOne(id, { $autoCancel: false });
    } catch (error) {
      throw new Error(`Capability not found: ${error.message}`);
    }
  }

  /**
   * Retrieves a capability by version ID and capability key
   * @param {string} versionId 
   * @param {string} capabilityKey 
   * @returns {Promise<import('../types/capability.types.js').Capability>}
   */
  async getCapabilityByKey(versionId, capabilityKey) {
    try {
      return await this.pb.collection('integration_capabilities').getFirstListItem(
        `integration_version_id = "${versionId}" && capability_key = "${capabilityKey}"`,
        { $autoCancel: false }
      );
    } catch (error) {
      throw new Error(`Capability key '${capabilityKey}' not found for version '${versionId}'`);
    }
  }

  /**
   * Lists all capabilities for a specific integration version
   * @param {string} versionId 
   * @returns {Promise<import('../types/capability.types.js').Capability[]>}
   */
  async listCapabilitiesForIntegration(versionId) {
    try {
      return await this.pb.collection('integration_capabilities').getFullList({
        filter: `integration_version_id = "${versionId}"`,
        sort: 'name',
        $autoCancel: false
      });
    } catch (error) {
      throw new Error(`Failed to list capabilities: ${error.message}`);
    }
  }

  /**
   * Lists all active capabilities available to a specific workspace based on installed integrations
   * @param {string} workspaceId 
   * @returns {Promise<import('../types/capability.types.js').Capability[]>}
   */
  async listCapabilitiesForWorkspace(workspaceId) {
    try {
      // 1. Get active installations for the workspace
      const installations = await this.pb.collection('workspace_integrations').getFullList({
        filter: `workspace_id = "${workspaceId}" && status = "active"`,
        $autoCancel: false
      });

      if (installations.length === 0) {
        return [];
      }

      // 2. Extract version IDs
      const versionIds = installations.map(inst => inst.app_version_id);

      // 3. Fetch capabilities for those versions
      const filterStr = versionIds.map(id => `integration_version_id = "${id}"`).join(' || ');
      
      return await this.pb.collection('integration_capabilities').getFullList({
        filter: `(${filterStr}) && is_active = true`,
        $autoCancel: false
      });
    } catch (error) {
      throw new Error(`Failed to list workspace capabilities: ${error.message}`);
    }
  }

  /**
   * Retrieves an action by its ID
   * @param {string} id 
   * @returns {Promise<import('../types/capability.types.js').CapabilityAction>}
   */
  async getAction(id) {
    try {
      return await this.pb.collection('capability_actions').getOne(id, { $autoCancel: false });
    } catch (error) {
      throw new Error(`Action not found: ${error.message}`);
    }
  }

  /**
   * Retrieves an action by capability ID and action key
   * @param {string} capabilityId 
   * @param {string} actionKey 
   * @returns {Promise<import('../types/capability.types.js').CapabilityAction>}
   */
  async getActionByKey(capabilityId, actionKey) {
    try {
      return await this.pb.collection('capability_actions').getFirstListItem(
        `capability_id = "${capabilityId}" && action_key = "${actionKey}"`,
        { $autoCancel: false }
      );
    } catch (error) {
      throw new Error(`Action key '${actionKey}' not found for capability '${capabilityId}'`);
    }
  }

  /**
   * Updates an existing capability
   * @param {string} id 
   * @param {Object} data 
   * @returns {Promise<import('../types/capability.types.js').Capability>}
   */
  async updateCapability(id, data) {
    try {
      return await this.pb.collection('integration_capabilities').update(id, data, { $autoCancel: false });
    } catch (error) {
      throw new Error(`Failed to update capability: ${error.message}`);
    }
  }

  /**
   * Deactivates a capability (soft delete)
   * @param {string} id 
   * @returns {Promise<import('../types/capability.types.js').Capability>}
   */
  async deactivateCapability(id) {
    try {
      return await this.pb.collection('integration_capabilities').update(id, { is_active: false }, { $autoCancel: false });
    } catch (error) {
      throw new Error(`Failed to deactivate capability: ${error.message}`);
    }
  }

  /**
   * Gets statistics about registered capabilities and actions
   * @returns {Promise<{totalCapabilities: number, totalActions: number, activeCapabilities: number}>}
   */
  async getCapabilityStats() {
    try {
      const capabilities = await this.pb.collection('integration_capabilities').getFullList({ $autoCancel: false });
      const actions = await this.pb.collection('capability_actions').getFullList({ $autoCancel: false });

      return {
        totalCapabilities: capabilities.length,
        activeCapabilities: capabilities.filter(c => c.is_active).length,
        totalActions: actions.length
      };
    } catch (error) {
      throw new Error(`Failed to get capability stats: ${error.message}`);
    }
  }
}
