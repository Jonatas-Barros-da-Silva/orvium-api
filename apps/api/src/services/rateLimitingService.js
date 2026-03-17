import 'dotenv/config';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

/**
 * Rate Limiting Service
 * Manages integration rate limits and execution tracking
 */
export class RateLimitingService {
  /**
   * Get rate limits for an integration
   * Creates default limits if they don't exist
   * @param {string} integrationId - Integration ID (UUID)
   * @returns {Promise<Object>} - Rate limit record with max_requests_per_minute, max_requests_per_hour, max_requests_per_day
   */
  async getRateLimits(integrationId) {
    if (!integrationId || typeof integrationId !== 'string') {
      throw new Error('Integration ID must be a non-empty string');
    }

    try {
      const limits = await pb.collection('integration_rate_limits').getFirstListItem(
        `workspace_integration_id="${integrationId}"`,
        { $autoCancel: false }
      );
      return limits || null;
    } catch (error) {
      if (error.message.includes('Failed to find')) {
        // Create default limits
        return await this.setRateLimits(integrationId, {
          max_requests_per_minute: 60,
          max_requests_per_hour: 1000,
          max_requests_per_day: 10000,
        });
      }
      logger.error(`Error getting rate limits: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set or update rate limits for an integration
   * @param {string} integrationId - Integration ID (UUID)
   * @param {Object} limits - {max_requests_per_minute, max_requests_per_hour, max_requests_per_day}
   * @returns {Promise<Object>} - Created or updated rate limit record
   */
  async setRateLimits(integrationId, limits) {
    if (!integrationId || typeof integrationId !== 'string') {
      throw new Error('Integration ID must be a non-empty string');
    }

    if (!limits || typeof limits !== 'object') {
      throw new Error('Limits must be a non-empty object');
    }

    const { max_requests_per_minute, max_requests_per_hour, max_requests_per_day } = limits;

    if (typeof max_requests_per_minute !== 'number' || max_requests_per_minute < 1) {
      throw new Error('max_requests_per_minute must be a positive number');
    }

    if (typeof max_requests_per_hour !== 'number' || max_requests_per_hour < 1) {
      throw new Error('max_requests_per_hour must be a positive number');
    }

    if (typeof max_requests_per_day !== 'number' || max_requests_per_day < 1) {
      throw new Error('max_requests_per_day must be a positive number');
    }

    try {
      const existing = await pb.collection('integration_rate_limits').getFirstListItem(
        `workspace_integration_id="${integrationId}"`,
        { $autoCancel: false }
      );

      if (existing) {
        // Update existing
        const updated = await pb.collection('integration_rate_limits').update(
          existing.id,
          {
            max_requests_per_minute,
            max_requests_per_hour,
            max_requests_per_day,
          },
          { $autoCancel: false }
        );
        logger.info(`Rate limits updated for integration ${integrationId}`);
        return updated;
      }
    } catch (error) {
      if (!error.message.includes('Failed to find')) {
        logger.error(`Error checking existing limits: ${error.message}`);
        throw error;
      }
    }

    // Create new
    const created = await pb.collection('integration_rate_limits').create(
      {
        workspace_integration_id: integrationId,
        max_requests_per_minute,
        max_requests_per_hour,
        max_requests_per_day,
      },
      { $autoCancel: false }
    );

    logger.info(`Rate limits created for integration ${integrationId}`);
    return created;
  }

  /**
   * Check if execution is allowed under rate limits
   * Counts executions in last minute/hour/day from integration_execution_context
   * @param {string} integrationId - Integration ID (UUID)
   * @param {Object} executionContext - Execution context object (optional, for logging)
   * @returns {Promise<Object>} - {allowed: boolean, reason: string|null, limit: {minute, hour, day}}
   */
  async checkRateLimit(integrationId, executionContext = null) {
    if (!integrationId || typeof integrationId !== 'string') {
      throw new Error('Integration ID must be a non-empty string');
    }

    try {
      const limits = await this.getRateLimits(integrationId);
      const now = new Date();

      // Calculate time windows
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      // Count executions in each window
      const minuteExecutions = await pb.collection('integration_execution_context').getFullList({
        filter: `workspace_integration_id="${integrationId}" && created>="${oneMinuteAgo}"`,
        $autoCancel: false,
      });

      const hourExecutions = await pb.collection('integration_execution_context').getFullList({
        filter: `workspace_integration_id="${integrationId}" && created>="${oneHourAgo}"`,
        $autoCancel: false,
      });

      const dayExecutions = await pb.collection('integration_execution_context').getFullList({
        filter: `workspace_integration_id="${integrationId}" && created>="${oneDayAgo}"`,
        $autoCancel: false,
      });

      const minuteCount = minuteExecutions.length;
      const hourCount = hourExecutions.length;
      const dayCount = dayExecutions.length;

      // Check limits
      if (minuteCount >= limits.max_requests_per_minute) {
        return {
          allowed: false,
          reason: `Rate limit exceeded: ${minuteCount}/${limits.max_requests_per_minute} requests per minute`,
          limit: {
            minute: { current: minuteCount, max: limits.max_requests_per_minute },
            hour: { current: hourCount, max: limits.max_requests_per_hour },
            day: { current: dayCount, max: limits.max_requests_per_day },
          },
        };
      }

      if (hourCount >= limits.max_requests_per_hour) {
        return {
          allowed: false,
          reason: `Rate limit exceeded: ${hourCount}/${limits.max_requests_per_hour} requests per hour`,
          limit: {
            minute: { current: minuteCount, max: limits.max_requests_per_minute },
            hour: { current: hourCount, max: limits.max_requests_per_hour },
            day: { current: dayCount, max: limits.max_requests_per_day },
          },
        };
      }

      if (dayCount >= limits.max_requests_per_day) {
        return {
          allowed: false,
          reason: `Rate limit exceeded: ${dayCount}/${limits.max_requests_per_day} requests per day`,
          limit: {
            minute: { current: minuteCount, max: limits.max_requests_per_minute },
            hour: { current: hourCount, max: limits.max_requests_per_hour },
            day: { current: dayCount, max: limits.max_requests_per_day },
          },
        };
      }

      return {
        allowed: true,
        reason: null,
        limit: {
          minute: { current: minuteCount, max: limits.max_requests_per_minute },
          hour: { current: hourCount, max: limits.max_requests_per_hour },
          day: { current: dayCount, max: limits.max_requests_per_day },
        },
      };
    } catch (error) {
      logger.error(`Error checking rate limit: ${error.message}`);
      // On error, allow execution to avoid blocking
      return { allowed: true, reason: null, limit: null };
    }
  }
}

// Export singleton instance
export const rateLimitingService = new RateLimitingService();

export default rateLimitingService;
