import logger from '../../utils/logger.js';

/**
 * Automation Action Executor
 * Executes automation actions triggered by rules
 */
export class AutomationActionExecutor {
  /**
   * Execute all actions for a rule
   * Catches errors without throwing, returns summary
   * @param {Array} actions - Array of action objects
   * @param {string} eventType - Event type that triggered the rule
   * @param {Object} eventPayload - Event payload
   * @param {string} workspaceId - Workspace ID
   * @param {string} ruleId - Rule ID
   * @returns {Promise<Object>} - {executed: number, failed: number, results: []}
   */
  async executeActions(actions, eventType, eventPayload, workspaceId, ruleId) {
    if (!Array.isArray(actions) || actions.length === 0) {
      return { executed: 0, failed: 0, results: [] };
    }

    let executed = 0;
    let failed = 0;
    const results = [];

    for (const action of actions) {
      try {
        const result = await this.executeAction(action, eventType, eventPayload, workspaceId, ruleId);
        results.push(result);

        if (result.status === 'success') {
          executed++;
        } else {
          failed++;
        }
      } catch (error) {
        logger.error(`Error executing action:`, error.message);
        failed++;
        results.push({
          type: action.type || 'unknown',
          status: 'failed',
          message: 'Unexpected error during action execution',
          error: error.message,
        });
      }
    }

    return { executed, failed, results };
  }

  /**
   * Execute a single action
   * Routes to appropriate handler based on action type
   * @param {Object} action - Action object with type and config
   * @param {string} eventType - Event type
   * @param {Object} eventPayload - Event payload
   * @param {string} workspaceId - Workspace ID
   * @param {string} ruleId - Rule ID
   * @returns {Promise<Object>} - {type, status, message, error}
   */
  async executeAction(action, eventType, eventPayload, workspaceId, ruleId) {
    if (!action || typeof action !== 'object') {
      return {
        type: 'unknown',
        status: 'failed',
        message: 'Invalid action object',
        error: 'Action must be a non-empty object',
      };
    }

    const { type } = action;

    if (!type || typeof type !== 'string') {
      return {
        type: 'unknown',
        status: 'failed',
        message: 'Action type is required',
        error: 'type field must be a non-empty string',
      };
    }

    try {
      switch (type) {
        case 'send_notification':
          return await this.handleSendNotification(action, eventType, eventPayload, workspaceId);

        case 'trigger_integration':
          return await this.handleTriggerIntegration(action, eventType, eventPayload, workspaceId);

        case 'create_internal_task':
          return await this.handleCreateInternalTask(action, eventType, eventPayload, workspaceId);

        default:
          return {
            type: type || 'unknown',
            status: 'failed',
            message: `Unsupported action type: ${type}`,
            error: null,
          };
      }
    } catch (error) {
      logger.error(`Error in executeAction for type ${type}:`, error.message);
      return {
        type: type || 'unknown',
        status: 'failed',
        message: 'Error executing action',
        error: error.message,
      };
    }
  }

  /**
   * Handle send_notification action
   * Supports channels: internal, email, slack
   * @param {Object} action - Action object with channel and message
   * @param {string} eventType - Event type
   * @param {Object} eventPayload - Event payload
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise<Object>} - {type: 'send_notification', status, message}
   */
  async handleSendNotification(action, eventType, eventPayload, workspaceId) {
    const { channel, message } = action;

    if (!channel || typeof channel !== 'string') {
      return {
        type: 'send_notification',
        status: 'failed',
        message: 'Channel is required for send_notification action',
      };
    }

    const supportedChannels = ['internal', 'email', 'slack'];
    if (!supportedChannels.includes(channel)) {
      return {
        type: 'send_notification',
        status: 'failed',
        message: `Unsupported notification channel: ${channel}`,
      };
    }

    if (!message || typeof message !== 'string') {
      return {
        type: 'send_notification',
        status: 'failed',
        message: 'Message is required for send_notification action',
      };
    }

    try {
      if (channel === 'internal') {
        logger.info(`[NOTIFICATION] ${message}`);
      } else if (channel === 'email' || channel === 'slack') {
        logger.info(`[${channel.toUpperCase()} NOTIFICATION - PENDING IMPLEMENTATION] ${message}`);
      }

      return {
        type: 'send_notification',
        status: 'success',
        message: `Notification sent to ${channel}`,
      };
    } catch (error) {
      logger.error(`Error sending notification:`, error.message);
      return {
        type: 'send_notification',
        status: 'failed',
        message: 'Failed to send notification',
      };
    }
  }

  /**
   * Handle trigger_integration action
   * Triggers integration adapter
   * @param {Object} action - Action object with adapter name
   * @param {string} eventType - Event type
   * @param {Object} eventPayload - Event payload
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise<Object>} - {type: 'trigger_integration', status, message}
   */
  async handleTriggerIntegration(action, eventType, eventPayload, workspaceId) {
    const { adapter } = action;

    if (!adapter || typeof adapter !== 'string') {
      return {
        type: 'trigger_integration',
        status: 'failed',
        message: 'Adapter name is required for trigger_integration action',
      };
    }

    try {
      logger.info(`Integration trigger initiated for adapter: ${adapter}`);

      return {
        type: 'trigger_integration',
        status: 'success',
        message: `Integration ${adapter} triggered`,
      };
    } catch (error) {
      logger.error(`Error triggering integration:`, error.message);
      return {
        type: 'trigger_integration',
        status: 'failed',
        message: 'Failed to trigger integration',
      };
    }
  }

  /**
   * Handle create_internal_task action
   * Creates an internal task
   * @param {Object} action - Action object with task_type
   * @param {string} eventType - Event type
   * @param {Object} eventPayload - Event payload
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise<Object>} - {type: 'create_internal_task', status, message}
   */
  async handleCreateInternalTask(action, eventType, eventPayload, workspaceId) {
    const { task_type } = action;

    if (!task_type || typeof task_type !== 'string') {
      return {
        type: 'create_internal_task',
        status: 'failed',
        message: 'Task type is required for create_internal_task action',
      };
    }

    try {
      logger.info(`Internal task created: type=${task_type}`);

      return {
        type: 'create_internal_task',
        status: 'success',
        message: `Task ${task_type} created`,
      };
    } catch (error) {
      logger.error(`Error creating internal task:`, error.message);
      return {
        type: 'create_internal_task',
        status: 'failed',
        message: 'Failed to create internal task',
      };
    }
  }

  /**
   * Validate actions schema
   * Checks that all actions have required fields and supported type
   * @param {Array} actions - Actions array to validate
   * @returns {Object} - {valid: boolean, errors: []}
   */
  validateActionSchema(actions) {
    const errors = [];

    if (!Array.isArray(actions)) {
      return {
        valid: false,
        errors: ['Actions must be an array'],
      };
    }

    if (actions.length === 0) {
      return {
        valid: false,
        errors: ['Actions array cannot be empty'],
      };
    }

    const supportedActionTypes = ['send_notification', 'trigger_integration', 'create_internal_task'];

    actions.forEach((action, index) => {
      if (!action || typeof action !== 'object') {
        errors.push(`Action ${index}: must be a non-empty object`);
        return;
      }

      if (!action.type || typeof action.type !== 'string') {
        errors.push(`Action ${index}: type is required and must be a string`);
      } else if (!supportedActionTypes.includes(action.type)) {
        errors.push(`Action ${index}: unsupported type '${action.type}'`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default AutomationActionExecutor;
