
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

export class TraceRecorder {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.batchSize = 50;
    this.intervalMs = 2000;
    
    this.timer = setInterval(() => this.processQueue(), this.intervalMs);
  }

  /**
   * Generate a 15-character alphanumeric ID for PocketBase
   */
  _generateId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 15; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  recordTraceStart(data) {
    const id = this._generateId();
    this.queue.push({
      type: 'trace_start',
      collection: 'integration_traces',
      data: {
        id,
        trace_id: data.trace_id,
        execution_id: data.execution_id,
        integration_id: data.integration_id,
        version_id: data.version_id,
        status: 'started',
        started_at: data.started_at || new Date().toISOString(),
        span_count: 0
      }
    });
    return id;
  }

  recordTraceFinish(internalId, data) {
    this.queue.push({
      type: 'trace_finish',
      collection: 'integration_traces',
      id: internalId,
      data: {
        status: data.status,
        finished_at: data.finished_at || new Date().toISOString(),
        total_duration_ms: data.total_duration_ms,
        span_count: data.span_count
      }
    });
  }

  recordSpanStart(data) {
    const id = this._generateId();
    this.queue.push({
      type: 'span_start',
      collection: 'integration_trace_spans',
      data: {
        id,
        trace_id: data.trace_id,
        span_name: data.span_name,
        span_type: data.span_type,
        start_time: data.start_time || new Date().toISOString(),
        status: 'started'
      }
    });
    return id;
  }

  recordSpanFinish(internalId, data) {
    let metadata_json = data.metadata;
    if (metadata_json && typeof metadata_json !== 'string') {
      try {
        metadata_json = JSON.stringify(metadata_json);
      } catch (e) {
        metadata_json = '{}';
      }
    }

    this.queue.push({
      type: 'span_finish',
      collection: 'integration_trace_spans',
      id: internalId,
      data: {
        end_time: data.end_time || new Date().toISOString(),
        duration_ms: data.duration_ms,
        status: data.status,
        metadata_json: metadata_json || null
      }
    });
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    const batch = this.queue.splice(0, this.batchSize);

    try {
      await Promise.allSettled(
        batch.map(async (item) => {
          try {
            if (item.type.endsWith('_start')) {
              await pb.collection(item.collection).create(item.data, { $autoCancel: false });
            } else if (item.type.endsWith('_finish')) {
              await pb.collection(item.collection).update(item.id, item.data, { $autoCancel: false });
            }
          } catch (err) {
            logger.error(`TraceRecorder: Failed to process ${item.type} for ${item.collection}`, err.message);
          }
        })
      );
    } catch (error) {
      logger.error('TraceRecorder: Error processing batch', error);
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 100);
      }
    }
  }

  async flush() {
    clearInterval(this.timer);
    while (this.queue.length > 0) {
      await this.processQueue();
    }
  }
}

export const traceRecorder = new TraceRecorder();
