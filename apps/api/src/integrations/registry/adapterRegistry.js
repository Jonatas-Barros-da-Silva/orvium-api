
import logger from '../../utils/logger.js';

/**
 * Registry for managing integration adapters
 * Handles registration, retrieval, and state management of adapters
 */
export default class AdapterRegistry {
  /**
   * Constructor
   */
  constructor() {
    this.adapters = [];
  }

  /**
   * Register an adapter
   * @param {BaseIntegrationAdapter} adapter - Adapter instance
   * @returns {Object} - Registration result {success, message}
   */
  registerAdapter(adapter) {
    if (!adapter) {
      throw new Error('Adapter must be provided');
    }

    if (typeof adapter.handleEvent !== 'function') {
      throw new Error('Adapter must have handleEvent() method');
    }

    const adapterName = adapter.getName();

    // Check if adapter already registered
    const existing = this.adapters.find(a => a.getName() === adapterName);
    if (existing) {
      logger.warn(`Adapter '${adapterName}' is already registered, overwriting`);
    }

    this.adapters.push(adapter);
    logger.info(`Adapter registered: ${adapterName}`);

    return {
      success: true,
      message: `Adapter ${adapterName} registered`,
    };
  }

  /**
   * Get all adapters
   * @returns {Array<BaseIntegrationAdapter>} - Array of all adapters
   */
  getAdapters() {
    return this.adapters;
  }

  /**
   * Get only enabled adapters
   * @returns {Array<BaseIntegrationAdapter>} - Array of enabled adapters
   */
  getEnabledAdapters() {
    return this.adapters.filter(a => a.isEnabled());
  }

  /**
   * Get adapter by name
   * @param {string} adapterName - Adapter name
   * @returns {BaseIntegrationAdapter|null} - Adapter or null if not found
   */
  getAdapterByName(adapterName) {
    if (!adapterName || typeof adapterName !== 'string') {
      return null;
    }

    return this.adapters.find(a => a.getName() === adapterName) || null;
  }

  /**
   * Disable adapter by name
   * @param {string} adapterName - Adapter name
   * @returns {Object} - Result {success, message}
   */
  disableAdapter(adapterName) {
    if (!adapterName || typeof adapterName !== 'string') {
      return {
        success: false,
        message: 'Adapter not found',
      };
    }

    const adapter = this.adapters.find(a => a.getName() === adapterName);
    if (!adapter) {
      return {
        success: false,
        message: 'Adapter not found',
      };
    }

    adapter.setEnabled(false);
    logger.info(`Adapter '${adapterName}' disabled`);

    return {
      success: true,
      message: `Adapter ${adapterName} disabled`,
    };
  }

  /**
   * Enable adapter by name
   * @param {string} adapterName - Adapter name
   * @returns {Object} - Result {success, message}
   */
  enableAdapter(adapterName) {
    if (!adapterName || typeof adapterName !== 'string') {
      return {
        success: false,
        message: 'Adapter not found',
      };
    }

    const adapter = this.adapters.find(a => a.getName() === adapterName);
    if (!adapter) {
      return {
        success: false,
        message: 'Adapter not found',
      };
    }

    adapter.setEnabled(true);
    logger.info(`Adapter '${adapterName}' enabled`);

    return {
      success: true,
      message: `Adapter ${adapterName} enabled`,
    };
  }

  /**
   * Get adapter statistics
   * @returns {Object} - Stats {total, enabled, disabled}
   */
  getAdapterStats() {
    const total = this.adapters.length;
    const enabled = this.adapters.filter(a => a.isEnabled()).length;
    const disabled = total - enabled;

    return {
      total,
      enabled,
      disabled,
    };
  }
}
