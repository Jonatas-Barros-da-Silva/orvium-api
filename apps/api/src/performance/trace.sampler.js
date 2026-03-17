
import { runtimeConfig } from '../config/runtime.config.js';

export class TraceSampler {
  
  /**
   * Determines if an execution should be traced based on sampling rate and failure status.
   * @param {boolean} isFailure - Whether the execution failed
   * @returns {boolean} True if it should be traced
   */
  static shouldTrace(isFailure = false) {
    if (isFailure && runtimeConfig.always_trace_failures) {
      return true;
    }
    
    // Math.random() returns [0, 1). If sampling rate is 0.25, it returns true 25% of the time.
    return Math.random() < runtimeConfig.trace_sampling_rate;
  }

  /**
   * Determines if IO should be captured based on sampling rate and failure status.
   * @param {boolean} isFailure - Whether the execution failed
   * @returns {boolean} True if IO should be captured
   */
  static shouldCaptureIO(isFailure = false) {
    if (isFailure && runtimeConfig.always_capture_io_on_failure) {
      return true;
    }
    
    return Math.random() < runtimeConfig.execution_io_sampling_rate;
  }

  /**
   * Returns the current sampling configuration
   */
  static getConfig() {
    return {
      trace_sampling_rate: runtimeConfig.trace_sampling_rate,
      execution_io_sampling_rate: runtimeConfig.execution_io_sampling_rate,
      always_trace_failures: runtimeConfig.always_trace_failures,
      always_capture_io_on_failure: runtimeConfig.always_capture_io_on_failure
    };
  }
}
