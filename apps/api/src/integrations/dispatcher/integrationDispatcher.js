
import 'dotenv/config';
import pb from '../../utils/pocketbaseClient.js';
import logger from '../../utils/logger.js';
import { integrationConfigService } from '../../services/integrationConfigService.js';
import { IntegrationLogger } from '@orvium/integration-sdk/logging';

/**
 * Integration Dispatcher
 * Dispatches events to registered adapters and manages execution
 * NOTE: This is now called by the worker service, not directly by automation engine
 */
export default class IntegrationDispatcher {
  /**
   * Constructor
   * @param {AdapterRegistry} registry - Adapter registry instance
   */
  constructor(registry) {
    if (!registry) {
      throw new Error('Registry must be provided');
    }
    this.registry = registry;
    
    // Initialize SDK logger
    try {
      this.sdkLogger = new IntegrationLogger();
    } catch (e) {
      // Fallback if IntegrationLogger is not fully implemented yet
      this.sdkLogger = logger;
    }
  }

  /**
   * Dispatch event to all enabled adapters
   * @param {string} eventType - Event type
   * @param {Object} payload - Event payload
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise<Object>} - Dispatch result {dispatched, failed, skipped}
   */
  async dispatchIntegrationEvent(eventType, payload, workspaceId) {
    if (!eventType || typeof eventType !== 'string') {
      throw new Error('Event type must be a non-empty string');
    }

    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload must be a non-empty object');
    }

    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new Error('Workspace ID must be a non-empty string');
    }

    const enabledAdapters = this.registry.getEnabledAdapters();

    if (enabledAdapters.length === 0) {
      logger.debug('No enabled adapters found for integration dispatch');
      return { dispatched: 0, failed: 0, skipped: 0 };
    }

    let dispatched = 0;
    let failed = 0;
    let skipped = 0;

    // Dispatch to all adapters asynchronously (non-blocking)
    enabledAdapters.forEach(adapter => {
      Promise.resolve().then(async () => {
        const startTime = Date.now();
        const adapterType = adapter.getName();

        try {
          // Load workspace configuration for adapter
          const adapterConfig = await integrationConfigService.getIntegrationConfig(
            workspaceId,
            adapterType
          );

          // Skip if config not found or disabled
          if (!adapterConfig || !adapterConfig.enabled) {
            await this.logIntegrationExecution(
              workspaceId,
              adapterType,
              eventType,
              null,
              null,
              0,
              'adapter_disabled_or_not_configured'
            );
            skipped++;
            return;
          }

          // Check if event is allowed by configuration
          const configJson = typeof adapterConfig.config_json === 'string'
            ? JSON.parse(adapterConfig.config_json)
            : adapterConfig.config_json;

          if (Array.isArray(configJson.events) && !configJson.events.includes(eventType)) {
            await this.logIntegrationExecution(
              workspaceId,
              adapterType,
              eventType,
              null,
              null,
              0,
              'event_not_in_filter'
            );
            skipped++;
            return;
          }

          // Call adapter with configuration
          const result = await adapter.handleEvent(eventType, payload, workspaceId, adapterConfig);
          const responseTime = Date.now() - startTime;

          // Check if result is skipped
          if (result.status === 'skipped') {
            await this.logIntegrationExecution(
              workspaceId,
              adapterType,
              eventType,
              null,
              null,
              responseTime,
              result.reason || 'adapter_skipped'
            );
            skipped++;
          } else if (result.status === 'success') {
            // Log successful execution
            await this.logIntegrationExecution(
              workspaceId,
              adapterType,
              eventType,
              'success',
              result.responseCode || null,
              responseTime,
              null
            );
            dispatched++;
          } else {
            // Log failed execution
            await this.logIntegrationExecution(
              workspaceId,
              adapterType,
              eventType,
              'failed',
              result.responseCode || null,
              responseTime,
              result.reason || 'adapter_error'
            );
            failed++;
          }
        } catch (error) {
          const responseTime = Date.now() - startTime;
          await this.handleAdapterError(adapter, error, eventType, workspaceId, responseTime);
          failed++;
        }
      });
    });

    return { dispatched, failed, skipped };
  }

  /**
   * Log integration execution
   * @param {string} workspaceId - Workspace ID
   * @param {string} adapterType - Adapter type/name
   * @param {string} eventType - Event type
   * @param {string} status - Execution status ('success', 'failed', or null for skipped)
   * @param {number} responseCode - Response code
   * @param {number} responseTime - Response time in ms
   * @param {string} skipReason - Skip reason if skipped
   * @returns {Promise<Object>} - Created log entry
   */
  async logIntegrationExecution(
    workspaceId,
    adapterType,
    eventType,
    status,
    responseCode,
    responseTime,
    skipReason
  ) {
    try {
      const logStatus = skipReason ? 'skipped' : (status || 'success');
      const errorMessage = skipReason || null;

      const logEntry = await pb.collection('integration_logs').create({
        workspace_id: workspaceId,
        adapter_name: adapterType,
        event_type: eventType,
        status: logStatus,
        response_code: responseCode,
        response_time_ms: responseTime,
        error_message: errorMessage,
      }, { $autoCancel: false });

      return logEntry;
    } catch (error) {
      logger.error('Failed to log integration execution:', error.message);
      throw error;
    }
  }

  /**
   * Handle adapter error
   * @param {BaseIntegrationAdapter} adapter - Adapter instance
   * @param {Error} error - Error object
   * @param {string} eventType - Event type
   * @param {string} workspaceId - Workspace ID
   * @param {number} responseTime - Response time in ms
   * @returns {Promise<Object>} - Error details
   */
  async handleAdapterError(adapter, error, eventType, workspaceId, responseTime) {
    const adapterType = adapter.getName();
    const errorMessage = error.message || 'Unknown error';

    // Log to integration_logs
    try {
      await this.logIntegrationExecution(
        workspaceId,
        adapterType,
        eventType,
        'failed',
        null,
        responseTime,
        errorMessage
      );
    } catch (logError) {
      logger.error('Failed to log adapter error:', logError.message);
    }

    // Log to console
    logger.error(`Integration error [${adapterType}]:`, error);

    return {
      adapter: adapterType,
      error: errorMessage,
    };
  }

  /**
   * Get integration logs
   * @param {string} workspaceId - Workspace ID
   * @param {Object} filters - Optional filters {adapter_name, event_type, status}
   * @returns {Promise<Object>} - Logs {logs, total, limit, offset}
   */
  async getIntegrationLogs(workspaceId, filters = {}) {
    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new Error('Workspace ID must be a non-empty string');
    }

    let filterString = `workspace_id="${workspaceId}"`;

    if (filters.adapter_name) {
      filterString += ` && adapter_name="${filters.adapter_name}"`;
    }

    if (filters.event_type) {
      filterString += ` && event_type="${filters.event_type}"`;
    }

    if (filters.status) {
      filterString += ` && status="${filters.status}"`;
    }

    const result = await pb.collection('integration_logs').getList(1, 50, {
      filter: filterString,
      sort: '-created',
      $autoCancel: false,
    });

    return {
      logs: result.items,
      total: result.totalItems,
      limit: result.perPage,
      offset: 0,
    };
  }
}
