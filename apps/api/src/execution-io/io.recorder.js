
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { sanitizePayload, truncatePayload, getPayloadSize } from './payload.sanitizer.js';

export class IORecorder {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.batchSize = 20;
    this.intervalMs = 3000;
    
    this.timer = setInterval(() => this.processQueue(), this.intervalMs);
  }

  _preparePayload(payload) {
    if (!payload) return { json: null, truncated: false, size: 0 };
    
    const sanitized = sanitizePayload(payload);
    const jsonStr = JSON.stringify(sanitized);
    const size = getPayloadSize(jsonStr);
    const { truncatedStr, isTruncated } = truncatePayload(jsonStr);
    
    return { json: truncatedStr, truncated: isTruncated, size };
  }

  recordExecutionInput(data) {
    const input = this._preparePayload(data.input_payload);
    const context = this._preparePayload(data.context);

    this.queue.push({
      type: 'input',
      execution_id: data.execution_id,
      data: {
        execution_id: data.execution_id,
        trace_id: data.trace_id || null,
        integration_id: data.integration_id,
        version_id: data.version_id,
        capability: data.capability,
        action: data.action,
        input_payload_json: input.json,
        context_json: context.json,
        input_truncated: input.truncated,
        payload_size_bytes: input.size + context.size
      }
    });
  }

  recordExecutionOutput(data) {
    const output = this._preparePayload(data.output_payload);

    this.queue.push({
      type: 'output',
      execution_id: data.execution_id,
      data: {
        output_payload_json: output.json,
        output_truncated: output.truncated,
        payload_size_bytes: output.size // Will be added to existing size in DB
      }
    });
  }

  recordExecutionError(data) {
    const error = this._preparePayload(data.error_payload);

    this.queue.push({
      type: 'error',
      execution_id: data.execution_id,
      data: {
        error_payload_json: error.json,
        error_truncated: error.truncated,
        payload_size_bytes: error.size // Will be added to existing size in DB
      }
    });
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    const batch = this.queue.splice(0, this.batchSize);

    try {
      for (const item of batch) {
        try {
          if (item.type === 'input') {
            await pb.collection('integration_execution_io').create(item.data, { $autoCancel: false });
          } else {
            // For output and error, we need to find the existing record and update it
            const records = await pb.collection('integration_execution_io').getFullList({
              filter: `execution_id="${item.execution_id}"`,
              $autoCancel: false
            });

            if (records.length > 0) {
              const record = records[0];
              const newSize = (record.payload_size_bytes || 0) + (item.data.payload_size_bytes || 0);
              
              await pb.collection('integration_execution_io').update(record.id, {
                ...item.data,
                payload_size_bytes: newSize
              }, { $autoCancel: false });
            } else {
              logger.warn(`IORecorder: Could not find input record for execution ${item.execution_id} to attach ${item.type}`);
            }
          }
        } catch (err) {
          logger.error(`IORecorder: Failed to process ${item.type} for execution ${item.execution_id}`, err.message);
        }
      }
    } catch (error) {
      logger.error('IORecorder: Error processing batch', error);
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

export function createIORecorder() {
  return new IORecorder();
}

export const ioRecorder = createIORecorder();
