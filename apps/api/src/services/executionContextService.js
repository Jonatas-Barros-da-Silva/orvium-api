import 'dotenv/config';
import crypto from 'crypto';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

/**
 * Execution Context Service
 * Manages integration execution tracking and context
 */
export class ExecutionContextService {
  /**
   * Generate a unique execution ID
   * Format: {workspaceId}-{integrationId}-{timestamp}-{random}
   * @param {string} workspaceId - Workspace ID (UUID)
   * @param {string} integrationId - Integration ID (UUID)
   * @returns {string} - Execution ID
   */
  generateExecutionId(workspaceId, integrationId) {
    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new Error('Workspace ID must be a non-empty string');
    }

    if (!integrationId || typeof integrationId !== 'string') {
      throw new Error('Integration ID must be a non-empty string');
    }

    const timestamp = Date.now();
    const random = crypto.randomBytes(6).toString('hex');

    return `${workspaceId}-${integrationId}-${timestamp}-${random}`;
  }

  /**
   * Create a new execution context
   * @param {string} workspaceId - Workspace ID (UUID)
   * @param {string} integrationId - Integration ID (UUID)
   * @param {string} adapterType - Adapter type (e.g., 'analytics')
   * @param {string} triggerEvent - Event that triggered execution
   * @param {number} retryAttempt - Retry attempt number (optional, default: 1)
   * @returns {Promise<Object>} - Created execution context record with execution_id and retry_attempt
   */
  async createExecutionContext(workspaceId, integrationId, adapterType, triggerEvent, retryAttempt = 1) {
    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new Error('Workspace ID must be a non-empty string');
    }

    if (!integrationId || typeof integrationId !== 'string') {
      throw new Error('Integration ID must be a non-empty string');
    }

    if (!adapterType || typeof adapterType !== 'string') {
      throw new Error('Adapter type must be a non-empty string');
    }

    if (!triggerEvent || typeof triggerEvent !== 'string') {
      throw new Error('Trigger event must be a non-empty string');
    }

    if (typeof retryAttempt !== 'number' || retryAttempt < 1) {
      throw new Error('Retry attempt must be a positive number');
    }

    try {
      const executionId = this.generateExecutionId(workspaceId, integrationId);

      const context = await pb.collection('integration_execution_context').create(
        {
          execution_id: executionId,
          workspace_id: workspaceId,
          workspace_integration_id: integrationId,
          adapter_type: adapterType,
          trigger_event: triggerEvent,
          status: 'pending',
          started_at: new Date().toISOString(),
          retry_attempt: retryAttempt,
        },
        { $autoCancel: false }
      );

      logger.debug(`Execution context created: ${executionId} (attempt ${retryAttempt})`);
      return { ...context, execution_id: context.execution_id, retry_attempt: context.retry_attempt };
    } catch (error) {
      logger.error(`Error creating execution context: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get execution context by ID
   * @param {string} executionId - Execution ID
   * @returns {Promise<Object|null>} - Execution context record or null
   */
  async getExecutionContext(executionId) {
    if (!executionId || typeof executionId !== 'string') {
      throw new Error('Execution ID must be a non-empty string');
    }

    try {
      const context = await pb.collection('integration_execution_context').getFirstListItem(
        `execution_id="${executionId}"`,
        { $autoCancel: false }
      );
      return context || null;
    } catch (error) {
      if (error.status === 404 || error.message.includes('Failed to find')) {
        return null;
      }
      logger.error(`Error getting execution context: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update execution context with results
   * Accepts optional fields: status, error_message, execution_time_ms, response_payload,
   * idempotency_key, required_permissions, granted_permissions, missing_permissions, retry_attempt
   * @param {string} executionId - Execution ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} - Updated execution context record
   */
  async updateExecutionContext(executionId, updates) {
    if (!executionId || typeof executionId !== 'string') {
      throw new Error('Execution ID must be a non-empty string');
    }

    if (!updates || typeof updates !== 'object') {
      throw new Error('Updates must be a non-empty object');
    }

    try {
      const context = await this.getExecutionContext(executionId);

      if (!context) {
        throw new Error('Execution context not found');
      }

      const updateData = {};

      // Only include provided fields
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.error_message !== undefined) updateData.error_message = updates.error_message;
      if (updates.execution_time_ms !== undefined) updateData.execution_time_ms = updates.execution_time_ms;
      if (updates.response_payload !== undefined) updateData.response_payload = updates.response_payload;
      if (updates.idempotency_key !== undefined) updateData.idempotency_key = updates.idempotency_key;
      if (updates.required_permissions !== undefined) updateData.required_permissions = updates.required_permissions;
      if (updates.granted_permissions !== undefined) updateData.granted_permissions = updates.granted_permissions;
      if (updates.missing_permissions !== undefined) updateData.missing_permissions = updates.missing_permissions;
      if (updates.retry_attempt !== undefined) updateData.retry_attempt = updates.retry_attempt;

      // Set completed_at if status is one of the terminal states
      const terminalStatuses = ['completed', 'failed', 'permission_denied', 'circuit_breaker_open', 'rate_limited', 'skipped'];
      if (updates.status && terminalStatuses.includes(updates.status)) {
        updateData.completed_at = new Date().toISOString();
      }

      const updated = await pb.collection('integration_execution_context').update(
        context.id,
        updateData,
        { $autoCancel: false }
      );

      logger.debug(`Execution context updated: ${executionId}`);
      return updated;
    } catch (error) {
      logger.error(`Error updating execution context: ${error.message}`);
      throw error;
    }
  }
}

// Export singleton instance
export const executionContextService = new ExecutionContextService();

export default executionContextService;
