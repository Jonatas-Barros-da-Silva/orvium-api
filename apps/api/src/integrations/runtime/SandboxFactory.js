
import { IntegrationSandbox } from './IntegrationSandbox.js';
import { DEFAULT_TIMEOUT } from './types.js';

/**
 * Factory class for creating and managing IntegrationSandbox instances
 */
export class SandboxFactory {
  /**
   * @param {Object} options
   * @param {number} [options.maxExecutionTime] - Default timeout for new sandboxes
   * @param {Object} [options.logger] - Default logger for new sandboxes
   */
  constructor(options = {}) {
    this.defaultMaxExecutionTime = options.maxExecutionTime || DEFAULT_TIMEOUT;
    this.logger = options.logger || console;
    this.sandboxes = new Map();
  }

  /**
   * Creates a new IntegrationSandbox instance
   * @param {Object} options - Sandbox options
   * @returns {IntegrationSandbox}
   */
  createSandbox(options = {}) {
    return new IntegrationSandbox({
      maxExecutionTime: options.maxExecutionTime || this.defaultMaxExecutionTime,
      logger: options.logger || this.logger
    });
  }

  /**
   * Gets an existing named sandbox or creates a new one
   * @param {string} name - The unique name for the sandbox
   * @param {Object} options - Options if a new sandbox needs to be created
   * @returns {IntegrationSandbox}
   */
  getSandbox(name, options = {}) {
    if (!this.sandboxes.has(name)) {
      this.sandboxes.set(name, this.createSandbox(options));
    }
    return this.sandboxes.get(name);
  }

  /**
   * Creates a new sandbox with a specific timeout
   * @param {number} milliseconds - Timeout in ms
   * @returns {IntegrationSandbox}
   */
  createSandboxWithTimeout(milliseconds) {
    if (typeof milliseconds !== 'number' || milliseconds < 1000) {
      throw new Error('Timeout must be a number >= 1000ms');
    }
    return this.createSandbox({ maxExecutionTime: milliseconds });
  }

  /**
   * Returns all cached sandboxes
   * @returns {Array<{name: string, sandbox: IntegrationSandbox}>}
   */
  getAllSandboxes() {
    return Array.from(this.sandboxes.entries()).map(([name, sandbox]) => ({
      name,
      sandbox
    }));
  }

  /**
   * Clears all cached sandboxes
   */
  clearAll() {
    this.sandboxes.clear();
  }
}
