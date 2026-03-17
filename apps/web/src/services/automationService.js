
import apiServerClient from '@/lib/apiServerClient.js';

/**
 * Fetch all automation rules
 * @returns {Promise<Array>} Array of automation rules
 */
export const fetchAutomationRules = async () => {
  try {
    const response = await apiServerClient.fetch('/automations/rules');
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch automation rules');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching automation rules:', error);
    throw error;
  }
};

/**
 * Fetch a single automation rule by ID
 * @param {string} ruleId - Rule ID
 * @returns {Promise<Object>} Automation rule object
 */
export const fetchAutomationRule = async (ruleId) => {
  try {
    const response = await apiServerClient.fetch(`/automations/rules/${ruleId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch automation rule');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching automation rule:', error);
    throw error;
  }
};

/**
 * Create a new automation rule
 * @param {string} ruleName - Name of the rule
 * @param {string} eventType - Event type to trigger on
 * @param {Array} conditionsJson - Array of condition objects
 * @param {Array} actionsJson - Array of action objects
 * @returns {Promise<Object>} Created rule object
 */
export const createAutomationRule = async (ruleName, eventType, conditionsJson, actionsJson) => {
  try {
    const response = await apiServerClient.fetch('/automations/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: ruleName,
        event_type: eventType,
        conditions_json: conditionsJson,
        actions_json: actionsJson,
        enabled: true,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create automation rule');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating automation rule:', error);
    throw error;
  }
};

/**
 * Update an existing automation rule
 * @param {string} ruleId - Rule ID
 * @param {string} ruleName - Name of the rule
 * @param {string} eventType - Event type to trigger on
 * @param {Array} conditionsJson - Array of condition objects
 * @param {Array} actionsJson - Array of action objects
 * @param {boolean} enabled - Whether rule is enabled
 * @returns {Promise<Object>} Updated rule object
 */
export const updateAutomationRule = async (ruleId, ruleName, eventType, conditionsJson, actionsJson, enabled) => {
  try {
    const response = await apiServerClient.fetch(`/automations/rules/${ruleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: ruleName,
        event_type: eventType,
        conditions_json: conditionsJson,
        actions_json: actionsJson,
        enabled,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update automation rule');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating automation rule:', error);
    throw error;
  }
};

/**
 * Delete an automation rule
 * @param {string} ruleId - Rule ID
 * @returns {Promise<void>}
 */
export const deleteAutomationRule = async (ruleId) => {
  try {
    const response = await apiServerClient.fetch(`/automations/rules/${ruleId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete automation rule');
    }
  } catch (error) {
    console.error('Error deleting automation rule:', error);
    throw error;
  }
};

/**
 * Enable an automation rule
 * @param {string} ruleId - Rule ID
 * @returns {Promise<Object>} Updated rule object
 */
export const enableAutomationRule = async (ruleId) => {
  try {
    const response = await apiServerClient.fetch(`/automations/rules/${ruleId}/enable`, {
      method: 'POST',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to enable automation rule');
    }
    return await response.json();
  } catch (error) {
    console.error('Error enabling automation rule:', error);
    throw error;
  }
};

/**
 * Disable an automation rule
 * @param {string} ruleId - Rule ID
 * @returns {Promise<Object>} Updated rule object
 */
export const disableAutomationRule = async (ruleId) => {
  try {
    const response = await apiServerClient.fetch(`/automations/rules/${ruleId}/disable`, {
      method: 'POST',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to disable automation rule');
    }
    return await response.json();
  } catch (error) {
    console.error('Error disabling automation rule:', error);
    throw error;
  }
};

/**
 * Fetch automation logs with optional filters
 * @param {Object} filters - Filter parameters (rule_id, event_type, status, limit, offset)
 * @returns {Promise<Object>} Logs data with pagination
 */
export const fetchAutomationLogs = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (filters.rule_id) queryParams.append('rule_id', filters.rule_id);
    if (filters.event_type) queryParams.append('event_type', filters.event_type);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);

    const url = `/automations/logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiServerClient.fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch automation logs');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching automation logs:', error);
    throw error;
  }
};

/**
 * Fetch a single automation log by ID
 * @param {string} logId - Log ID
 * @returns {Promise<Object>} Log object
 */
export const fetchAutomationLog = async (logId) => {
  try {
    const response = await apiServerClient.fetch(`/automations/logs/${logId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch automation log');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching automation log:', error);
    throw error;
  }
};

/**
 * Fetch available event types
 * @returns {Promise<Array>} Array of event type objects
 */
export const fetchEventTypes = async () => {
  try {
    const response = await apiServerClient.fetch('/events/types');
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch event types');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching event types:', error);
    throw error;
  }
};

/**
 * Fetch available integration adapters
 * @returns {Promise<Array>} Array of adapter objects
 */
export const fetchIntegrationAdapters = async () => {
  try {
    const response = await apiServerClient.fetch('/integrations/adapters');
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch integration adapters');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching integration adapters:', error);
    throw error;
  }
};
