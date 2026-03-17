
import apiServerClient from '@/lib/apiServerClient';

/**
 * Centralized API client for all backend communication.
 * This replaces any direct imports from backend packages.
 */
export const ApiClient = {
  /**
   * Validates an integration manifest file
   * @param {string} fileContent - The content of the manifest file
   * @returns {Promise<{success: boolean, data: any, error: string}>}
   */
  async validateManifest(fileContent) {
    try {
      const response = await apiServerClient.fetch('/manifest/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: fileContent })
      });
      const data = await response.json();
      return { success: data.success, data: data, error: data.error };
    } catch (error) {
      return { success: false, data: null, error: error.message || 'Validation request failed' };
    }
  },

  /**
   * Registers a new integration from a manifest
   * @param {string} fileContent - The content of the manifest file
   * @param {string} developerId - The ID of the developer registering the integration
   * @returns {Promise<{success: boolean, data: any, error: string}>}
   */
  async registerIntegration(fileContent, developerId) {
    try {
      const response = await apiServerClient.fetch('/manifest/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: fileContent,
          developer_id: developerId
        })
      });
      const data = await response.json();
      return { success: data.success, data: data, error: data.error };
    } catch (error) {
      return { success: false, data: null, error: error.message || 'Registration request failed' };
    }
  },

  /**
   * Fetches documentation for a specific integration
   * @param {string} integrationId - The ID of the integration
   * @returns {Promise<{success: boolean, data: any, error: string}>}
   */
  async getIntegrationDocs(integrationId) {
    try {
      const response = await apiServerClient.fetch(`/integrations/${integrationId}/docs`);
      const data = await response.json();
      return { success: response.ok, data: data, error: data.error };
    } catch (error) {
      return { success: false, data: null, error: error.message || 'Failed to fetch documentation' };
    }
  },

  /**
   * Executes an integration action
   * @param {Object} executionRequest - The execution payload
   * @returns {Promise<{success: boolean, data: any, error: string}>}
   */
  async executeIntegration(executionRequest) {
    try {
      const response = await apiServerClient.fetch('/executions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(executionRequest)
      });
      const data = await response.json();
      return { success: response.ok, data: data, error: data.error };
    } catch (error) {
      return { success: false, data: null, error: error.message || 'Execution request failed' };
    }
  }
};
