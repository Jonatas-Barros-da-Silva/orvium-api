
/**
 * @fileoverview Type definitions for the Integrations module using JSDoc.
 * Note: Implemented as a .js file with JSDoc to comply with strict JavaScript-only environment constraints.
 */

/**
 * @typedef {Object} IntegrationApp
 * @property {string} id - Unique identifier for the integration app
 * @property {string} slug - Unique URL-friendly slug
 * @property {string} name - Display name of the integration
 * @property {string} [description] - Detailed description
 * @property {string} [developer_id] - ID of the developer who created it
 * @property {string} [category] - Category (e.g., analytics, crm)
 * @property {string} [logo_url] - URL to the integration logo
 * @property {boolean} is_public - Whether the integration is available in the marketplace
 * @property {'draft'|'published'|'deprecated'} status - Current status of the app
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */

/**
 * @typedef {Object} IntegrationVersion
 * @property {string} id - Unique identifier for the version
 * @property {string} integration_app_id - Reference to the parent IntegrationApp
 * @property {string} version - Semantic version string (e.g., '1.0.0')
 * @property {string} [sdk_version] - Version of the SDK used
 * @property {string} entry_point - Main entry point or handler identifier
 * @property {Record<string, any>} [config_schema] - JSON schema for configuration
 * @property {Record<string, any>} [permissions] - Required permissions definition
 * @property {boolean} is_stable - Whether this version is marked as stable
 * @property {string} [changelog] - Release notes or changelog
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} IntegrationPermission
 * @property {string} id - Unique identifier
 * @property {string} integration_version_id - Reference to the IntegrationVersion
 * @property {string} permission_key - The specific permission required (e.g., 'read:users')
 * @property {string} [description] - Human-readable description of why the permission is needed
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} IntegrationMetadata
 * @property {string} id - Unique identifier
 * @property {string} integration_app_id - Reference to the IntegrationApp
 * @property {string} [documentation_url] - Link to external documentation
 * @property {string} [website_url] - Link to developer's website
 * @property {string} [support_url] - Link for support
 * @property {Array<string>} [tags] - Searchable tags
 * @property {Array<string>} [screenshots] - URLs to screenshots
 * @property {number} [rating] - Average user rating
 * @property {number} [download_count] - Number of times installed
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */

/**
 * @typedef {Object} IntegrationInstallation
 * @property {string} id - Unique identifier for the installation
 * @property {string} workspace_id - ID of the workspace where installed
 * @property {string} integration_app_id - Reference to the installed IntegrationApp
 * @property {string} integration_version_id - Reference to the specific IntegrationVersion installed
 * @property {'active'|'disabled'|'error'} status - Current status of the installation
 * @property {Record<string, any>} [config] - User-provided configuration matching the version's schema
 * @property {string} [error_message] - Last error message if status is 'error'
 * @property {string} [installed_by] - User ID who performed the installation
 * @property {string} installed_at - Installation timestamp
 * @property {string} updated_at - Last update timestamp
 */

/**
 * @typedef {Object} ResolvedIntegration
 * @property {string} id - Installation ID
 * @property {string} slug - Integration App slug
 * @property {string} name - Integration App name
 * @property {string} entryPoint - Execution entry point from the version
 * @property {Record<string, any>} config - Workspace-specific configuration
 * @property {Array<string>} permissions - Array of granted permission keys
 * @property {string} version - Semantic version string
 * @property {string} appId - Integration App ID
 * @property {string} workspaceId - Workspace ID
 */

export {};
