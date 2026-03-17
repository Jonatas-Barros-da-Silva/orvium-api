
import crypto from 'crypto';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

export class AnalyticsRecorder {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.batchSize = 50;
    this.intervalMs = 5000;
    
    // Start background processing
    this.timer = setInterval(() => this.processQueue(), this.intervalMs);
  }

  /**
   * Non-blocking method to record an execution
   * @param {Object} data Execution data
   */
  recordExecution(data) {
    try {
      // Validate required fields
      const required = ['integration_id', 'version_id', 'capability', 'action', 'status', 'latency_ms', 'trigger_type', 'started_at', 'finished_at'];
      for (const field of required) {
        if (data[field] === undefined || data[field] === null) {
          logger.warn(`AnalyticsRecorder: Missing required field '${field}'`);
          return;
        }
      }

      const executionRecord = {
        ...data,
        execution_id: data.execution_id || crypto.randomUUID()
      };

      this.queue.push(executionRecord);
    } catch (error) {
      logger.error('AnalyticsRecorder: Error queueing execution', error);
    }
  }

  /**
   * Process the queued items in batches
   */
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    const batch = this.queue.splice(0, this.batchSize);

    try {
      // In a real high-throughput system, we'd use a bulk insert endpoint if available.
      // PocketBase doesn't have native bulk insert, so we insert sequentially or via Promise.all
      await Promise.allSettled(
        batch.map(item => 
          pb.collection('integration_executions').create(item, { $autoCancel: false })
        )
      );
    } catch (error) {
      logger.error('AnalyticsRecorder: Error processing batch', error);
      // Optionally re-queue failed items here if needed
    } finally {
      this.isProcessing = false;
      
      // If there are still items, process them on next tick
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 100);
      }
    }
  }

  /**
   * Graceful shutdown method
   */
  async flush() {
    clearInterval(this.timer);
    while (this.queue.length > 0) {
      await this.processQueue();
    }
  }
}

// Export a singleton instance
export const analyticsRecorder = new AnalyticsRecorder();
