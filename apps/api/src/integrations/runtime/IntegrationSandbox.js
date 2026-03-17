
import { DEFAULT_TIMEOUT } from './types.js';
import { SandboxUtils } from './SandboxUtils.js';

/**
 * Provides a safe execution environment for integration adapters
 * Protects against infinite loops, excessive execution times, and unhandled errors.
 */
export class IntegrationSandbox {
  /**
   * @param {Object} options
   * @param {number} [options.maxExecutionTime=30000] - Max execution time in ms
   * @param {Object} [options.logger=console] - Logger instance
   */
  constructor(options = {}) {
    this.maxExecutionTime = options.maxExecutionTime || DEFAULT_TIMEOUT;
    this.logger = options.logger || console;
  }

  /**
   * Executes an adapter safely within the sandbox constraints
   * @param {Object} adapter - The integration adapter instance
   * @param {Object} payload - The payload to process
   * @param {Object} [config={}] - Additional configuration
   * @returns {Promise<import('./types.js').ExecutionResult>}
   */
  async execute(adapter, payload, config = {}) {
    const executionId = this._generateExecutionId();
    this.logger.info(`[Sandbox ${executionId}] Starting execution`);
    const startTime = Date.now();

    if (!adapter || typeof adapter.execute !== 'function') {
      const error = 'Invalid adapter: missing execute method';
      this.logger.error(`[Sandbox ${executionId}] ${error}`);
      return SandboxUtils.createError(error, Date.now() - startTime);
    }

    try {
      const result = await this._executeWithTimeout(adapter, payload, config, executionId);
      const executionTime = Date.now() - startTime;
      
      this.logger.info(`[Sandbox ${executionId}] Execution completed successfully in ${executionTime}ms`);
      return SandboxUtils.createSuccess(result, executionTime);
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      if (error.name === 'TimeoutError') {
        this.logger.warn(`[Sandbox ${executionId}] Execution timed out after ${this.maxExecutionTime}ms`);
        return SandboxUtils.createTimeout(this.maxExecutionTime);
      }
      
      const formattedError = this._formatError(error);
      this.logger.error(`[Sandbox ${executionId}] Execution failed: ${formattedError}`);
      return SandboxUtils.createError(formattedError, executionTime);
    }
  }

  /**
   * Wraps the adapter execution in a Promise.race with a timeout
   * @private
   */
  _executeWithTimeout(adapter, payload, config, executionId) {
    return Promise.race([
      this._executeAdapter(adapter, payload, config, executionId),
      this._createTimeoutPromise()
    ]);
  }

  /**
   * Executes the actual adapter logic
   * @private
   */
  async _executeAdapter(adapter, payload, config, executionId) {
    this.logger.debug(`[Sandbox ${executionId}] Calling adapter.execute()`);
    return await adapter.execute(payload, config);
  }

  /**
   * Creates a promise that rejects after maxExecutionTime
   * @private
   */
  _createTimeoutPromise() {
    return new Promise((_, reject) => {
      setTimeout(() => {
        const error = new Error('Execution timed out');
        error.name = 'TimeoutError';
        reject(error);
      }, this.maxExecutionTime);
    });
  }

  /**
   * Safely formats an error object into a string
   * @private
   */
  _formatError(error) {
    if (error instanceof Error) return error.message;
    if (typeof error === 'object') {
      try {
        return JSON.stringify(error);
      } catch (e) {
        return 'Unserializable error object';
      }
    }
    return String(error);
  }

  /**
   * Generates a unique ID for logging purposes
   * @private
   */
  _generateExecutionId() {
    return Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
  }

  /**
   * Returns the current sandbox configuration
   * @returns {import('./types.js').SandboxConfig}
   */
  getConfig() {
    return {
      maxExecutionTime: this.maxExecutionTime,
      version: '1.0.0'
    };
  }

  /**
   * Updates the maximum execution time
   * @param {number} ms - New timeout in milliseconds
   */
  setMaxExecutionTime(ms) {
    if (typeof ms !== 'number' || ms < 1000) {
      throw new Error('maxExecutionTime must be a number >= 1000');
    }
    this.maxExecutionTime = ms;
    this.logger.info(`[Sandbox] maxExecutionTime updated to ${ms}ms`);
  }
}
