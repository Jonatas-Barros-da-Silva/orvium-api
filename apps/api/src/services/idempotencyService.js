import 'dotenv/config';
import crypto from 'crypto';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const PROCESSING_TIMEOUT = 30000; // 30 seconds in milliseconds

/**
 * Idempotency Service
 * Manages idempotency keys and duplicate execution prevention
 */
export class IdempotencyService {
  /**
   * Generate an idempotency key from workspace integration, trigger event, and adapter type
   * Concatenates inputs and hashes with SHA256
   * @param {string} workspaceIntegrationId - Workspace integration ID (UUID)
   * @param {string} triggerEventId - Trigger event ID
   * @param {string} adapterType - Adapter type name
   * @returns {string} - 64-character hex SHA256 hash
   */
  generateIdempotencyKey(workspaceIntegrationId, triggerEventId, adapterType) {
    if (!workspaceIntegrationId || typeof workspaceIntegrationId !== 'string') {
      throw new Error('Workspace integration ID must be a non-empty string');
    }

    if (!triggerEventId || typeof triggerEventId !== 'string') {
      throw new Error('Trigger event ID must be a non-empty string');
    }

    if (!adapterType || typeof adapterType !== 'string') {
      throw new Error('Adapter type must be a non-empty string');
    }

    try {
      const concatenated = `${workspaceIntegrationId}${triggerEventId}${adapterType}`;
      const hash = crypto
        .createHash('sha256')
        .update(concatenated)
        .digest('hex');

      return hash;
    } catch (error) {
      logger.error('Error generating idempotency key:', error.message);
      throw error;
    }
  }

  /**
   * Check if an idempotency key already exists
   * Handles stale processing detection (processing status older than PROCESSING_TIMEOUT)
   * @param {string} idempotencyKey - Idempotency key (64-char hex hash)
   * @param {string} workspaceIntegrationId - Workspace integration ID (UUID)
   * @returns {Promise<Object>} - {exists: boolean, record: idempotencyRecord|null, stale: boolean, isStaleProcessing: boolean|null, retryAttempt: number|null}
   */
  async checkIdempotency(idempotencyKey, workspaceIntegrationId) {
    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      throw new Error('Idempotency key must be a non-empty string');
    }

    if (!workspaceIntegrationId || typeof workspaceIntegrationId !== 'string') {
      throw new Error('Workspace integration ID must be a non-empty string');
    }

    try {
      const record = await pb.collection('integration_idempotency').getFirstListItem(
        `idempotency_key="${idempotencyKey}"`,
        { $autoCancel: false }
      );

      if (!record) {
        return {
          exists: false,
          record: null,
          stale: false,
          isStaleProcessing: null,
          retryAttempt: null,
        };
      }

      // If status is completed, failed, or skipped - not stale
      if (['completed', 'failed', 'skipped'].includes(record.status)) {
        return {
          exists: true,
          record,
          stale: false,
          isStaleProcessing: null,
          retryAttempt: record.retry_attempt || 1,
        };
      }

      // If status is processing - check if stale
      if (record.status === 'processing') {
        const createdAt = new Date(record.created).getTime();
        const now = Date.now();
        const age = now - createdAt;

        if (age > PROCESSING_TIMEOUT) {
          // Stale processing detected
          return {
            exists: true,
            record,
            stale: true,
            isStaleProcessing: true,
            retryAttempt: record.retry_attempt || 1,
          };
        } else {
          // Still within processing timeout
          return {
            exists: true,
            record,
            stale: false,
            isStaleProcessing: null,
            retryAttempt: record.retry_attempt || 1,
          };
        }
      }

      // Default case
      return {
        exists: true,
        record,
        stale: false,
        isStaleProcessing: null,
        retryAttempt: record.retry_attempt || 1,
      };
    } catch (error) {
      if (error.status === 404 || error.message.includes('Failed to find')) {
        return {
          exists: false,
          record: null,
          stale: false,
          isStaleProcessing: null,
          retryAttempt: null,
        };
      }
      logger.error('Error checking idempotency:', error.message);
      throw error;
    }
  }

  /**
   * Create a new idempotency record
   * @param {string} workspaceIntegrationId - Workspace integration ID (UUID)
   * @param {string} idempotencyKey - Idempotency key (64-char hex hash)
   * @param {string} executionId - Execution context ID
   * @param {number} retryAttempt - Retry attempt number (optional, default: 1)
   * @returns {Promise<Object>} - Created idempotency record with retry_attempt included
   */
  async createIdempotencyRecord(workspaceIntegrationId, idempotencyKey, executionId, retryAttempt = 1) {
    if (!workspaceIntegrationId || typeof workspaceIntegrationId !== 'string') {
      throw new Error('Workspace integration ID must be a non-empty string');
    }

    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      throw new Error('Idempotency key must be a non-empty string');
    }

    if (!executionId || typeof executionId !== 'string') {
      throw new Error('Execution ID must be a non-empty string');
    }

    if (typeof retryAttempt !== 'number' || retryAttempt < 1) {
      throw new Error('Retry attempt must be a positive number');
    }

    try {
      const record = await pb.collection('integration_idempotency').create(
        {
          workspace_integration_id: workspaceIntegrationId,
          idempotency_key: idempotencyKey,
          execution_id: executionId,
          status: 'processing',
          retry_attempt: retryAttempt,
        },
        { $autoCancel: false }
      );

      logger.debug(`Idempotency record created: ${idempotencyKey} (attempt ${retryAttempt})`);
      return { ...record, retry_attempt: record.retry_attempt };
    } catch (error) {
      logger.error('Error creating idempotency record:', error.message);
      throw error;
    }
  }

  /**
   * Update idempotency record status
   * @param {string} idempotencyKey - Idempotency key (64-char hex hash)
   * @param {string} status - New status ('processing', 'completed', 'failed', 'skipped')
   * @returns {Promise<Object>} - Updated idempotency record
   */
  async updateIdempotencyStatus(idempotencyKey, status) {
    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      throw new Error('Idempotency key must be a non-empty string');
    }

    if (!status || typeof status !== 'string') {
      throw new Error('Status must be a non-empty string');
    }

    const validStatuses = ['processing', 'completed', 'failed', 'skipped'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
    }

    try {
      const record = await pb.collection('integration_idempotency').getFirstListItem(
        `idempotency_key="${idempotencyKey}"`,
        { $autoCancel: false }
      );

      if (!record) {
        throw new Error('Idempotency record not found');
      }

      const updated = await pb.collection('integration_idempotency').update(
        record.id,
        { status, updated_at: new Date().toISOString() },
        { $autoCancel: false }
      );

      logger.debug(`Idempotency status updated: ${idempotencyKey} -> ${status}`);
      return updated;
    } catch (error) {
      logger.error('Error updating idempotency status:', error.message);
      throw error;
    }
  }

  /**
   * Mark an idempotency key as failed
   * Updates status to 'failed' and sets updated_at timestamp
   * @param {string} idempotencyKey - Idempotency key (64-char hex hash)
   * @returns {Promise<Object|null>} - Updated idempotency record or null if not found
   */
  async markIdempotencyAsFailed(idempotencyKey) {
    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      throw new Error('Idempotency key must be a non-empty string');
    }

    try {
      const record = await pb.collection('integration_idempotency').getFirstListItem(
        `idempotency_key="${idempotencyKey}"`,
        { $autoCancel: false }
      );

      if (!record) {
        logger.debug(`Idempotency record not found for key: ${idempotencyKey}`);
        return null;
      }

      const updated = await pb.collection('integration_idempotency').update(
        record.id,
        {
          status: 'failed',
          updated_at: new Date().toISOString(),
        },
        { $autoCancel: false }
      );

      logger.debug(`Idempotency marked as failed: ${idempotencyKey}`);
      return updated;
    } catch (error) {
      logger.error('Error marking idempotency as failed:', error.message);
      throw error;
    }
  }

  /**
   * Get idempotency record by key
   * @param {string} idempotencyKey - Idempotency key (64-char hex hash)
   * @returns {Promise<Object|null>} - Idempotency record or null if not found
   */
  async getIdempotencyRecord(idempotencyKey) {
    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      throw new Error('Idempotency key must be a non-empty string');
    }

    try {
      const record = await pb.collection('integration_idempotency').getFirstListItem(
        `idempotency_key="${idempotencyKey}"`,
        { $autoCancel: false }
      );

      return record || null;
    } catch (error) {
      if (error.status === 404 || error.message.includes('Failed to find')) {
        return null;
      }
      logger.error('Error getting idempotency record:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
export const idempotencyService = new IdempotencyService();

export default idempotencyService;
