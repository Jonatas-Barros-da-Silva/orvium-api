
/**
 * Base Integration Adapter
 * Abstract base class for all integration adapters
 */
export class BaseIntegrationAdapter {
  /**
   * Constructor
   * @param {string} name - Adapter name
   */
  constructor(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Adapter name must be a non-empty string');
    }

    if (new.target === BaseIntegrationAdapter) {
      throw new Error('BaseIntegrationAdapter is abstract and cannot be instantiated directly');
    }

    this.name = name;
  }

  /**
   * Get adapter name (abstract)
   * @returns {string} - Adapter name
   * @throws {Error} - Must be implemented by subclass
   */
  getName() {
    throw new Error('getName() must be implemented by subclass');
  }

  /**
   * Get supported event types (abstract)
   * @returns {Array<string>} - Array of supported event types
   * @throws {Error} - Must be implemented by subclass
   */
  getSupportedEvents() {
    throw new Error('getSupportedEvents() must be implemented by subclass');
  }

  /**
   * Validate adapter configuration (abstract)
   * @param {Object} config - Configuration object to validate
   * @returns {Object} - {valid: boolean, errors: Array<string>}
   * @throws {Error} - Must be implemented by subclass
   */
  validateConfig(config) {
    throw new Error('validateConfig() must be implemented by subclass');
  }

  /**
   * Handle event (abstract)
   * Core business logic for processing events
   * @param {EventContext} eventContext - Event context object
   * @returns {Promise<Object>} - {success: boolean, message: string, data: any}
   * @throws {Error} - Must be implemented by subclass
   */
  async handleEvent(eventContext) {
    throw new Error('handleEvent() must be implemented by subclass');
  }

  /**
   * Execute event with error handling and logging
   * Public method that wraps handleEvent with try-catch
   * @param {EventContext} eventContext - Event context object
   * @returns {Promise<Object>} - {success: boolean, message: string, data: any, error: string|null}
   */
  async execute(eventContext) {
    if (!eventContext) {
      return {
        success: false,
        message: 'Event context is required',
        data: null,
        error: 'Invalid event context',
      };
    }

    try {
      // Call abstract handleEvent method
      const result = await this.handleEvent(eventContext);

      // Ensure result has required fields
      if (!result || typeof result !== 'object') {
        return {
          success: false,
          message: 'Handler returned invalid result',
          data: null,
          error: 'Result must be an object',
        };
      }

      return {
        success: result.success === true,
        message: result.message || 'Event processed',
        data: result.data || null,
        error: null,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        success: false,
        message: 'Event processing failed',
        data: null,
        error: errorMessage,
      };
    }
  }
}
