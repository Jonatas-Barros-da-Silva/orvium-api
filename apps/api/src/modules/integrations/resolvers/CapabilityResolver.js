
/**
 * Resolver for discovering and validating capabilities available to workspaces
 */
export class CapabilityResolver {
  /**
   * @param {import('../services/CapabilityRegistryService.js').CapabilityRegistryService} registryService 
   * @param {Object} pb - PocketBase client instance
   */
  constructor(registryService, pb) {
    this.registryService = registryService;
    this.pb = pb;
  }

  /**
   * Resolves all available capabilities and their actions for a workspace
   * @param {string} workspaceId 
   * @returns {Promise<Array<{capability: import('../types/capability.types.js').Capability, actions: import('../types/capability.types.js').CapabilityAction[]}>>}
   */
  async resolveWorkspaceCapabilities(workspaceId) {
    try {
      const capabilities = await this.registryService.listCapabilitiesForWorkspace(workspaceId);
      const result = [];

      for (const cap of capabilities) {
        const actions = await this.pb.collection('capability_actions').getFullList({
          filter: `capability_id = "${cap.id}" && is_active = true`,
          $autoCancel: false
        });

        result.push({
          capability: cap,
          actions: actions
        });
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to resolve workspace capabilities: ${error.message}`);
    }
  }

  /**
   * Resolves a specific capability for a workspace to ensure they have access to it
   * @param {string} workspaceId 
   * @param {string} capabilityKey 
   * @returns {Promise<import('../types/capability.types.js').Capability>}
   */
  async resolveCapability(workspaceId, capabilityKey) {
    try {
      const capabilities = await this.registryService.listCapabilitiesForWorkspace(workspaceId);
      const capability = capabilities.find(c => c.capability_key === capabilityKey);

      if (!capability) {
        throw new Error(`Capability '${capabilityKey}' is not available for this workspace or is inactive.`);
      }

      return capability;
    } catch (error) {
      throw new Error(`Failed to resolve capability: ${error.message}`);
    }
  }

  /**
   * Resolves all capabilities and actions for a specific integration version
   * @param {string} versionId 
   * @returns {Promise<Array<{capability: import('../types/capability.types.js').Capability, actions: import('../types/capability.types.js').CapabilityAction[]}>>}
   */
  async resolveIntegrationCapabilities(versionId) {
    try {
      const capabilities = await this.registryService.listCapabilitiesForIntegration(versionId);
      const result = [];

      for (const cap of capabilities) {
        const actions = await this.pb.collection('capability_actions').getFullList({
          filter: `capability_id = "${cap.id}"`,
          $autoCancel: false
        });

        result.push({
          capability: cap,
          actions: actions
        });
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to resolve integration capabilities: ${error.message}`);
    }
  }

  /**
   * Resolves a specific action for a workspace capability
   * @param {string} workspaceId 
   * @param {string} capabilityKey 
   * @param {string} actionKey 
   * @returns {Promise<{capability: import('../types/capability.types.js').Capability, action: import('../types/capability.types.js').CapabilityAction}>}
   */
  async resolveAction(workspaceId, capabilityKey, actionKey) {
    try {
      const capability = await this.resolveCapability(workspaceId, capabilityKey);
      const action = await this.registryService.getActionByKey(capability.id, actionKey);

      if (!action.is_active) {
        throw new Error(`Action '${actionKey}' is currently inactive.`);
      }

      return { capability, action };
    } catch (error) {
      throw new Error(`Failed to resolve action: ${error.message}`);
    }
  }

  /**
   * Checks if a workspace has access to a specific capability
   * @param {string} workspaceId 
   * @param {string} capabilityKey 
   * @returns {Promise<boolean>}
   */
  async hasCapability(workspaceId, capabilityKey) {
    try {
      await this.resolveCapability(workspaceId, capabilityKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generates a summary of discovered capabilities for a workspace
   * @param {string} workspaceId 
   * @returns {Promise<{totalCapabilities: number, totalActions: number, capabilities: string[]}>}
   */
  async getDiscoverySummary(workspaceId) {
    try {
      const resolved = await this.resolveWorkspaceCapabilities(workspaceId);
      
      let totalActions = 0;
      const capabilityKeys = [];

      for (const item of resolved) {
        capabilityKeys.push(item.capability.capability_key);
        totalActions += item.actions.length;
      }

      return {
        totalCapabilities: resolved.length,
        totalActions,
        capabilities: capabilityKeys
      };
    } catch (error) {
      throw new Error(`Failed to generate discovery summary: ${error.message}`);
    }
  }
}
