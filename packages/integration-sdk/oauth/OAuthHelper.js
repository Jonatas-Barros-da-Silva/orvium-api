
/**
 * OAuth Helper
 * Manages OAuth token retrieval, refresh, and validation
 */
export class OAuthHelper {
  /**
   * Constructor
   * @param {Object} options - Configuration options
   * @param {string} options.workspaceId - Workspace ID
   * @param {string} options.integrationId - Integration ID
   * @param {Object} options.pocketbaseClient - PocketBase client instance
   */
  constructor(options = {}) {
    if (!options || typeof options !== 'object') {
      throw new Error('Options must be a non-empty object');
    }

    const { workspaceId, integrationId, pocketbaseClient } = options;

    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new Error('workspaceId is required and must be a string');
    }

    if (!integrationId || typeof integrationId !== 'string') {
      throw new Error('integrationId is required and must be a string');
    }

    if (!pocketbaseClient || typeof pocketbaseClient !== 'object') {
      throw new Error('pocketbaseClient is required and must be an object');
    }

    this.workspaceId = workspaceId;
    this.integrationId = integrationId;
    this.pb = pocketbaseClient;
  }

  /**
   * Get OAuth connection record
   * @returns {Promise<Object>} - OAuth connection record
   * @throws {Error} - If connection not found
   */
  async getOAuthConnection() {
    try {
      const connection = await this.pb
        .collection('integration_oauth_connections')
        .getFirstListItem(`workspace_integration_id="${this.integrationId}"`, {
          $autoCancel: false,
        });

      if (!connection) {
        throw new Error('OAuth connection not found');
      }

      return connection;
    } catch (error) {
      if (error.message.includes('Failed to find')) {
        throw new Error('OAuth connection not found for this integration');
      }
      throw error;
    }
  }

  /**
   * Check if token is expired
   * @returns {Promise<boolean>} - True if token is expired
   */
  async isTokenExpired() {
    try {
      const connection = await this.getOAuthConnection();

      if (!connection.expires_at) {
        return false; // No expiration set
      }

      const expiresAt = new Date(connection.expires_at).getTime();
      const now = Date.now();

      // Consider token expired if less than 5 minutes remaining
      const bufferMs = 5 * 60 * 1000;
      return now + bufferMs > expiresAt;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get access token (refresh if expired)
   * @returns {Promise<string>} - Access token
   * @throws {Error} - If token cannot be retrieved
   */
  async getAccessToken() {
    try {
      const connection = await this.getOAuthConnection();

      // Check if token is expired
      const isExpired = await this.isTokenExpired();

      if (isExpired && connection.refresh_token_encrypted) {
        // Refresh token if expired and refresh token available
        await this.refreshToken();
        // Get updated connection
        const updatedConnection = await this.getOAuthConnection();
        return updatedConnection.access_token_encrypted;
      }

      return connection.access_token_encrypted;
    } catch (error) {
      throw new Error(`Failed to get access token: ${error.message}`);
    }
  }

  /**
   * Refresh OAuth token
   * Updates the database with new token and expiration
   * @returns {Promise<Object>} - Updated connection record
   * @throws {Error} - If refresh fails
   */
  async refreshToken() {
    try {
      const connection = await this.getOAuthConnection();

      if (!connection.refresh_token_encrypted) {
        throw new Error('No refresh token available');
      }

      // Note: Actual token refresh logic would depend on OAuth provider
      // This is a placeholder that updates the connection record
      // In a real implementation, you would:
      // 1. Call the OAuth provider's token endpoint
      // 2. Get new access token and expiration
      // 3. Update the database

      // For now, just update the last_refreshed_at timestamp
      const updated = await this.pb
        .collection('integration_oauth_connections')
        .update(connection.id, {
          last_refreshed_at: new Date().toISOString(),
        });

      return updated;
    } catch (error) {
      throw new Error(`Failed to refresh token: ${error.message}`);
    }
  }
}
