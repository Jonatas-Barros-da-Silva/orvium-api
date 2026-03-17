
/**
 * Integration Logger
 * Logs integration execution events and errors
 */
export class IntegrationLogger {
  /**
   * Constructor
   * @param {Object} options - Configuration options
   * @param {string} options.workspaceId - Workspace ID
   * @param {string} options.integrationId - Integration ID
   * @param {string} options.adapterName - Adapter name
   * @param {Object} options.pocketbaseClient - PocketBase client instance
   */
  constructor(options = {}) {
    if (!options || typeof options !== 'object') {
      throw new Error('Options must be a non-empty object');
    }

    const { workspaceId, integrationId, adapterName, pocketbaseClient } = options;

    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new Error('workspaceId is required and must be a string');
    }

    if (!integrationId || typeof integrationId !== 'string') {
      throw new Error('integrationId is required and must be a string');
    }

    if (!adapterName || typeof adapterName !== 'string') {
      throw new Error('adapterName is required and must be a string');
    }

    if (!pocketbaseClient || typeof pocketbaseClient !== 'object') {
      throw new Error('pocketbaseClient is required and must be an object');
    }

    this.workspaceId = workspaceId;
    this.integrationId = integrationId;
    this.adapterName = adapterName;
    this.pb = pocketbaseClient;
  }

  /**
   * Log info message
   * @param {string} message - Log message
   * @param {Object} details - Additional details
   * @returns {Promise<Object>} - Created log record
   */
  async logInfo(message, details = null) {
    return this._createLog('info', message, 200, details);
  }

  /**
   * Log warning message
   * @param {string} message - Log message
   * @param {Object} details - Additional details
   * @returns {Promise<Object>} - Created log record
   */
  async logWarning(message, details = null) {
    return this._createLog('warning', message, 400, details);
  }

  /**
   * Log error message
   * @param {string} message - Log message
   * @param {Error|string} error - Error object or message
   * @param {Object} details - Additional details
   * @returns {Promise<Object>} - Created log record
   */
  async logError(message, error = null, details = null) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const mergedDetails = {
      ...details,
      error: errorMessage,
    };

    return this._createLog('error', message, 500, mergedDetails);
  }

  /**
   * Log execution result
   * @param {string} eventType - Event type
   * @param {Object} result - Execution result {success, message, data, error}
   * @param {number} executionTime - Execution time in milliseconds
   * @returns {Promise<Object>} - Created log record
   */
  async logExecution(eventType, result = {}, executionTime = 0) {
    if (!eventType || typeof eventType !== 'string') {
      throw new Error('eventType is required and must be a string');
    }

    if (typeof executionTime !== 'number' || executionTime < 0) {
      throw new Error('executionTime must be a non-negative number');
    }

    const status = result.success ? 'success' : 'failed';
    const responseCode = result.success ? 200 : 500;
    const errorMessage = result.error || null;

    const details = {
      eventType,
      executionTime,
      message: result.message || null,
      data: result.data || null,
    };

    return this._createLog(status, result.message || 'Execution completed', responseCode, details, errorMessage);
  }

  /**
   * Create log record in database
   * @private
   * @param {string} status - Log status (info, warning, error, success, failed)
   * @param {string} message - Log message
   * @param {number} responseCode - HTTP response code
   * @param {Object} details - Additional details
   * @param {string} errorMessage - Error message (optional)
   * @returns {Promise<Object>} - Created log record
   */
  async _createLog(status, message, responseCode, details = null, errorMessage = null) {
    try {
      const logRecord = await this.pb.collection('integration_logs').create(
        {
          workspace_id: this.workspaceId,
          workspace_integration_id: this.integrationId,
          adapter_name: this.adapterName,
          status,
          response_code: responseCode,
          error_message: errorMessage || null,
          details: details ? JSON.stringify(details) : null,
          created_at: new Date().toISOString(),
        },
        { $autoCancel: false }
      );

      return logRecord;
    } catch (error) {
      // Log to console if database logging fails
      console.error(`Failed to create log record: ${error.message}`);
      throw error;
    }
  }
}
