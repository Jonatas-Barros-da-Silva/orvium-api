import 'dotenv/config';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const FAILURE_THRESHOLD = 5;
const COOLDOWN_PERIOD = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * Circuit Breaker Service
 * Manages integration health and failure tracking
 */
export class CircuitBreakerService {
  /**
   * Get health record for an integration
   * @param {string} integrationId - Integration ID (UUID)
   * @returns {Promise<Object|null>} - Health record or null if not found
   */
  async getHealth(integrationId) {
    if (!integrationId || typeof integrationId !== 'string') {
      throw new Error('Integration ID must be a non-empty string');
    }

    try {
      const health = await pb.collection('integration_health').getFirstListItem(
        `workspace_integration_id="${integrationId}"`,
        { $autoCancel: false }
      );
      return health || null;
    } catch (error) {
      if (error.message.includes('Failed to find')) {
        return null;
      }
      logger.error(`Error getting health record: ${error.message}`);
      throw error;
    }
  }

  /**
   * Record successful execution
   * Resets consecutive failures and sets status to healthy
   * @param {string} integrationId - Integration ID (UUID)
   * @returns {Promise<Object>} - Updated health record
   */
  async recordSuccess(integrationId) {
    if (!integrationId || typeof integrationId !== 'string') {
      throw new Error('Integration ID must be a non-empty string');
    }

    try {
      const health = await this.getHealth(integrationId);

      if (!health) {
        // Create new health record if doesn't exist
        const newHealth = await pb.collection('integration_health').create({
          workspace_integration_id: integrationId,
          status: 'healthy',
          consecutive_failures: 0,
          last_success_at: new Date().toISOString(),
          disabled_at: null,
          disabled_reason: null,
        }, { $autoCancel: false });
        return newHealth;
      }

      // Update existing health record
      const updated = await pb.collection('integration_health').update(
        health.id,
        {
          status: 'healthy',
          consecutive_failures: 0,
          last_success_at: new Date().toISOString(),
          disabled_at: null,
          disabled_reason: null,
        },
        { $autoCancel: false }
      );

      logger.debug(`Circuit breaker reset for integration ${integrationId}`);
      return updated;
    } catch (error) {
      logger.error(`Error recording success: ${error.message}`);
      throw error;
    }
  }

  /**
   * Record failed execution
   * Increments consecutive failures and disables after threshold
   * @param {string} integrationId - Integration ID (UUID)
   * @param {string} errorMessage - Error message
   * @returns {Promise<Object>} - Updated health record with {disabled: true/false}
   */
  async recordFailure(integrationId, errorMessage) {
    if (!integrationId || typeof integrationId !== 'string') {
      throw new Error('Integration ID must be a non-empty string');
    }

    if (!errorMessage || typeof errorMessage !== 'string') {
      throw new Error('Error message must be a non-empty string');
    }

    try {
      const health = await this.getHealth(integrationId);
      const newFailureCount = (health?.consecutive_failures || 0) + 1;
      const isDisabled = newFailureCount >= FAILURE_THRESHOLD;

      const updateData = {
        consecutive_failures: newFailureCount,
        last_failure_at: new Date().toISOString(),
        last_error_message: errorMessage,
      };

      if (isDisabled) {
        updateData.status = 'disabled';
        updateData.disabled_at = new Date().toISOString();
        updateData.disabled_reason = `Exceeded failure threshold (${FAILURE_THRESHOLD} failures)`;
        logger.warn(`Integration ${integrationId} disabled after ${newFailureCount} failures`);
      } else {
        updateData.status = 'degraded';
      }

      if (!health) {
        // Create new health record if doesn't exist
        const newHealth = await pb.collection('integration_health').create({
          workspace_integration_id: integrationId,
          ...updateData,
        }, { $autoCancel: false });
        return { ...newHealth, disabled: isDisabled };
      }

      // Update existing health record
      const updated = await pb.collection('integration_health').update(
        health.id,
        updateData,
        { $autoCancel: false }
      );

      return { ...updated, disabled: isDisabled };
    } catch (error) {
      logger.error(`Error recording failure: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if integration can execute
   * Verifies status and cooldown period
   * @param {string} integrationId - Integration ID (UUID)
   * @returns {Promise<Object>} - {allowed: boolean, reason: string|null}
   */
  async canExecute(integrationId) {
    if (!integrationId || typeof integrationId !== 'string') {
      throw new Error('Integration ID must be a non-empty string');
    }

    try {
      const health = await this.getHealth(integrationId);

      // If no health record, allow execution
      if (!health) {
        return { allowed: true, reason: null };
      }

      // If healthy, allow execution
      if (health.status === 'healthy') {
        return { allowed: true, reason: null };
      }

      // If disabled, check cooldown period
      if (health.status === 'disabled') {
        if (!health.disabled_at) {
          return { allowed: false, reason: 'Integration is disabled' };
        }

        const disabledTime = new Date(health.disabled_at).getTime();
        const now = Date.now();
        const timeSinceDisabled = now - disabledTime;

        if (timeSinceDisabled < COOLDOWN_PERIOD) {
          const secondsRemaining = Math.ceil((COOLDOWN_PERIOD - timeSinceDisabled) / 1000);
          return {
            allowed: false,
            reason: `Integration is in cooldown. Retry in ${secondsRemaining} seconds`,
          };
        }

        // Cooldown period has passed, allow retry
        return { allowed: true, reason: null };
      }

      // If degraded, allow execution but log warning
      if (health.status === 'degraded') {
        logger.warn(`Integration ${integrationId} is degraded (${health.consecutive_failures} failures)`);
        return { allowed: true, reason: null };
      }

      return { allowed: true, reason: null };
    } catch (error) {
      logger.error(`Error checking circuit breaker: ${error.message}`);
      // On error, allow execution to avoid blocking
      return { allowed: true, reason: null };
    }
  }

  /**
   * Reset circuit breaker for an integration
   * @param {string} integrationId - Integration ID (UUID)
   * @returns {Promise<Object>} - Updated health record
   */
  async reset(integrationId) {
    if (!integrationId || typeof integrationId !== 'string') {
      throw new Error('Integration ID must be a non-empty string');
    }

    try {
      const health = await this.getHealth(integrationId);

      if (!health) {
        // Create new health record
        const newHealth = await pb.collection('integration_health').create({
          workspace_integration_id: integrationId,
          status: 'healthy',
          consecutive_failures: 0,
          disabled_at: null,
          disabled_reason: null,
        }, { $autoCancel: false });
        return newHealth;
      }

      // Reset health record
      const updated = await pb.collection('integration_health').update(
        health.id,
        {
          status: 'healthy',
          consecutive_failures: 0,
          disabled_at: null,
          disabled_reason: null,
        },
        { $autoCancel: false }
      );

      logger.info(`Circuit breaker reset for integration ${integrationId}`);
      return updated;
    } catch (error) {
      logger.error(`Error resetting circuit breaker: ${error.message}`);
      throw error;
    }
  }
}

// Export singleton instance
export const circuitBreakerService = new CircuitBreakerService();

export default circuitBreakerService;
