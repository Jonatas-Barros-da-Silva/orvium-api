
import 'dotenv/config';
import { BaseIntegrationAdapter } from '@orvium/integration-sdk/adapters';
import logger from '../../utils/logger.js';

/**
 * Analytics Integration Adapter
 * Sends events to external analytics endpoint
 */
export default class AnalyticsAdapter extends BaseIntegrationAdapter {
  /**
   * Constructor
   */
  constructor() {
    super('analytics');
    this.analyticsEndpoint = process.env.ANALYTICS_ENDPOINT;
    this.analyticsApiKey = process.env.ANALYTICS_API_KEY;
    this.enabled = !!this.analyticsEndpoint;

    logger.info(
      `AnalyticsAdapter initialized: endpoint=${this.analyticsEndpoint || 'not configured'}, enabled=${this.enabled}`
    );
  }

  /**
   * Handle event and send to analytics
   * @param {string} eventType - Event type
   * @param {Object} payload - Event payload
   * @param {string} workspaceId - Workspace ID
   * @param {Object} adapterConfig - Optional adapter configuration
   * @returns {Promise<Object>} - Handler result
   */
  async handleEvent(eventType, payload, workspaceId, adapterConfig = null) {
    // List of supported event types
    const supportedEvents = [
      'event.repasse.completed',
      'event.wallet.updated',
      'event.ledger.entry.created',
      'event.payout.sent',
    ];

    // Skip if event type not supported
    if (!supportedEvents.includes(eventType)) {
      return {
        status: 'skipped',
        reason: 'event_type_not_supported',
      };
    }

    // Skip if adapter is disabled
    if (!this.isEnabled()) {
      return {
        status: 'skipped',
        reason: 'adapter_disabled',
      };
    }

    // Check if event is allowed by configuration
    if (adapterConfig && !this.validateEventAllowed(eventType, adapterConfig)) {
      return {
        status: 'skipped',
        reason: 'event_not_in_filter',
      };
    }

    // Get endpoint and API key from config or fallback to env
    const endpoint = this.getConfigValue('endpoint', this.analyticsEndpoint, adapterConfig);
    const apiKey = this.getConfigValue('api_key', this.analyticsApiKey, adapterConfig);

    // Transform payload
    const transformedPayload = this.transformPayload(eventType, payload, workspaceId);

    // Send to analytics
    const result = await this.sendToAnalytics(transformedPayload, endpoint, apiKey);

    return {
      status: result.success ? 'success' : 'failed',
      responseCode: result.statusCode,
      responseTime: result.responseTime,
    };
  }

  /**
   * Transform event payload for analytics
   * @param {string} eventType - Event type
   * @param {Object} payload - Event payload
   * @param {string} workspaceId - Workspace ID
   * @returns {string} - Transformed payload as JSON string
   */
  transformPayload(eventType, payload, workspaceId) {
    const transformed = {
      source: 'orvium',
      event_type: eventType,
      workspace_id: workspaceId,
      timestamp: new Date().toISOString(),
      data: payload,
    };

    return JSON.stringify(transformed);
  }

  /**
   * Send payload to analytics endpoint
   * @param {string} payload - Payload to send (JSON string)
   * @param {string} endpoint - Analytics endpoint URL
   * @param {string} apiKey - API key for authentication
   * @returns {Promise<Object>} - Result {success, statusCode, responseTime, error}
   */
  async sendToAnalytics(payload, endpoint, apiKey) {
    if (!endpoint) {
      return {
        success: false,
        statusCode: null,
        responseTime: 0,
        error: 'Analytics endpoint not configured',
      };
    }

    const startTime = Date.now();

    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: payload,
        timeout: 10000,
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      return {
        success: response.ok,
        statusCode: response.status,
        responseTime,
        error: response.ok ? null : `HTTP ${response.status}`,
      };
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.error(`Analytics adapter error: ${error.message}`);

      return {
        success: false,
        statusCode: null,
        responseTime,
        error: error.message,
      };
    }
  }

  /**
   * Health check for analytics adapter
   * @returns {Promise<Object>} - Health status
   */
  async healthCheck() {
    if (!this.analyticsEndpoint) {
      return {
        status: 'error',
        adapter: 'analytics',
        message: 'Analytics endpoint not configured',
      };
    }

    try {
      // Send test request
      const testPayload = JSON.stringify({
        source: 'orvium',
        event_type: 'health_check',
        timestamp: new Date().toISOString(),
        data: { test: true },
      });

      const result = await this.sendToAnalytics(
        testPayload,
        this.analyticsEndpoint,
        this.analyticsApiKey
      );

      if (result.success) {
        return {
          status: 'ok',
          adapter: 'analytics',
          endpoint: this.analyticsEndpoint,
          message: 'Analytics adapter healthy',
        };
      } else {
        return {
          status: 'error',
          adapter: 'analytics',
          endpoint: this.analyticsEndpoint,
          message: result.error || 'Health check failed',
        };
      }
    } catch (error) {
      return {
        status: 'error',
        adapter: 'analytics',
        endpoint: this.analyticsEndpoint,
        message: error.message,
      };
    }
  }
}
