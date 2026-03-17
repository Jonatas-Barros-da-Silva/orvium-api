
import { ExecutionStatus } from './types.js';

/**
 * Utility class for handling and formatting IntegrationSandbox results
 */
export class SandboxUtils {
  /**
   * Checks if the execution was successful
   * @param {import('./types.js').ExecutionResult} result 
   * @returns {boolean}
   */
  static isSuccess(result) {
    return result?.status === ExecutionStatus.SUCCESS;
  }

  /**
   * Checks if the execution timed out
   * @param {import('./types.js').ExecutionResult} result 
   * @returns {boolean}
   */
  static isTimeout(result) {
    return result?.status === ExecutionStatus.TIMEOUT;
  }

  /**
   * Checks if the execution resulted in an error
   * @param {import('./types.js').ExecutionResult} result 
   * @returns {boolean}
   */
  static isError(result) {
    return result?.status === ExecutionStatus.ERROR;
  }

  /**
   * Extracts the data payload from a successful result
   * @param {import('./types.js').ExecutionResult} result 
   * @returns {Object|null}
   */
  static getData(result) {
    return result?.data || null;
  }

  /**
   * Extracts the error message from a failed or timed out result
   * @param {import('./types.js').ExecutionResult} result 
   * @returns {string|null}
   */
  static getError(result) {
    return result?.error || null;
  }

  /**
   * Formats an execution result for safe logging (omits full data payload)
   * @param {import('./types.js').ExecutionResult} result 
   * @returns {Object|null}
   */
  static formatForLog(result) {
    if (!result) return null;
    
    const logData = {
      status: result.status,
      executionTime: result.executionTime,
      timestamp: result.timestamp
    };

    if (result.data) {
      try {
        logData.dataSize = JSON.stringify(result.data).length;
      } catch (e) {
        logData.dataSize = 'unknown';
      }
    }

    if (result.error) {
      logData.error = result.error;
    }

    return logData;
  }

  /**
   * Factory method to create a standardized success result
   * @param {Object} data 
   * @param {number} executionTime 
   * @returns {import('./types.js').ExecutionResult}
   */
  static createSuccess(data, executionTime) {
    return {
      status: ExecutionStatus.SUCCESS,
      data,
      error: null,
      executionTime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Factory method to create a standardized error result
   * @param {Error|string} error 
   * @param {number} executionTime 
   * @returns {import('./types.js').ExecutionResult}
   */
  static createError(error, executionTime) {
    return {
      status: ExecutionStatus.ERROR,
      data: null,
      error: String(error),
      executionTime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Factory method to create a standardized timeout result
   * @param {number} maxTime 
   * @returns {import('./types.js').ExecutionResult}
   */
  static createTimeout(maxTime) {
    return {
      status: ExecutionStatus.TIMEOUT,
      data: null,
      error: `Execution timed out after ${maxTime}ms`,
      executionTime: maxTime,
      timestamp: new Date().toISOString()
    };
  }
}
