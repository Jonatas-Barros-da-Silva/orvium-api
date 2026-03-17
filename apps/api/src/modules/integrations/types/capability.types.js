
/**
 * @fileoverview Type definitions for the Integration Capability System
 */

/**
 * Enum for Capability Status
 * @readonly
 * @enum {string}
 */
export const CapabilityStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DEPRECATED: 'deprecated'
};

/**
 * @typedef {Object} Capability
 * @property {string} id - Unique identifier
 * @property {string} integration_version_id - Reference to the integration version
 * @property {string} capability_key - Unique key for the capability within the version
 * @property {string} name - Human-readable name
 * @property {string} [description] - Detailed description
 * @property {Object} [input_schema] - JSON schema for expected input
 * @property {Object} [output_schema] - JSON schema for expected output
 * @property {boolean} is_active - Whether the capability is currently active
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */

/**
 * @typedef {Object} CapabilityAction
 * @property {string} id - Unique identifier
 * @property {string} capability_id - Reference to the parent capability
 * @property {string} action_key - Unique key for the action within the capability
 * @property {string} name - Human-readable name
 * @property {string} [description] - Detailed description
 * @property {string} handler - The function or method name to handle this action
 * @property {Object} [input_schema] - JSON schema for expected input specific to this action
 * @property {Object} [output_schema] - JSON schema for expected output specific to this action
 * @property {boolean} is_active - Whether the action is currently active
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */

/**
 * @typedef {Object} WorkspaceCapability
 * @property {Capability} capability - The capability details
 * @property {CapabilityAction[]} actions - List of actions available for this capability
 * @property {string} integration_app_id - The ID of the integration app
 * @property {string} workspace_id - The ID of the workspace
 */
