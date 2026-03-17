
import { IntegrationRegistryService } from '../services/IntegrationRegistryService.js';
import { IntegrationVersionService } from '../services/IntegrationVersionService.js';
import { IntegrationInstallationService } from '../services/IntegrationInstallationService.js';
import { IntegrationResolver } from '../resolvers/IntegrationResolver.js';

let cachedServices = null;

/**
 * Creates and caches a singleton instance of all integration services.
 * @param {Object} pb - PocketBase client instance
 * @returns {Object} Object containing all integration service instances
 */
export function getIntegrationServices(pb) {
  if (!cachedServices) {
    cachedServices = {
      registry: new IntegrationRegistryService(),
      version: new IntegrationVersionService(),
      installation: new IntegrationInstallationService(),
      resolver: new IntegrationResolver()
    };
  }
  return cachedServices;
}

/**
 * Safely initializes integration services with try-catch error handling.
 * Prevents startup errors by returning null objects if initialization fails.
 * @param {Object} pb - PocketBase client instance
 * @returns {Object} Object containing service instances or nulls if failed
 */
export function initializeIntegrationServices(pb) {
  try {
    return getIntegrationServices(pb);
  } catch (error) {
    console.warn('Failed to initialize integration services:', error.message);
    return {
      registry: null,
      version: null,
      installation: null,
      resolver: null
    };
  }
}
