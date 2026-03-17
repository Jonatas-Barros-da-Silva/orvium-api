
import 'dotenv/config';
import pb from '../utils/pocketbaseClient.js';
import { tokenEncryptionService } from './tokenEncryptionService.js';
import logger from '../utils/logger.js';

/**
 * Marketplace Service
 * Manages marketplace apps, versions, installations, and integrations
 */
export class MarketplaceService {
  /**
   * Validate UUID format (UUIDv4)
   * @param {string} uuid - UUID to validate
   * @returns {boolean} - True if valid UUID format
   */
  validateUUID(uuid) {
    if (!uuid || typeof uuid !== 'string') {
      return false;
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Get marketplace apps with optional filters
   * @param {Object} filters - Optional filters {category, status}
   * @returns {Promise<Object>} - {apps: [...], total: number}
   */
  async getMarketplaceApps(filters = {}) {
    let filterString = 'status="active"';

    if (filters.category) {
      filterString += ` && category="${filters.category}"`;
    }

    if (filters.status) {
      filterString += ` && status="${filters.status}"`;
    }

    const apps = await pb.collection('integration_apps').getFullList({
      filter: filterString,
      sort: '-created',
      $autoCancel: false,
    });

    // Get latest active version for each app
    const appsWithVersions = await Promise.all(
      apps.map(async (app) => {
        const latestVersion = await this.getLatestAppVersion(app.id);
        return {
          id: app.id,
          name: app.name,
          slug: app.slug,
          description: app.description,
          icon_url: app.icon_url,
          category: app.category,
          status: app.status,
          versions: latestVersion
            ? [
                {
                  id: latestVersion.id,
                  version_name: latestVersion.version_name,
                  adapter_type: latestVersion.adapter_type,
                  status: latestVersion.status,
                },
              ]
            : [],
          created_at: app.created,
        };
      })
    );

    return {
      apps: appsWithVersions,
      total: appsWithVersions.length,
    };
  }

  /**
   * Get app by ID with all active versions
   * @param {string} appId - App ID (UUID)
   * @returns {Promise<Object>} - App object with versions array
   */
  async getAppById(appId) {
    if (!this.validateUUID(appId)) {
      const err = new Error('Invalid app ID format');
      err.status = 400;
      throw err;
    }

    const app = await pb.collection('integration_apps').getOne(appId, {
      $autoCancel: false,
    });

    if (app.status !== 'active') {
      const err = new Error('App is not active');
      err.status = 404;
      throw err;
    }

    const versions = await this.getAppVersions(appId);

    return {
      id: app.id,
      name: app.name,
      slug: app.slug,
      description: app.description,
      icon_url: app.icon_url,
      category: app.category,
      status: app.status,
      versions,
      created_at: app.created,
      updated_at: app.updated,
    };
  }

  /**
   * Get all active versions for an app ordered DESC by version_name
   * @param {string} appId - App ID (UUID)
   * @returns {Promise<Array>} - Array of version objects
   */
  async getAppVersions(appId) {
    if (!this.validateUUID(appId)) {
      const err = new Error('Invalid app ID format');
      err.status = 400;
      throw err;
    }

    const versions = await pb.collection('integration_app_versions').getFullList({
      filter: `app_id="${appId}" && status="active"`,
      sort: '-version_name',
      $autoCancel: false,
    });

    return versions.map(v => ({
      id: v.id,
      version_name: v.version_name,
      adapter_type: v.adapter_type,
      config_schema: v.config_schema,
      permissions: v.permissions,
      status: v.status,
      created_at: v.created,
    }));
  }

  /**
   * Get latest active version for an app
   * @param {string} appId - App ID (UUID)
   * @returns {Promise<Object|null>} - Latest version object or null
   */
  async getLatestAppVersion(appId) {
    if (!this.validateUUID(appId)) {
      const err = new Error('Invalid app ID format');
      err.status = 400;
      throw err;
    }

    const result = await pb.collection('integration_app_versions').getList(1, 1, {
      filter: `app_id="${appId}" && status="active"`,
      sort: '-version_name',
      $autoCancel: false,
    });

    if (result.items.length > 0) {
      const v = result.items[0];
      return {
        id: v.id,
        version_name: v.version_name,
        adapter_type: v.adapter_type,
        config_schema: v.config_schema,
        permissions: v.permissions,
        status: v.status,
        created_at: v.created,
      };
    }

    return null;
  }

  /**
   * Get app version by ID
   * @param {string} versionId - Version ID (UUID)
   * @returns {Promise<Object|null>} - Version object or null
   */
  async getAppVersionById(versionId) {
    if (!this.validateUUID(versionId)) {
      const err = new Error('Invalid version ID format');
      err.status = 400;
      throw err;
    }

    try {
      const version = await pb.collection('integration_app_versions').getOne(versionId, {
        $autoCancel: false,
      });

      if (version.status !== 'active') {
        return null;
      }

      return {
        id: version.id,
        app_id: version.app_id,
        version_name: version.version_name,
        adapter_type: version.adapter_type,
        config_schema: version.config_schema,
        permissions: version.permissions,
        status: version.status,
        created_at: version.created,
      };
    } catch (error) {
      if (error.message.includes('Failed to find')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Install integration to workspace
   * @param {string} workspaceId - Workspace ID (UUID)
   * @param {string} appId - App ID (UUID)
   * @param {string} versionId - Version ID (UUID)
   * @param {Object} config - Integration configuration
   * @param {string} installedBy - User ID who installed
   * @returns {Promise<Object>} - Created integration record
   */
  async installIntegration(workspaceId, appId, versionId, config, installedBy) {
    if (!this.validateUUID(workspaceId)) {
      const err = new Error('Invalid workspace ID format');
      err.status = 400;
      throw err;
    }

    if (!this.validateUUID(appId)) {
      const err = new Error('Invalid app ID format');
      err.status = 400;
      throw err;
    }

    if (!this.validateUUID(versionId)) {
      const err = new Error('Invalid version ID format');
      err.status = 400;
      throw err;
    }

    if (!config || typeof config !== 'object') {
      const err = new Error('Config must be a non-empty object');
      err.status = 400;
      throw err;
    }

    if (!installedBy || typeof installedBy !== 'string') {
      const err = new Error('Installed by must be a non-empty string');
      err.status = 400;
      throw err;
    }

    // Verify app exists and is active
    const app = await this.getAppById(appId);
    if (!app) {
      const err = new Error('App not found');
      err.status = 404;
      throw err;
    }

    // Verify version exists and is active
    const version = await this.getAppVersionById(versionId);
    if (!version) {
      const err = new Error('Version not found');
      err.status = 404;
      throw err;
    }

    if (version.app_id !== appId) {
      const err = new Error('Version does not belong to this app');
      err.status = 400;
      throw err;
    }

    // Check if already installed
    const existingIntegration = await this.getWorkspaceIntegrationByApp(workspaceId, appId);
    if (existingIntegration) {
      const err = new Error('Integration already installed in this workspace');
      err.status = 400;
      throw err;
    }

    // Create integration record
    const integration = await pb.collection('workspace_integrations').create({
      workspace_id: workspaceId,
      app_id: appId,
      app_version_id: versionId,
      config: typeof config === 'string' ? config : JSON.stringify(config),
      status: 'active',
      installed_by: installedBy,
      installed_at: new Date().toISOString(),
    }, { $autoCancel: false });

    // Create default health record
    try {
      await pb.collection('integration_health').create({
        workspace_integration_id: integration.id,
        status: 'healthy',
        consecutive_failures: 0,
        disabled_at: null,
        disabled_reason: null,
      }, { $autoCancel: false });
    } catch (error) {
      logger.warn(`Failed to create health record for integration ${integration.id}:`, error.message);
    }

    // Create default rate limits
    try {
      await pb.collection('integration_rate_limits').create({
        workspace_integration_id: integration.id,
        max_requests_per_minute: 60,
        max_requests_per_hour: 1000,
        max_requests_per_day: 10000,
      }, { $autoCancel: false });
    } catch (error) {
      logger.warn(`Failed to create rate limits for integration ${integration.id}:`, error.message);
    }

    // Log installation
    await this.logInstallation(
      workspaceId,
      appId,
      versionId,
      'install',
      'success',
      installedBy,
      null
    );

    logger.info(
      `Integration installed: workspace=${workspaceId}, app=${appId}, version=${versionId}`
    );

    return {
      id: integration.id,
      workspace_id: integration.workspace_id,
      app_id: integration.app_id,
      app_version_id: integration.app_version_id,
      config: integration.config,
      status: integration.status,
      installed_by: integration.installed_by,
      installed_at: integration.installed_at,
    };
  }

  /**
   * Get all integrations for a workspace
   * @param {string} workspaceId - Workspace ID (UUID)
   * @returns {Promise<Array>} - Array of integration objects with app/version details
   */
  async getWorkspaceIntegrations(workspaceId) {
    if (!this.validateUUID(workspaceId)) {
      const err = new Error('Invalid workspace ID format');
      err.status = 400;
      throw err;
    }

    const integrations = await pb.collection('workspace_integrations').getFullList({
      filter: `workspace_id="${workspaceId}"`,
      sort: '-installed_at',
      expand: 'app_id,app_version_id',
      $autoCancel: false,
    });

    return integrations.map(i => ({
      id: i.id,
      workspace_id: i.workspace_id,
      app_id: i.app_id,
      app_version_id: i.app_version_id,
      config: i.config,
      status: i.status,
      installed_by: i.installed_by,
      installed_at: i.installed_at,
      app: i.expand?.app_id
        ? {
            id: i.expand.app_id.id,
            name: i.expand.app_id.name,
            slug: i.expand.app_id.slug,
            category: i.expand.app_id.category,
            icon_url: i.expand.app_id.icon_url,
          }
        : null,
      version: i.expand?.app_version_id
        ? {
            id: i.expand.app_version_id.id,
            version_name: i.expand.app_version_id.version_name,
            adapter_type: i.expand.app_version_id.adapter_type,
          }
        : null,
    }));
  }

  /**
   * Get single integration for a workspace
   * @param {string} workspaceId - Workspace ID (UUID)
   * @param {string} integrationId - Integration ID (UUID)
   * @returns {Promise<Object>} - Integration object with app/version/config/oauth details
   */
  async getWorkspaceIntegration(workspaceId, integrationId) {
    if (!this.validateUUID(workspaceId)) {
      const err = new Error('Invalid workspace ID format');
      err.status = 400;
      throw err;
    }

    if (!this.validateUUID(integrationId)) {
      const err = new Error('Invalid integration ID format');
      err.status = 400;
      throw err;
    }

    const integration = await pb.collection('workspace_integrations').getOne(integrationId, {
      expand: 'app_id,app_version_id',
      $autoCancel: false,
    });

    if (integration.workspace_id !== workspaceId) {
      const err = new Error('Integration does not belong to this workspace');
      err.status = 403;
      throw err;
    }

    // Get OAuth connection if any
    const oauthConnection = await this.getOAuthConnection(integrationId);

    return {
      id: integration.id,
      workspace_id: integration.workspace_id,
      app_id: integration.app_id,
      app_version_id: integration.app_version_id,
      config: integration.config,
      status: integration.status,
      installed_by: integration.installed_by,
      installed_at: integration.installed_at,
      app: integration.expand?.app_id
        ? {
            id: integration.expand.app_id.id,
            name: integration.expand.app_id.name,
            slug: integration.expand.app_id.slug,
            description: integration.expand.app_id.description,
            icon_url: integration.expand.app_id.icon_url,
            category: integration.expand.app_id.category,
          }
        : null,
      version: integration.expand?.app_version_id
        ? {
            id: integration.expand.app_version_id.id,
            version_name: integration.expand.app_version_id.version_name,
            adapter_type: integration.expand.app_version_id.adapter_type,
            config_schema: integration.expand.app_version_id.config_schema,
            permissions: integration.expand.app_version_id.permissions,
          }
        : null,
      oauth_connection: oauthConnection,
    };
  }

  /**
   * Get workspace integration by app ID
   * @param {string} workspaceId - Workspace ID (UUID)
   * @param {string} appId - App ID (UUID)
   * @returns {Promise<Object|null>} - Integration object or null
   */
  async getWorkspaceIntegrationByApp(workspaceId, appId) {
    if (!this.validateUUID(workspaceId)) {
      const err = new Error('Invalid workspace ID format');
      err.status = 400;
      throw err;
    }

    if (!this.validateUUID(appId)) {
      const err = new Error('Invalid app ID format');
      err.status = 400;
      throw err;
    }

    try {
      const integration = await pb.collection('workspace_integrations').getFirstListItem(
        `workspace_id="${workspaceId}" && app_id="${appId}"`,
        { $autoCancel: false }
      );
      return integration || null;
    } catch (error) {
      if (error.message.includes('Failed to find')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get workspace integration by adapter type
   * @param {string} workspaceId - Workspace ID (UUID)
   * @param {string} adapterType - Adapter type
   * @returns {Promise<Object|null>} - Integration object or null
   */
  async getWorkspaceIntegrationByAdapter(workspaceId, adapterType) {
    if (!this.validateUUID(workspaceId)) {
      const err = new Error('Invalid workspace ID format');
      err.status = 400;
      throw err;
    }

    if (!adapterType || typeof adapterType !== 'string') {
      const err = new Error('Adapter type must be a non-empty string');
      err.status = 400;
      throw err;
    }

    try {
      const integrations = await pb.collection('workspace_integrations').getFullList({
        filter: `workspace_id="${workspaceId}" && status="active"`,
        expand: 'app_version_id',
        $autoCancel: false,
      });

      // Find first integration with matching adapter_type
      for (const integration of integrations) {
        if (integration.expand?.app_version_id?.adapter_type === adapterType) {
          return integration;
        }
      }

      return null;
    } catch (error) {
      if (error.message.includes('Failed to find')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Disable an integration
   * @param {string} workspaceId - Workspace ID (UUID)
   * @param {string} integrationId - Integration ID (UUID)
   * @param {string} userId - User ID performing action
   * @returns {Promise<Object>} - Updated integration
   */
  async disableIntegration(workspaceId, integrationId, userId) {
    if (!this.validateUUID(workspaceId)) {
      const err = new Error('Invalid workspace ID format');
      err.status = 400;
      throw err;
    }

    if (!this.validateUUID(integrationId)) {
      const err = new Error('Invalid integration ID format');
      err.status = 400;
      throw err;
    }

    if (!userId || typeof userId !== 'string') {
      const err = new Error('User ID must be a non-empty string');
      err.status = 400;
      throw err;
    }

    const integration = await pb.collection('workspace_integrations').getOne(integrationId, {
      $autoCancel: false,
    });

    if (integration.workspace_id !== workspaceId) {
      const err = new Error('Integration does not belong to this workspace');
      err.status = 403;
      throw err;
    }

    const updated = await pb.collection('workspace_integrations').update(
      integrationId,
      { status: 'disabled' },
      { $autoCancel: false }
    );

    // Log action
    await this.logInstallation(
      workspaceId,
      integration.app_id,
      integration.app_version_id,
      'disable',
      'success',
      userId,
      null
    );

    logger.info(`Integration disabled: workspace=${workspaceId}, integration=${integrationId}`);

    return {
      id: updated.id,
      workspace_id: updated.workspace_id,
      app_id: updated.app_id,
      app_version_id: updated.app_version_id,
      status: updated.status,
    };
  }

  /**
   * Enable an integration
   * @param {string} workspaceId - Workspace ID (UUID)
   * @param {string} integrationId - Integration ID (UUID)
   * @param {string} userId - User ID performing action
   * @returns {Promise<Object>} - Updated integration
   */
  async enableIntegration(workspaceId, integrationId, userId) {
    if (!this.validateUUID(workspaceId)) {
      const err = new Error('Invalid workspace ID format');
      err.status = 400;
      throw err;
    }

    if (!this.validateUUID(integrationId)) {
      const err = new Error('Invalid integration ID format');
      err.status = 400;
      throw err;
    }

    if (!userId || typeof userId !== 'string') {
      const err = new Error('User ID must be a non-empty string');
      err.status = 400;
      throw err;
    }

    const integration = await pb.collection('workspace_integrations').getOne(integrationId, {
      $autoCancel: false,
    });

    if (integration.workspace_id !== workspaceId) {
      const err = new Error('Integration does not belong to this workspace');
      err.status = 403;
      throw err;
    }

    const updated = await pb.collection('workspace_integrations').update(
      integrationId,
      { status: 'active' },
      { $autoCancel: false }
    );

    // Log action
    await this.logInstallation(
      workspaceId,
      integration.app_id,
      integration.app_version_id,
      'enable',
      'success',
      userId,
      null
    );

    logger.info(`Integration enabled: workspace=${workspaceId}, integration=${integrationId}`);

    return {
      id: updated.id,
      workspace_id: updated.workspace_id,
      app_id: updated.app_id,
      app_version_id: updated.app_version_id,
      status: updated.status,
    };
  }

  /**
   * Remove an integration
   * @param {string} workspaceId - Workspace ID (UUID)
   * @param {string} integrationId - Integration ID (UUID)
   * @param {string} userId - User ID performing action
   * @returns {Promise<Object>} - {success: true}
   */
  async removeIntegration(workspaceId, integrationId, userId) {
    if (!this.validateUUID(workspaceId)) {
      const err = new Error('Invalid workspace ID format');
      err.status = 400;
      throw err;
    }

    if (!this.validateUUID(integrationId)) {
      const err = new Error('Invalid integration ID format');
      err.status = 400;
      throw err;
    }

    if (!userId || typeof userId !== 'string') {
      const err = new Error('User ID must be a non-empty string');
      err.status = 400;
      throw err;
    }

    const integration = await pb.collection('workspace_integrations').getOne(integrationId, {
      $autoCancel: false,
    });

    if (integration.workspace_id !== workspaceId) {
      const err = new Error('Integration does not belong to this workspace');
      err.status = 403;
      throw err;
    }

    // Store app_id and app_version_id before deleting
    const appId = integration.app_id;
    const appVersionId = integration.app_version_id;

    // Delete OAuth connections
    const oauthConnections = await pb.collection('integration_oauth_connections').getFullList({
      filter: `workspace_integration_id="${integrationId}"`,
      $autoCancel: false,
    });

    for (const oc of oauthConnections) {
      await pb.collection('integration_oauth_connections').delete(oc.id, {
        $autoCancel: false,
      });
    }

    // Delete integration
    await pb.collection('workspace_integrations').delete(integrationId, {
      $autoCancel: false,
    });

    // Log action
    await this.logInstallation(
      workspaceId,
      appId,
      appVersionId,
      'uninstall',
      'success',
      userId,
      null
    );

    logger.info(`Integration removed: workspace=${workspaceId}, integration=${integrationId}`);

    return { success: true };
  }

  /**
   * Update integration configuration
   * @param {string} workspaceId - Workspace ID (UUID)
   * @param {string} integrationId - Integration ID (UUID)
   * @param {Object} config - New configuration
   * @returns {Promise<Object>} - Updated integration
   */
  async updateIntegrationConfig(workspaceId, integrationId, config) {
    if (!this.validateUUID(workspaceId)) {
      const err = new Error('Invalid workspace ID format');
      err.status = 400;
      throw err;
    }

    if (!this.validateUUID(integrationId)) {
      const err = new Error('Invalid integration ID format');
      err.status = 400;
      throw err;
    }

    if (!config || typeof config !== 'object') {
      const err = new Error('Config must be a non-empty object');
      err.status = 400;
      throw err;
    }

    const integration = await pb.collection('workspace_integrations').getOne(integrationId, {
      $autoCancel: false,
    });

    if (integration.workspace_id !== workspaceId) {
      const err = new Error('Integration does not belong to this workspace');
      err.status = 403;
      throw err;
    }

    const updated = await pb.collection('workspace_integrations').update(
      integrationId,
      { config: typeof config === 'string' ? config : JSON.stringify(config) },
      { $autoCancel: false }
    );

    logger.info(`Integration config updated: workspace=${workspaceId}, integration=${integrationId}`);

    return {
      id: updated.id,
      workspace_id: updated.workspace_id,
      app_id: updated.app_id,
      app_version_id: updated.app_version_id,
      config: updated.config,
      status: updated.status,
    };
  }

  /**
   * Get OAuth connection for integration
   * @param {string} integrationId - Integration ID (UUID)
   * @returns {Promise<Object|null>} - OAuth connection or null
   */
  async getOAuthConnection(integrationId) {
    if (!this.validateUUID(integrationId)) {
      const err = new Error('Invalid integration ID format');
      err.status = 400;
      throw err;
    }

    try {
      const connection = await pb.collection('integration_oauth_connections').getFirstListItem(
        `workspace_integration_id="${integrationId}"`,
        { $autoCancel: false }
      );

      return {
        id: connection.id,
        provider: connection.provider,
        access_token_encrypted: connection.access_token_encrypted,
        refresh_token_encrypted: connection.refresh_token_encrypted,
        scopes: connection.scopes,
        expires_at: connection.expires_at,
        created_at: connection.created,
      };
    } catch (error) {
      if (error.message.includes('Failed to find')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create OAuth connection with encrypted tokens
   * @param {string} integrationId - Integration ID (UUID)
   * @param {string} provider - OAuth provider name
   * @param {string} accessToken - Access token
   * @param {string|null} refreshToken - Refresh token
   * @param {string|null} expiresAt - Token expiration timestamp
   * @param {string} scopes - Scopes string
   * @returns {Promise<Object>} - Created connection
   */
  async createOAuthConnection(integrationId, provider, accessToken, refreshToken, expiresAt, scopes) {
    if (!this.validateUUID(integrationId)) {
      const err = new Error('Invalid integration ID format');
      err.status = 400;
      throw err;
    }

    if (!provider || typeof provider !== 'string') {
      const err = new Error('Provider must be a non-empty string');
      err.status = 400;
      throw err;
    }

    if (!accessToken || typeof accessToken !== 'string') {
      const err = new Error('Access token must be a non-empty string');
      err.status = 400;
      throw err;
    }

    // Encrypt tokens if encryption service is available
    let encryptedAccessToken = null;
    let encryptedRefreshToken = null;

    if (tokenEncryptionService) {
      try {
        const accessTokenEncrypted = tokenEncryptionService.encryptToken(accessToken);
        encryptedAccessToken = JSON.stringify(accessTokenEncrypted);

        if (refreshToken) {
          const refreshTokenEncrypted = tokenEncryptionService.encryptToken(refreshToken);
          encryptedRefreshToken = JSON.stringify(refreshTokenEncrypted);
        }
      } catch (error) {
        logger.warn(`Failed to encrypt OAuth tokens: ${error.message}`);
        // Store unencrypted as fallback
        encryptedAccessToken = accessToken;
        encryptedRefreshToken = refreshToken || null;
      }
    } else {
      // Store unencrypted if encryption service not available
      encryptedAccessToken = accessToken;
      encryptedRefreshToken = refreshToken || null;
    }

    const connection = await pb.collection('integration_oauth_connections').create(
      {
        workspace_integration_id: integrationId,
        provider,
        access_token_encrypted: encryptedAccessToken,
        refresh_token_encrypted: encryptedRefreshToken,
        expires_at: expiresAt || null,
        scopes: scopes || '',
      },
      { $autoCancel: false }
    );

    logger.info(`OAuth connection created: integration=${integrationId}, provider=${provider}`);

    return {
      id: connection.id,
      provider: connection.provider,
      scopes: connection.scopes,
      expires_at: connection.expires_at,
      created_at: connection.created,
    };
  }

  /**
   * Log integration installation
   * @param {string} workspaceId - Workspace ID (UUID)
   * @param {string} appId - App ID (UUID)
   * @param {string} versionId - Version ID (UUID)
   * @param {string} action - Action type (install, uninstall, update, enable, disable)
   * @param {string} status - Status (success, failed)
   * @param {string} installedBy - User ID
   * @param {string|null} errorMessage - Error message if failed
   * @returns {Promise<Object>} - Created log record
   */
  async logInstallation(workspaceId, appId, versionId, action, status, installedBy, errorMessage) {
    if (!this.validateUUID(workspaceId)) {
      const err = new Error('Invalid workspace ID format');
      err.status = 400;
      throw err;
    }

    if (!this.validateUUID(appId)) {
      const err = new Error('Invalid app ID format');
      err.status = 400;
      throw err;
    }

    if (!this.validateUUID(versionId)) {
      const err = new Error('Invalid version ID format');
      err.status = 400;
      throw err;
    }

    const logRecord = await pb.collection('integration_install_logs').create({
      workspace_id: workspaceId,
      app_id: appId,
      app_version_id: versionId,
      action,
      status,
      installed_by: installedBy,
      error_message: errorMessage || null,
    }, { $autoCancel: false });

    return logRecord;
  }

  /**
   * Log integration execution
   * @param {string} workspaceId - Workspace ID (UUID)
   * @param {string} integrationId - Integration ID (UUID)
   * @param {string} adapterType - Adapter type
   * @param {string} status - Execution status (success, failed, retry, skipped)
   * @param {number} executionTime - Execution time in milliseconds
   * @param {string|null} errorMessage - Error message if failed
   * @param {Object|null} requestPayload - Request payload
   * @param {Object|null} responsePayload - Response payload
   * @param {number} retryAttempt - Retry attempt number (optional)
   * @returns {Promise<Object>} - Created log record
   */
  async logExecution(
    workspaceId,
    integrationId,
    adapterType,
    status,
    executionTime,
    errorMessage,
    requestPayload,
    responsePayload,
    retryAttempt
  ) {
    if (!this.validateUUID(workspaceId)) {
      const err = new Error('Invalid workspace ID format');
      err.status = 400;
      throw err;
    }

    if (!this.validateUUID(integrationId)) {
      const err = new Error('Invalid integration ID format');
      err.status = 400;
      throw err;
    }

    const details = {
      request_payload: requestPayload,
      response_payload: responsePayload,
    };

    if (retryAttempt !== undefined && retryAttempt !== null && typeof retryAttempt === 'number') {
      details.retry_attempt = retryAttempt;
    }

    const logRecord = await pb.collection('integration_execution_logs').create({
      workspace_id: workspaceId,
      workspace_integration_id: integrationId,
      adapter_type: adapterType,
      status,
      execution_time_ms: executionTime,
      error_message: errorMessage || null,
      details: JSON.stringify(details),
      created_at: new Date().toISOString(),
    }, { $autoCancel: false });

    logger.info(
      `Integration execution logged: workspace=${workspaceId}, integration=${integrationId}, status=${status}, attempt=${retryAttempt || 1}`
    );

    return logRecord;
  }

  /**
   * Log idempotency event
   * @param {string} workspaceId - Workspace ID (UUID)
   * @param {string} integrationId - Integration ID (UUID)
   * @param {string} eventType - Event type (e.g., 'idempotency_stale_processing_detected')
   * @param {Object} details - Event details (workspace_integration_id, idempotency_key, original_created_at, etc.)
   * @returns {Promise<Object>} - Created log record
   */
  async logIdempotencyEvent(workspaceId, integrationId, eventType, details) {
    if (!this.validateUUID(workspaceId)) {
      const err = new Error('Invalid workspace ID format');
      err.status = 400;
      throw err;
    }

    if (!this.validateUUID(integrationId)) {
      const err = new Error('Invalid integration ID format');
      err.status = 400;
      throw err;
    }

    if (!eventType || typeof eventType !== 'string') {
      const err = new Error('Event type must be a non-empty string');
      err.status = 400;
      throw err;
    }

    if (!details || typeof details !== 'object') {
      const err = new Error('Details must be a non-empty object');
      err.status = 400;
      throw err;
    }

    const logRecord = await pb.collection('integration_logs').create({
      workspace_id: workspaceId,
      workspace_integration_id: integrationId,
      adapter_name: 'idempotency',
      event_type: eventType,
      status: 'success',
      response_code: 200,
      error_message: null,
      response_time_ms: 0,
      created_at: new Date().toISOString(),
    }, { $autoCancel: false });

    logger.info(
      `Idempotency event logged: ${eventType} for integration ${integrationId}, details: ${JSON.stringify(details)}`
    );

    return logRecord;
  }

  /**
   * Log worker runtime event
   * @param {string} eventType - Event type
   * @param {Object} details - Event details
   * @returns {Promise<Object>} - Created log record
   */
  async logWorkerEvent(eventType, details) {
    try {
      const logRecord = await pb.collection('integration_logs').create({
        workspace_id: null,
        workspace_integration_id: null,
        adapter_name: 'worker_runtime',
        event_type: eventType,
        status: 'success',
        response_code: 200,
        error_message: typeof details === 'string' ? details : JSON.stringify(details),
        created_at: new Date().toISOString(),
      }, { $autoCancel: false });

      return logRecord;
    } catch (error) {
      logger.error(`Failed to log worker event ${eventType}:`, error.message);
      return null;
    }
  }
}

// Export singleton instance
export const marketplaceService = new MarketplaceService();

export default marketplaceService;
