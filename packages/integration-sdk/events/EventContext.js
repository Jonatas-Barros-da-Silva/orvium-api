
/**
 * Event Context
 * Immutable context object for event processing
 */
export class EventContext {
  /**
   * Constructor
   * @param {Object} options - Context options
   * @param {string} options.eventType - Event type
   * @param {string} options.workspaceId - Workspace ID
   * @param {string} options.integrationId - Integration ID
   * @param {Object} options.payload - Event payload
   * @param {string} options.timestamp - ISO 8601 timestamp
   * @param {number} options.retryAttempt - Retry attempt number (default: 0)
   * @param {string} options.executionId - Execution ID
   */
  constructor(options = {}) {
    if (!options || typeof options !== 'object') {
      throw new Error('Options must be a non-empty object');
    }

    const {
      eventType,
      workspaceId,
      integrationId,
      payload,
      timestamp,
      retryAttempt = 0,
      executionId,
    } = options;

    // Validate required fields
    if (!eventType || typeof eventType !== 'string') {
      throw new Error('eventType is required and must be a string');
    }

    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new Error('workspaceId is required and must be a string');
    }

    if (!integrationId || typeof integrationId !== 'string') {
      throw new Error('integrationId is required and must be a string');
    }

    if (!payload || typeof payload !== 'object') {
      throw new Error('payload is required and must be an object');
    }

    if (!timestamp || typeof timestamp !== 'string') {
      throw new Error('timestamp is required and must be a string');
    }

    if (typeof retryAttempt !== 'number' || retryAttempt < 0) {
      throw new Error('retryAttempt must be a non-negative number');
    }

    if (!executionId || typeof executionId !== 'string') {
      throw new Error('executionId is required and must be a string');
    }

    // Store as private properties to make immutable
    Object.defineProperty(this, '_eventType', {
      value: eventType,
      writable: false,
      enumerable: false,
    });

    Object.defineProperty(this, '_workspaceId', {
      value: workspaceId,
      writable: false,
      enumerable: false,
    });

    Object.defineProperty(this, '_integrationId', {
      value: integrationId,
      writable: false,
      enumerable: false,
    });

    Object.defineProperty(this, '_payload', {
      value: Object.freeze(payload),
      writable: false,
      enumerable: false,
    });

    Object.defineProperty(this, '_timestamp', {
      value: timestamp,
      writable: false,
      enumerable: false,
    });

    Object.defineProperty(this, '_retryAttempt', {
      value: retryAttempt,
      writable: false,
      enumerable: false,
    });

    Object.defineProperty(this, '_executionId', {
      value: executionId,
      writable: false,
      enumerable: false,
    });
  }

  /**
   * Get event type
   * @returns {string} - Event type
   */
  getEventType() {
    return this._eventType;
  }

  /**
   * Get event payload
   * @returns {Object} - Event payload (frozen)
   */
  getPayload() {
    return this._payload;
  }

  /**
   * Get workspace ID
   * @returns {string} - Workspace ID
   */
  getWorkspaceId() {
    return this._workspaceId;
  }

  /**
   * Get integration ID
   * @returns {string} - Integration ID
   */
  getIntegrationId() {
    return this._integrationId;
  }

  /**
   * Get execution ID
   * @returns {string} - Execution ID
   */
  getExecutionId() {
    return this._executionId;
  }

  /**
   * Get timestamp
   * @returns {string} - ISO 8601 timestamp
   */
  getTimestamp() {
    return this._timestamp;
  }

  /**
   * Get retry attempt number
   * @returns {number} - Retry attempt (0 for first attempt)
   */
  getRetryAttempt() {
    return this._retryAttempt;
  }

  /**
   * Serialize context to JSON
   * @returns {Object} - Serializable context object
   */
  toJSON() {
    return {
      eventType: this._eventType,
      workspaceId: this._workspaceId,
      integrationId: this._integrationId,
      payload: this._payload,
      timestamp: this._timestamp,
      retryAttempt: this._retryAttempt,
      executionId: this._executionId,
    };
  }
}
