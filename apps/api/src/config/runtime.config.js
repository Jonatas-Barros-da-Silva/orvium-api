
import logger from '../utils/logger.js';

export const runtimeConfig = {
  // Observability Sampling
  trace_sampling_rate: parseFloat(process.env.TRACE_SAMPLING_RATE || '0.25'),
  execution_io_sampling_rate: parseFloat(process.env.EXECUTION_IO_SAMPLING_RATE || '0.5'),
  always_trace_failures: process.env.ALWAYS_TRACE_FAILURES !== 'false', // default true
  always_capture_io_on_failure: process.env.ALWAYS_CAPTURE_IO_ON_FAILURE !== 'false', // default true
  
  // Worker Configuration
  worker_concurrency: parseInt(process.env.WORKER_CONCURRENCY || '10', 10),
  worker_timeout_ms: parseInt(process.env.WORKER_TIMEOUT_MS || '30000', 10),
  
  // Queue Configuration
  queue_batch_size: parseInt(process.env.QUEUE_BATCH_SIZE || '5', 10),
  queue_poll_interval_ms: parseInt(process.env.QUEUE_POLL_INTERVAL_MS || '1000', 10),

  // Performance Thresholds
  slow_execution_threshold_ms: parseInt(process.env.SLOW_EXECUTION_THRESHOLD_MS || '2000', 10)
};

export function validateRuntimeConfig() {
  const errors = [];

  if (runtimeConfig.trace_sampling_rate < 0 || runtimeConfig.trace_sampling_rate > 1) {
    errors.push('trace_sampling_rate must be between 0 and 1');
  }
  
  if (runtimeConfig.execution_io_sampling_rate < 0 || runtimeConfig.execution_io_sampling_rate > 1) {
    errors.push('execution_io_sampling_rate must be between 0 and 1');
  }

  if (runtimeConfig.worker_concurrency < 1) {
    errors.push('worker_concurrency must be at least 1');
  }

  if (runtimeConfig.queue_batch_size < 1) {
    errors.push('queue_batch_size must be at least 1');
  }

  if (errors.length > 0) {
    logger.error('Runtime configuration validation failed:', errors);
    // We don't throw here to prevent crashing, but we log heavily.
    // In a strict environment, you might want to throw.
  } else {
    logger.info('Runtime configuration validated successfully.');
  }

  return errors.length === 0;
}
