
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

export class LogRecorder {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.batchSize = 100;
    this.intervalMs = 3000;
    
    // Start background processing
    this.timer = setInterval(() => this.processQueue(), this.intervalMs);
  }

  logInfo(data) {
    this.log({ ...data, log_level: 'info' });
  }

  logWarning(data) {
    this.log({ ...data, log_level: 'warning' });
  }

  logError(data) {
    this.log({ ...data, log_level: 'error' });
  }

  logDebug(data) {
    this.log({ ...data, log_level: 'debug' });
  }

  /**
   * Internal method to validate and queue a log record
   */
  log(data) {
    try {
      const { execution_id, integration_id, message, log_level } = data;

      if (!execution_id || !integration_id || !message || !log_level) {
        logger.warn('LogRecorder: Missing required fields (execution_id, integration_id, message, log_level)');
        return;
      }

      let metadata_json = data.metadata_json;
      if (metadata_json && typeof metadata_json !== 'string') {
        try {
          metadata_json = JSON.stringify(metadata_json);
        } catch (e) {
          metadata_json = '{}';
        }
      }

      const logRecord = {
        execution_id,
        trace_id: data.trace_id || null,
        integration_id,
        version_id: data.version_id || null,
        capability: data.capability || null,
        action: data.action || null,
        log_level,
        message,
        metadata_json: metadata_json || null,
        timestamp: data.timestamp || new Date().toISOString()
      };

      this.queue.push(logRecord);
    } catch (error) {
      logger.error('LogRecorder: Error queueing log', error);
    }
  }

  /**
   * Process the queued logs in batches
   */
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    const batch = this.queue.splice(0, this.batchSize);

    try {
      await Promise.allSettled(
        batch.map(item => 
          pb.collection('integration_logs').create(item, { $autoCancel: false })
        )
      );
    } catch (error) {
      logger.error('LogRecorder: Error processing log batch', error);
      // Fault tolerant: we log the error but continue. 
      // In a production system, we might write to a fallback file here.
    } finally {
      this.isProcessing = false;
      
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

export const logRecorder = new LogRecorder();
