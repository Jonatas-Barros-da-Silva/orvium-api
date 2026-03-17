
import os from 'os';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { integrationWorkerService } from './integrationWorkerService.js';
import { marketplaceService } from './marketplaceService.js';

/**
 * Worker Runtime Service
 * Manages the lifecycle, scaling, and health of integration workers
 */
class WorkerRuntimeService {
  constructor() {
    this.WORKER_HEARTBEAT_INTERVAL = 10000; // 10 seconds
    this.WORKER_HEARTBEAT_TIMEOUT = 30000; // 30 seconds
    this.PROCESSING_TIMEOUT = 600000; // 10 minutes
    this.WORKER_CONCURRENCY = 5;
    this.monitorInterval = null;
  }

  /**
   * Start the worker runtime
   * @param {number} numWorkers - Number of workers to spawn
   * @param {number} maxConcurrency - Max concurrency per worker
   * @returns {Promise<Object>} - Result object
   */
  async startWorkerRuntime(numWorkers = 1, maxConcurrency = 5) {
    logger.info('worker_runtime_started');
    await marketplaceService.logWorkerEvent('worker_runtime_started', { numWorkers, maxConcurrency });
    
    for (let i = 0; i < numWorkers; i++) {
      await this.spawnWorker(maxConcurrency);
    }
    
    // Start background monitor
    this.monitorInterval = setInterval(() => this.monitorWorkers(), 30000);
    
    return { success: true, workersStarted: numWorkers, maxConcurrency };
  }

  /**
   * Spawn a new worker
   * @param {number} maxConcurrency - Max concurrency for this worker
   * @returns {Promise<Object>} - Worker instance
   */
  async spawnWorker(maxConcurrency = 5) {
    const hostname = os.hostname();
    const pid = process.pid;
    const random = Math.random().toString(36).substring(2, 8);
    const workerId = `${hostname}-${pid}-${random}`;

    const worker = await this.registerWorker(workerId, hostname, maxConcurrency);
    
    logger.info(`worker_started: ${workerId}`);
    await marketplaceService.logWorkerEvent('worker_started', { 
      workerId, 
      hostname,
      max_concurrency: maxConcurrency
    });

    // Start worker loop asynchronously
    integrationWorkerService.startWorker(workerId).catch(err => {
      logger.error(`Worker ${workerId} failed to start:`, err);
    });

    return worker;
  }

  /**
   * Register a new worker in the database
   * @param {string} workerId - Worker ID
   * @param {string} hostname - Hostname
   * @param {number} maxConcurrency - Max concurrency
   * @returns {Promise<Object>} - Created worker record
   */
  async registerWorker(workerId, hostname, maxConcurrency = 5) {
    try {
      const now = new Date().toISOString();
      const worker = await pb.collection('integration_workers').create({
        worker_id: workerId,
        hostname: hostname,
        status: 'starting',
        active_jobs: 0,
        max_concurrency: maxConcurrency,
        last_heartbeat: now,
        started_at: now
      }, { $autoCancel: false });
      return worker;
    } catch (error) {
      logger.error(`Failed to register worker ${workerId}:`, error.message);
      throw error;
    }
  }

  /**
   * Monitor workers for health and recover stuck jobs
   */
  async monitorWorkers() {
    try {
      const now = new Date();
      const timeoutThreshold = new Date(now.getTime() - this.WORKER_HEARTBEAT_TIMEOUT).toISOString();

      // Find dead workers
      const deadWorkers = await pb.collection('integration_workers').getFullList({
        filter: `status="active" && last_heartbeat < "${timeoutThreshold}"`,
        $autoCancel: false
      });

      for (const worker of deadWorkers) {
        // Mark worker as stopped
        await pb.collection('integration_workers').update(worker.id, {
          status: 'stopped'
        }, { $autoCancel: false });

        logger.warn(`worker_dead_detected: ${worker.worker_id}`);
        await marketplaceService.logWorkerEvent('worker_dead_detected', { workerId: worker.worker_id });

        // Recover stuck jobs
        const stuckJobsThreshold = new Date(now.getTime() - this.PROCESSING_TIMEOUT).toISOString();
        const stuckJobs = await pb.collection('integration_jobs').getFullList({
          filter: `status="processing" && started_at < "${stuckJobsThreshold}"`,
          $autoCancel: false
        });

        for (const job of stuckJobs) {
          await pb.collection('integration_jobs').update(job.id, {
            status: 'pending',
            started_at: null
          }, { $autoCancel: false });
          
          logger.info(`job_recovered_from_dead_worker: ${job.job_id}`);
          await marketplaceService.logWorkerEvent('job_recovered_from_dead_worker', { 
            jobId: job.job_id, 
            oldWorkerId: worker.worker_id 
          });
        }
      }
    } catch (error) {
      logger.error('Error monitoring workers:', error.message);
    }
  }

  /**
   * Gracefully shutdown all workers
   */
  async shutdownWorkers() {
    try {
      const activeWorkers = await pb.collection('integration_workers').getFullList({
        filter: `status="active" || status="starting"`,
        $autoCancel: false
      });

      // Mark all as stopping
      for (const worker of activeWorkers) {
        await pb.collection('integration_workers').update(worker.id, {
          status: 'stopping'
        }, { $autoCancel: false });
      }

      // Wait for active jobs to finish (simplified wait)
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Mark all as stopped
      for (const worker of activeWorkers) {
        await pb.collection('integration_workers').update(worker.id, {
          status: 'stopped'
        }, { $autoCancel: false });
        
        logger.info(`worker_stopped: ${worker.worker_id}`);
        await marketplaceService.logWorkerEvent('worker_stopped', { workerId: worker.worker_id });
      }

      if (this.monitorInterval) {
        clearInterval(this.monitorInterval);
      }

      logger.info('worker_runtime_shutdown');
      await marketplaceService.logWorkerEvent('worker_runtime_shutdown', {});
    } catch (error) {
      logger.error('Error shutting down workers:', error.message);
    }
  }

  /**
   * Update worker status
   * @param {string} workerId - Worker ID
   * @param {string} status - New status
   * @returns {Promise<Object>} - Updated record
   */
  async updateWorkerStatus(workerId, status) {
    try {
      const workers = await pb.collection('integration_workers').getFullList({
        filter: `worker_id="${workerId}"`,
        $autoCancel: false
      });
      
      if (workers.length > 0) {
        return await pb.collection('integration_workers').update(workers[0].id, { 
          status 
        }, { $autoCancel: false });
      }
    } catch (error) {
      logger.error(`Failed to update worker status for ${workerId}:`, error.message);
    }
  }

  /**
   * Update worker active jobs count
   * @param {string} workerId - Worker ID
   * @param {number} activeJobs - Active jobs count
   * @returns {Promise<Object>} - Updated record
   */
  async updateWorkerActiveJobs(workerId, activeJobs) {
    try {
      const workers = await pb.collection('integration_workers').getFullList({
        filter: `worker_id="${workerId}"`,
        $autoCancel: false
      });
      
      if (workers.length > 0) {
        return await pb.collection('integration_workers').update(workers[0].id, { 
          active_jobs: activeJobs 
        }, { $autoCancel: false });
      }
    } catch (error) {
      logger.error(`Failed to update active jobs for ${workerId}:`, error.message);
    }
  }

  /**
   * Send worker heartbeat
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Updated record
   */
  async sendWorkerHeartbeat(workerId) {
    try {
      const workers = await pb.collection('integration_workers').getFullList({
        filter: `worker_id="${workerId}"`,
        $autoCancel: false
      });
      
      if (workers.length > 0) {
        return await pb.collection('integration_workers').update(workers[0].id, { 
          last_heartbeat: new Date().toISOString() 
        }, { $autoCancel: false });
      }
    } catch (error) {
      logger.error(`Failed to send heartbeat for ${workerId}:`, error.message);
    }
  }
}

// Export singleton instance
export const workerRuntimeService = new WorkerRuntimeService();
export default workerRuntimeService;
