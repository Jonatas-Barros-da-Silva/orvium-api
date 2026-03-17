
import 'dotenv/config';
import logger from '../utils/logger.js';

let integrationDispatcher = null;
let adapterRegistry = null;

/**
 * Initialize integration layer
 * LEGACY INTEGRATIONS DISABLED to prevent startup errors.
 * @returns {Object} - {dispatcher, registry}
 */
function initializeIntegrations() {
  logger.info('Legacy integrations initialization disabled.');
  return {
    dispatcher: null,
    registry: null,
  };
}

export { initializeIntegrations, integrationDispatcher, adapterRegistry };
