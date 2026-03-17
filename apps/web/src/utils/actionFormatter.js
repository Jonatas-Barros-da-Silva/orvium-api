
/**
 * Formats a single action object into a readable string
 * @param {Object} action - Action object with type and parameters
 * @returns {string} Readable action string
 */
export const formatAction = (action) => {
  if (!action || !action.type) {
    return '';
  }

  switch (action.type) {
    case 'send_notification':
      return `Send notification (${action.channel || 'internal'})`;
    case 'trigger_integration':
      return `Trigger integration: ${action.adapter || 'unknown'}`;
    case 'create_internal_task':
      return `Create task: ${action.task_type || 'general'}`;
    case 'update_status':
      return `Update status to: ${action.new_status || 'unknown'}`;
    case 'send_webhook':
      return `Send webhook to: ${action.webhook_url || 'unknown'}`;
    default:
      return `Action: ${action.type}`;
  }
};

/**
 * Formats an array of actions into a readable string with bullet points
 * @param {Array} actions - Array of action objects
 * @returns {string} Readable actions string
 */
export const formatActions = (actions) => {
  if (!actions || actions.length === 0) {
    return 'No actions';
  }

  return actions.map((action, index) => `${index + 1}. ${formatAction(action)}`).join('\n');
};

/**
 * Converts UI inputs to an action object
 * @param {string} actionType - Type of action
 * @param {Object} parameters - Action parameters
 * @returns {Object} Action object
 */
export const parseActionFromUI = (actionType, parameters) => {
  return {
    type: actionType,
    ...parameters,
  };
};

/**
 * Validates an action object
 * @param {Object} action - Action to validate
 * @returns {boolean} True if valid
 */
export const validateAction = (action) => {
  if (!action.type) return false;

  switch (action.type) {
    case 'send_notification':
      return !!action.channel;
    case 'trigger_integration':
      return !!action.adapter;
    case 'create_internal_task':
      return !!action.task_type;
    default:
      return true;
  }
};
