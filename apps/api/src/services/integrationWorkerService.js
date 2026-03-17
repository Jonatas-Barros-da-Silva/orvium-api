
import 'dotenv/config';
import integrationJobQueueService from './integrationJobQueueService.js';
import IntegrationDispatcher from '../integrations/dispatcher/integrationDispatcher.js';
import { adapterRegistry } from '../integrations/registry/adapterRegistry.js';
import logger from '../utils/logger.js';
import workerRuntimeService from './workerRuntimeService.js';
import pb from '../utils/pocketbaseClient.js';
import marketplaceService from './marketplaceService.js';
import { EventContext } from '@orvium/integration-sdk/events';

/**
 * Integration Worker Service
 * Processes integration jobs from the queue
 */
class IntegrationWorkerService {
  constructor() {
    this.WORKER_POLL_INTERVAL = 5000; // 5 seconds
    this.WORKER_CONCURRENCY = 5;
    this.integrationDispatcher = new IntegrationDispatcher(adapterRegistry);
    this.activeWorkers = new Map(); // Track running state per worker
  }

  /**
   * Start the worker
   * @param {string} workerId - Worker ID
   * @returns {IntegrationWorkerService} - Worker instance
   */
  async startWorker(workerId) {
    if (this.activeWorkers.get(workerId)) {
      logger.warn(`Worker ${workerId} is already running`);
      return this;
    }

    this.activeWorkers.set(workerId, true);
    
    // Register worker startup
    await workerRuntimeService.updateWorkerStatus(workerId, 'active');
    logger.info(`worker_active: ${workerId}`);

    // Start worker loop
    this.workerLoop(workerId);

    return this;
  }

  /**
   * Stop the worker
   * @param {string} workerId - Worker ID
   */
  stopWorker(workerId) {
    if (!this.activeWorkers.get(workerId)) {
      logger.warn(`Worker ${workerId} is not running`);
      return;
    }

    this.activeWorkers.set(workerId, false);
    logger.info(`Integration worker stopped: ${workerId}`);
  }

  /**
   * Worker loop - continuously processes jobs
   * @param {string} workerId - Worker ID
   */
  async workerLoop(workerId) {
    let activeJobs = 0;

    while (this.activeWorkers.get(workerId)) {
      try {
        // Fetch worker record to get max_concurrency
        const workers = await pb.collection('integration_workers').getFullList({
          filter: `worker_id="${workerId}"`,
          $autoCancel: false
        });

        if (workers.length === 0) {
          logger.error(`Worker record not found for ${workerId}`);
          await this.sleep(this.WORKER_POLL_INTERVAL);
          continue;
        }

        const worker = workers[0];
        const maxConcurrency = worker.max_concurrency || this.WORKER_CONCURRENCY;

        // Claim jobs up to max_concurrency limit
        while (activeJobs < maxConcurrency) {
          const job = await this.claimNextJob(workerId);
          
          if (!job) {
            break; // No more jobs available right now
          }

          activeJobs++;
          
          // Process in background (non-blocking)
          this.processJob(job, workerId).finally(async () => {
            activeJobs--;
            await workerRuntimeService.updateWorkerActiveJobs(workerId, activeJobs);
          });
        }

        // Update active jobs and send heartbeat
        await workerRuntimeService.updateWorkerActiveJobs(workerId, activeJobs);
        await workerRuntimeService.sendWorkerHeartbeat(workerId);

        // Sleep before next fetch
        await this.sleep(this.WORKER_POLL_INTERVAL);
      } catch (error) {
        logger.error(`Error in worker loop for ${workerId}:`, error.message);
        // Continue loop even on error
        await this.sleep(this.WORKER_POLL_INTERVAL);
      }
    }
  }

  /**
   * Atomically claim the next pending job
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object|null>} - Claimed job or null
   */
  async claimNextJob(workerId) {
    try {
      // Execute atomic UPDATE to prevent race conditions
      const query = `UPDATE integration_jobs SET status='processing', started_at=now(), worker_id='${workerId}' WHERE id=(SELECT id FROM integration_jobs WHERE status='pending' AND scheduled_at<=now() ORDER BY scheduled_at ASC, created_at ASC LIMIT 1) RETURNING *`;
      
      // Assuming a custom endpoint /api/sql exists to execute raw SQL
      const result = await pb.send('/api/sql', {
        method: 'POST',
        body: { query }
      });

      const claimedJob = Array.isArray(result) ? result[0] : result;
      
      if (claimedJob && claimedJob.id) {
        logger.info(`job_claimed: ${claimedJob.job_id} by ${workerId}`);
        await marketplaceService.logWorkerEvent('job_claimed', { 
          jobId: claimedJob.job_id, 
          workerId 
        });
        return claimedJob;
      }
      
      return null;
    } catch (error) {
      // If update fails or no jobs available, return null
      return null;
    }
  }

  /**
   * Process a single job
   * @param {Object} job - Job record
   * @param {string} workerId - Worker ID
   */
  async processJob(job, workerId) {
    const startTime = Date.now();
    const jobId = job.job_id;
    const workspaceId = job.workspace_id;
    const integrationId = job.workspace_integration_id;
    const adapterType = job.adapter_type;
    const payload = typeof job.payload === 'string' ? JSON.parse(job.payload) : job.payload;
    const attempt = job.attempt;
    const maxAttempts = job.max_attempts;

    try {
      // Extract event type and data from payload
      const eventType = payload.eventType;
      const eventData = payload.eventData || payload;

      // Create EventContext using SDK
      let eventContext;
      try {
        eventContext = new EventContext(eventType, eventData, workspaceId);
      } catch (e) {
        // Fallback if EventContext is not fully implemented yet
        eventContext = { type: eventType, payload: eventData, workspaceId };
      }

      // Dispatch integration event
      await this.integrationDispatcher.dispatchIntegrationEvent(
        eventContext.type,
        eventContext.payload,
        eventContext.workspaceId
      );

      // Mark job as completed
      await integrationJobQueueService.markJobCompleted(jobId);

      const executionTime = Date.now() - startTime;
      logger.info('integration_job_completed', {
        jobId,
        workerId,
        workspaceId,
        integrationId,
        adapterType,
        executionTime,
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const nextAttempt = attempt + 1;

      if (nextAttempt < maxAttempts) {
        // Reschedule job
        await integrationJobQueueService.rescheduleJob(jobId, nextAttempt);

        const backoffTime = integrationJobQueueService.BACKOFF_STRATEGY[nextAttempt] || 
                           integrationJobQueueService.BACKOFF_STRATEGY[2];

        logger.warn('integration_job_rescheduled', {
          jobId,
          workerId,
          nextAttempt,
          backoffTime,
          error: error.message,
        });
      } else {
        // Mark job as failed (will move to dead letter queue)
        await integrationJobQueueService.markJobFailed(jobId, error.message);

        logger.error('integration_job_failed', {
          jobId,
          workerId,
          attempts: nextAttempt,
          error: error.message,
        });
      }
    }
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const integrationWorkerService = new IntegrationWorkerService();
export default integrationWorkerService;
