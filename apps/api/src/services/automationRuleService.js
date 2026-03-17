
import 'dotenv/config';
import pb from '../utils/pocketbaseClient.js';
import RuleConditionEvaluator from '../automations/engine/ruleConditionEvaluator.js';
import AutomationActionExecutor from '../automations/engine/automationActionExecutor.js';
import automationRuleVersionService from './automationRuleVersionService.js';
import logger from '../utils/logger.js';

/**
 * Automation Rule Service
 * Manages automation rule CRUD operations
 */
export class AutomationRuleService {
  constructor() {
    this.ruleConditionEvaluator = new RuleConditionEvaluator();
    this.automationActionExecutor = new AutomationActionExecutor();
  }

  /**
   * Create a new automation rule
   * @param {string} workspaceId - Workspace ID
   * @param {string} name - Rule name
   * @param {string} eventType - Event type to trigger on
   * @param {Object} conditionsJson - Conditions object
   * @param {Array} actionsJson - Actions array
   * @returns {Promise<Object>} - Created rule record
   */
  async createRule(workspaceId, name, eventType, conditionsJson, actionsJson) {
    // Validate inputs
    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new Error('Workspace ID must be a non-empty string');
    }

    if (!name || typeof name !== 'string') {
      throw new Error('Name must be a non-empty string');
    }

    if (!eventType || typeof eventType !== 'string') {
      throw new Error('Event type must be a non-empty string');
    }

    if (!actionsJson || !Array.isArray(actionsJson)) {
      throw new Error('Actions must be a non-empty array');
    }

    // Validate conditions schema
    const conditionsValidation = this.ruleConditionEvaluator.validateConditionsSchema(conditionsJson);
    if (!conditionsValidation.valid) {
      throw new Error(`Invalid conditions schema: ${conditionsValidation.errors.join(', ')}`);
    }

    // Validate actions schema
    const actionsValidation = this.automationActionExecutor.validateActionSchema(actionsJson);
    if (!actionsValidation.valid) {
      throw new Error(`Invalid actions schema: ${actionsValidation.errors.join(', ')}`);
    }

    try {
      const rule = await pb.collection('automation_rules').create({
        workspace_id: workspaceId,
        name,
        event_type: eventType,
        conditions_json: conditionsJson || {},
        actions_json: actionsJson,
        enabled: true,
      }, { $autoCancel: false });

      // Create initial version
      const version = await automationRuleVersionService.createVersion(
        rule.id,
        workspaceId,
        eventType,
        conditionsJson || {},
        actionsJson
      );

      logger.info(`Automation rule created: ${rule.id} with version ${version.version_number}`);
      return { ...rule, current_version: version.version_number };
    } catch (error) {
      logger.error('Error creating automation rule:', error.message);
      throw error;
    }
  }

  /**
   * Update an automation rule
   * @param {string} ruleId - Rule ID
   * @param {string} workspaceId - Workspace ID
   * @param {string} name - Rule name
   * @param {string} eventType - Event type
   * @param {Object} conditionsJson - Conditions object
   * @param {Array} actionsJson - Actions array
   * @param {boolean} enabled - Whether rule is enabled
   * @returns {Promise<Object>} - Updated rule record
   */
  async updateRule(ruleId, workspaceId, name, eventType, conditionsJson, actionsJson, enabled) {
    // Validate inputs
    if (!ruleId || typeof ruleId !== 'string') {
      throw new Error('Rule ID must be a non-empty string');
    }

    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new Error('Workspace ID must be a non-empty string');
    }

    // Verify rule belongs to workspace
    const existingRule = await pb.collection('automation_rules').getOne(ruleId, { $autoCancel: false });
    if (existingRule.workspace_id !== workspaceId) {
      throw new Error('Rule does not belong to this workspace');
    }

    // Validate conditions schema if provided
    if (conditionsJson !== undefined) {
      const conditionsValidation = this.ruleConditionEvaluator.validateConditionsSchema(conditionsJson);
      if (!conditionsValidation.valid) {
        throw new Error(`Invalid conditions schema: ${conditionsValidation.errors.join(', ')}`);
      }
    }

    // Validate actions schema if provided
    if (actionsJson !== undefined) {
      const actionsValidation = this.automationActionExecutor.validateActionSchema(actionsJson);
      if (!actionsValidation.valid) {
        throw new Error(`Invalid actions schema: ${actionsValidation.errors.join(', ')}`);
      }
    }

    try {
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (eventType !== undefined) updateData.event_type = eventType;
      if (conditionsJson !== undefined) updateData.conditions_json = conditionsJson;
      if (actionsJson !== undefined) updateData.actions_json = actionsJson;
      if (enabled !== undefined) updateData.enabled = enabled;

      const rule = await pb.collection('automation_rules').update(ruleId, updateData, { $autoCancel: false });

      // Create new version if configuration changed
      let currentVersionNumber = await automationRuleVersionService.getLatestVersionNumber(ruleId);
      
      if (eventType !== undefined || conditionsJson !== undefined || actionsJson !== undefined) {
        const version = await automationRuleVersionService.createVersion(
          rule.id,
          workspaceId,
          rule.event_type,
          rule.conditions_json,
          rule.actions_json
        );
        currentVersionNumber = version.version_number;
      }

      logger.info(`Automation rule updated: ${ruleId}`);
      return { ...rule, current_version: currentVersionNumber };
    } catch (error) {
      logger.error('Error updating automation rule:', error.message);
      throw error;
    }
  }

  /**
   * Delete an automation rule
   * @param {string} ruleId - Rule ID
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteRule(ruleId, workspaceId) {
    // Validate inputs
    if (!ruleId || typeof ruleId !== 'string') {
      throw new Error('Rule ID must be a non-empty string');
    }

    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new Error('Workspace ID must be a non-empty string');
    }

    // Verify rule belongs to workspace
    const existingRule = await pb.collection('automation_rules').getOne(ruleId, { $autoCancel: false });
    if (existingRule.workspace_id !== workspaceId) {
      throw new Error('Rule does not belong to this workspace');
    }

    try {
      await pb.collection('automation_rules').delete(ruleId, { $autoCancel: false });
      logger.info(`Automation rule deleted: ${ruleId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting automation rule:', error.message);
      throw error;
    }
  }

  /**
   * Enable an automation rule
   * @param {string} ruleId - Rule ID
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise<Object>} - Updated rule record
   */
  async enableRule(ruleId, workspaceId) {
    // Validate inputs
    if (!ruleId || typeof ruleId !== 'string') {
      throw new Error('Rule ID must be a non-empty string');
    }

    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new Error('Workspace ID must be a non-empty string');
    }

    // Verify rule belongs to workspace
    const existingRule = await pb.collection('automation_rules').getOne(ruleId, { $autoCancel: false });
    if (existingRule.workspace_id !== workspaceId) {
      throw new Error('Rule does not belong to this workspace');
    }

    try {
      const rule = await pb.collection('automation_rules').update(ruleId, { enabled: true }, { $autoCancel: false });
      logger.info(`Automation rule enabled: ${ruleId}`);
      return rule;
    } catch (error) {
      logger.error('Error enabling automation rule:', error.message);
      throw error;
    }
  }

  /**
   * Disable an automation rule
   * @param {string} ruleId - Rule ID
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise<Object>} - Updated rule record
   */
  async disableRule(ruleId, workspaceId) {
    // Validate inputs
    if (!ruleId || typeof ruleId !== 'string') {
      throw new Error('Rule ID must be a non-empty string');
    }

    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new Error('Workspace ID must be a non-empty string');
    }

    // Verify rule belongs to workspace
    const existingRule = await pb.collection('automation_rules').getOne(ruleId, { $autoCancel: false });
    if (existingRule.workspace_id !== workspaceId) {
      throw new Error('Rule does not belong to this workspace');
    }

    try {
      const rule = await pb.collection('automation_rules').update(ruleId, { enabled: false }, { $autoCancel: false });
      logger.info(`Automation rule disabled: ${ruleId}`);
      return rule;
    } catch (error) {
      logger.error('Error disabling automation rule:', error.message);
      throw error;
    }
  }

  /**
   * Get all automation rules for a workspace
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise<Array>} - Array of automation rules
   */
  async getRulesByWorkspace(workspaceId) {
    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new Error('Workspace ID must be a non-empty string');
    }

    try {
      const rules = await pb.collection('automation_rules').getFullList({
        filter: `workspace_id="${workspaceId}"`,
        sort: '-created',
        $autoCancel: false,
      });

      return rules;
    } catch (error) {
      logger.error('Error getting rules by workspace:', error.message);
      throw error;
    }
  }

  /**
   * Get a single automation rule by ID
   * @param {string} ruleId - Rule ID
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise<Object|null>} - Rule object or null if not found
   */
  async getRuleById(ruleId, workspaceId) {
    if (!ruleId || typeof ruleId !== 'string') {
      throw new Error('Rule ID must be a non-empty string');
    }

    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new Error('Workspace ID must be a non-empty string');
    }

    try {
      const rule = await pb.collection('automation_rules').getOne(ruleId, { $autoCancel: false });

      // Validate workspace_id matches
      if (rule.workspace_id !== workspaceId) {
        return null;
      }

      return rule;
    } catch (error) {
      if (error.message.includes('Failed to find')) {
        return null;
      }
      logger.error('Error getting rule by ID:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
export const automationRuleService = new AutomationRuleService();

export default automationRuleService;
