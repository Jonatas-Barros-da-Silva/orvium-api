
import 'dotenv/config';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

/**
 * Integration Job Queue Service
 * Manages asynchronous job queue for integration execution
 */
class IntegrationJobQueueService {
  constructor() {
    // Exponential backoff strategy (in milliseconds)
    this.BACKOFF_STRATEGY = {
      0: 30000,   // 30 seconds for first retry
      1: 120000,  // 2 minutes for second retry
      2: 600000,  // 10 minutes for third retry
    };
    this.DEFAULT_MAX_ATTEMPTS = 3;
  }

  /**
   * Generate unique job ID
   * @param {string} workspaceId - Workspace ID
   * @param {string} integrationId - Integration ID
   * @returns {string} - Generated job ID
   */
  generateJobId(workspaceId, integrationId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${workspaceId}-${integrationId}-${timestamp}-${random}`;
  }

  /**
   * Enqueue a new integration job
   * @param {string} workspaceId - Workspace ID
   * @param {string} integrationId - Workspace integration ID
   * @param {string} adapterType - Adapter type
   * @param {Object} payload - Job payload
   * @param {number} maxAttempts - Maximum retry attempts
   * @returns {Promise<Object>} - Created job record
   */
  async enqueueJob(workspaceId, integrationId, adapterType, payload, maxAttempts = 3) {
    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new Error('Workspace ID must be a non-empty string');
    }

    if (!integrationId || typeof integrationId !== 'string') {
      throw new Error('Integration ID must be a non-empty string');
    }

    if (!adapterType || typeof adapterType !== 'string') {
      throw new Error('Adapter type must be a non-empty string');
    }

    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload must be a non-empty object');
    }

    try {
      const jobId = this.generateJobId(workspaceId, integrationId);
      const now = new Date().toISOString();

      const job = await pb.collection('integration_jobs').create({
        job_id: jobId,
        workspace_id: workspaceId,
        workspace_integration_id: integrationId,
        adapter_type: adapterType,
        payload: payload,
        status: 'pending',
        attempt: 0,
        max_attempts: maxAttempts,
        scheduled_at: now,
      }, { $autoCancel: false });

      logger.info(`Job enqueued: ${jobId} for workspace ${workspaceId}`);
      return job;
    } catch (error) {
      logger.error('Failed to enqueue job:', error.message);
      throw error;
    }
  }

  /**
   * Fetch next pending jobs
   * @param {number} limit - Maximum number of jobs to fetch
   * @returns {Promise<Array>} - Array of pending jobs
   */
  async fetchNextJob(limit = 10) {
    try {
      const now = new Date().toISOString();
      
      const jobs = await pb.collection('integration_jobs').getFullList({
        filter: `status="pending" && scheduled_at<="${now}"`,
        sort: 'scheduled_at,created_at',
        $autoCancel: false,
      });

      // Return only up to limit
      return jobs.slice(0, limit);
    } catch (error) {
      logger.error('Failed to fetch next jobs:', error.message);
      throw error;
    }
  }

  /**
   * Mark job as processing
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} - Updated job record
   */
  async markJobProcessing(jobId) {
    if (!jobId || typeof jobId !== 'string') {
      throw new Error('Job ID must be a non-empty string');
    }

    try {
      const jobs = await pb.collection('integration_jobs').getFullList({
        filter: `job_id="${jobId}"`,
        $autoCancel: false,
      });

      if (jobs.length === 0) {
        throw new Error(`Job not found: ${jobId}`);
      }

      const job = jobs[0];
      const now = new Date().toISOString();

      const updated = await pb.collection('integration_jobs').update(job.id, {
        status: 'processing',
        started_at: now,
      }, { $autoCancel: false });

      logger.debug(`Job marked as processing: ${jobId}`);
      return updated;
    } catch (error) {
      logger.error(`Failed to mark job as processing: ${jobId}`, error.message);
      throw error;
    }
  }

  /**
   * Mark job as completed
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} - Updated job record
   */
  async markJobCompleted(jobId) {
    if (!jobId || typeof jobId !== 'string') {
      throw new Error('Job ID must be a non-empty string');
    }

    try {
      const jobs = await pb.collection('integration_jobs').getFullList({
        filter: `job_id="${jobId}"`,
        $autoCancel: false,
      });

      if (jobs.length === 0) {
        throw new Error(`Job not found: ${jobId}`);
      }

      const job = jobs[0];
      const now = new Date().toISOString();

      const updated = await pb.collection('integration_jobs').update(job.id, {
        status: 'completed',
        completed_at: now,
      }, { $autoCancel: false });

      logger.info(`Job completed: ${jobId}`);
      return updated;
    } catch (error) {
      logger.error(`Failed to mark job as completed: ${jobId}`, error.message);
      throw error;
    }
  }

  /**
   * Mark job as failed
   * @param {string} jobId - Job ID
   * @param {string} errorMessage - Error message
   * @returns {Promise<Object>} - Updated job record or dead letter record
   */
  async markJobFailed(jobId, errorMessage) {
    if (!jobId || typeof jobId !== 'string') {
      throw new Error('Job ID must be a non-empty string');
    }

    try {
      const jobs = await pb.collection('integration_jobs').getFullList({
        filter: `job_id="${jobId}"`,
        $autoCancel: false,
      });

      if (jobs.length === 0) {
        throw new Error(`Job not found: ${jobId}`);
      }

      const job = jobs[0];

      // Check if max attempts reached
      if (job.attempt >= job.max_attempts - 1) {
        // Move to dead letter queue
        await this.moveToDeadLetterQueue(jobId, errorMessage);
        
        // Update job status to dead_letter
        const updated = await pb.collection('integration_jobs').update(job.id, {
          status: 'dead_letter',
        }, { $autoCancel: false });

        logger.warn(`Job moved to dead letter queue: ${jobId}`);
        return updated;
      } else {
        // Mark as failed (will be rescheduled)
        const updated = await pb.collection('integration_jobs').update(job.id, {
          status: 'failed',
        }, { $autoCancel: false });

        logger.warn(`Job marked as failed: ${jobId}`);
        return updated;
      }
    } catch (error) {
      logger.error(`Failed to mark job as failed: ${jobId}`, error.message);
      throw error;
    }
  }

  /**
   * Reschedule a failed job
   * @param {string} jobId - Job ID
   * @param {number} nextAttempt - Next attempt number
   * @returns {Promise<Object>} - Updated job record
   */
  async rescheduleJob(jobId, nextAttempt) {
    if (!jobId || typeof jobId !== 'string') {
      throw new Error('Job ID must be a non-empty string');
    }

    if (typeof nextAttempt !== 'number' || nextAttempt < 0) {
      throw new Error('Next attempt must be a non-negative number');
    }

    try {
      const jobs = await pb.collection('integration_jobs').getFullList({
        filter: `job_id="${jobId}"`,
        $autoCancel: false,
      });

      if (jobs.length === 0) {
        throw new Error(`Job not found: ${jobId}`);
      }

      const job = jobs[0];

      // Calculate backoff time
      const backoffMs = this.BACKOFF_STRATEGY[nextAttempt] || this.BACKOFF_STRATEGY[2];
      const scheduledAt = new Date(Date.now() + backoffMs).toISOString();

      const updated = await pb.collection('integration_jobs').update(job.id, {
        status: 'pending',
        attempt: nextAttempt,
        scheduled_at: scheduledAt,
      }, { $autoCancel: false });

      logger.info(`Job rescheduled: ${jobId} for attempt ${nextAttempt} at ${scheduledAt}`);
      return updated;
    } catch (error) {
      logger.error(`Failed to reschedule job: ${jobId}`, error.message);
      throw error;
    }
  }

  /**
   * Move job to dead letter queue
   * @param {string} jobId - Job ID
   * @param {string} errorMessage - Error message
   * @returns {Promise<Object>} - Created dead letter record
   */
  async moveToDeadLetterQueue(jobId, errorMessage) {
    if (!jobId || typeof jobId !== 'string') {
      throw new Error('Job ID must be a non-empty string');
    }

    try {
      const jobs = await pb.collection('integration_jobs').getFullList({
        filter: `job_id="${jobId}"`,
        $autoCancel: false,
      });

      if (jobs.length === 0) {
        throw new Error(`Job not found: ${jobId}`);
      }

      const job = jobs[0];

      const deadJob = await pb.collection('integration_dead_jobs').create({
        job_id: job.job_id,
        workspace_id: job.workspace_id,
        workspace_integration_id: job.workspace_integration_id,
        adapter_type: job.adapter_type,
        payload: job.payload,
        attempts: job.attempt + 1,
        error_message: errorMessage || 'Unknown error',
      }, { $autoCancel: false });

      logger.error(`Job moved to dead letter queue: ${jobId} after ${job.attempt + 1} attempts`);
      return deadJob;
    } catch (error) {
      logger.error(`Failed to move job to dead letter queue: ${jobId}`, error.message);
      throw error;
    }
  }
}

// Export singleton instance
export const integrationJobQueueService = new IntegrationJobQueueService();
export default integrationJobQueueService;
