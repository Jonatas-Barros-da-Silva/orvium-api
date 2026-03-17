
/**
 * Execution status constants for integration sandbox results
 */
export const ExecutionStatus = {
  SUCCESS: 'success',
  ERROR: 'error',
  TIMEOUT: 'timeout'
};

/**
 * Default maximum execution time in milliseconds (30 seconds)
 */
export const DEFAULT_TIMEOUT = 30000;

/**
 * @typedef {Object} ExecutionResult
 * @property {string} status - The execution status ('success', 'error', or 'timeout')
 * @property {Object|null} data - The successful execution result data
 * @property {string|null} error - The error message if execution failed or timed out
 * @property {number} executionTime - The total time taken in milliseconds
 * @property {string} timestamp - ISO8601 timestamp of when the execution completed
 */

/**
 * @typedef {Object} SandboxConfig
 * @property {number} maxExecutionTime - Maximum allowed execution time in milliseconds
 * @property {string} version - The sandbox runtime version
 */
