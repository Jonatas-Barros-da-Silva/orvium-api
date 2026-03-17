
import 'dotenv/config';
import pb from '../../utils/pocketbaseClient.js';
import RuleConditionEvaluator from './ruleConditionEvaluator.js';
import AutomationActionExecutor from './automationActionExecutor.js';
import automationRuleVersionService from '../../services/automationRuleVersionService.js';
import integrationJobQueueService from '../../services/integrationJobQueueService.js';
import logger from '../../utils/logger.js';

/**
 * Automation Engine
 * Processes events and executes automation rules
 */
export class AutomationEngine {
  constructor() {
    this.ruleConditionEvaluator = new RuleConditionEvaluator();
    this.automationActionExecutor = new AutomationActionExecutor();
  }

  /**
   * Process an event and execute matching automation rules
   * @param {string} eventType - Event type
   * @param {Object} eventPayload - Event payload
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise<Object>} - {processed: number, executed: number, failed: number}
   */
  async processEvent(eventType, eventPayload, workspaceId) {
    if (!eventType || typeof eventType !== 'string') {
      logger.warn('Invalid event type in processEvent');
      return { processed: 0, executed: 0, failed: 0 };
    }

    if (!eventPayload || typeof eventPayload !== 'object') {
      logger.warn('Invalid event payload in processEvent');
      return { processed: 0, executed: 0, failed: 0 };
    }

    if (!workspaceId || typeof workspaceId !== 'string') {
      logger.warn('Invalid workspace ID in processEvent');
      return { processed: 0, executed: 0, failed: 0 };
    }

    try {
      // Query automation rules for this workspace and event type
      const rules = await pb.collection('automation_rules').getFullList({
        filter: `workspace_id="${workspaceId}" && event_type="${eventType}"`,
        $autoCancel: false,
      });

      if (rules.length === 0) {
        logger.debug(`No automation rules found for event type: ${eventType}`);
        return { processed: 0, executed: 0, failed: 0 };
      }

      let processed = 0;
      let executed = 0;
      let failed = 0;

      // Process each rule
      for (const rule of rules) {
        // Skip disabled rules
        if (!rule.enabled) {
          logger.debug(`Skipping disabled rule: ${rule.id}`);
          continue;
        }

        processed++;

        try {
          // Get the latest version of the rule
          const ruleVersion = await automationRuleVersionService.getLatestVersion(rule.id);
          
          if (!ruleVersion) {
            logger.warn(`No version found for rule ${rule.id}, skipping execution`);
            failed++;
            continue;
          }

          // Evaluate rule conditions using version data
          const conditionsMet = this.evaluateRule(ruleVersion, eventPayload);

          if (conditionsMet) {
            // Execute rule actions using version data
            const result = await this.executeRule(ruleVersion, eventType, eventPayload, workspaceId);
            if (result.success) {
              executed++;
            } else {
              failed++;
            }
          }
        } catch (error) {
          logger.error(`Error processing rule ${rule.id}:`, error.message);
          failed++;
        }
      }

      logger.info(`Automation processing complete: processed=${processed}, executed=${executed}, failed=${failed}`);

      return { processed, executed, failed };
    } catch (error) {
      logger.error('Error in processEvent:', error.message);
      return { processed: 0, executed: 0, failed: 0 };
    }
  }

  /**
   * Evaluate if a rule's conditions are met
   * @param {Object} ruleVersion - Automation rule version record
   * @param {Object} eventPayload - Event payload
   * @returns {boolean} - True if conditions are met
   */
  evaluateRule(ruleVersion, eventPayload) {
    if (!ruleVersion || typeof ruleVersion !== 'object') {
      logger.warn('Invalid rule version object in evaluateRule');
      return false;
    }

    if (!eventPayload || typeof eventPayload !== 'object') {
      logger.warn('Invalid event payload in evaluateRule');
      return false;
    }

    try {
      // Parse conditions JSON if it's a string
      let conditions = ruleVersion.conditions_json;
      if (typeof conditions === 'string') {
        conditions = JSON.parse(conditions);
      }

      // Evaluate conditions
      return this.ruleConditionEvaluator.evaluateConditions(conditions, eventPayload);
    } catch (error) {
      logger.error(`Error evaluating rule version ${ruleVersion.id}:`, error.message);
      return false;
    }
  }

  /**
   * Execute a rule's actions
   * @param {Object} ruleVersion - Automation rule version record
   * @param {string} eventType - Event type
   * @param {Object} eventPayload - Event payload
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise<Object>} - {success: boolean, executionTime: number, results: []}
   */
  async executeRule(ruleVersion, eventType, eventPayload, workspaceId) {
    if (!ruleVersion || typeof ruleVersion !== 'object') {
      logger.warn('Invalid rule version object in executeRule');
      return { success: false, executionTime: 0, results: [] };
    }

    const startTime = Date.now();

    try {
      // Parse actions JSON if it's a string
      let actions = ruleVersion.actions_json;
      if (typeof actions === 'string') {
        actions = JSON.parse(actions);
      }

      if (!Array.isArray(actions)) {
        logger.warn(`Invalid actions format for rule version ${ruleVersion.id}`);
        return { success: false, executionTime: 0, results: [] };
      }

      // Execute actions (now uses job queue for integrations)
      const actionResults = await this.automationActionExecutor.executeActions(
        actions,
        eventType,
        eventPayload,
        workspaceId,
        ruleVersion.rule_id
      );

      const executionTime = Date.now() - startTime;
      const success = actionResults.failed === 0;

      // Log execution
      await this.logAutomationExecution(
        workspaceId,
        ruleVersion.rule_id,
        ruleVersion.id,
        eventType,
        success ? 'success' : 'partial_failure',
        executionTime,
        null,
        actionResults.results
      );

      return {
        success,
        executionTime,
        results: actionResults.results,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(`Error executing rule version ${ruleVersion.id}:`, error.message);

      // Log execution failure
      await this.logAutomationExecution(
        workspaceId,
        ruleVersion.rule_id,
        ruleVersion.id,
        eventType,
        'failed',
        executionTime,
        error.message,
        []
      );

      return { success: false, executionTime, results: [] };
    }
  }

  /**
   * Execute integration action (queues job instead of direct dispatch)
   * @param {Object} action - Action configuration
   * @param {string} eventType - Event type
   * @param {Object} eventPayload - Event payload
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise<Object>} - {success: boolean, jobId: string, queued: boolean}
   */
  async executeIntegrationAction(action, eventType, eventPayload, workspaceId) {
    if (!action || typeof action !== 'object') {
      throw new Error('Action must be a non-empty object');
    }

    if (!eventType || typeof eventType !== 'string') {
      throw new Error('Event type must be a non-empty string');
    }

    if (!eventPayload || typeof eventPayload !== 'object') {
      throw new Error('Event payload must be a non-empty object');
    }

    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new Error('Workspace ID must be a non-empty string');
    }

    try {
      const integrationId = action.integrationId || action.workspace_integration_id;
      const adapterType = action.adapterType || action.adapter_type;

      if (!integrationId) {
        throw new Error('Integration ID is required for integration action');
      }

      if (!adapterType) {
        throw new Error('Adapter type is required for integration action');
      }

      // Prepare payload for job queue
      const jobPayload = {
        eventType,
        eventData: eventPayload,
        ...action.payload,
      };

      // Enqueue job instead of direct dispatch
      const job = await integrationJobQueueService.enqueueJob(
        workspaceId,
        integrationId,
        adapterType,
        jobPayload
      );

      logger.info(`Integration action queued: ${job.job_id} for workspace ${workspaceId}`);

      return {
        success: true,
        jobId: job.job_id,
        queued: true,
      };
    } catch (error) {
      logger.error('Failed to queue integration action:', error.message);
      throw error;
    }
  }

  /**
   * Log automation rule execution
   * @param {string} workspaceId - Workspace ID
   * @param {string} ruleId - Rule ID
   * @param {string} ruleVersionId - Rule Version ID
   * @param {string} eventType - Event type
   * @param {string} status - Execution status ('success', 'failed', 'partial_failure')
   * @param {number} executionTime - Execution time in milliseconds
   * @param {string|null} errorMessage - Error message if failed
   * @param {Array} actionResults - Array of action execution results
   * @returns {Promise<Object>} - Created log entry
   */
  async logAutomationExecution(
    workspaceId,
    ruleId,
    ruleVersionId,
    eventType,
    status,
    executionTime,
    errorMessage,
    actionResults
  ) {
    try {
      const logEntry = await pb.collection('automation_logs').create({
        workspace_id: workspaceId,
        rule_id: ruleId,
        rule_version_id: ruleVersionId,
        event_type: eventType,
        status,
        execution_time_ms: executionTime,
        error_message: errorMessage || null,
        action_results: JSON.stringify(actionResults),
      }, { $autoCancel: false });

      return logEntry;
    } catch (error) {
      logger.error('Failed to log automation execution:', error.message);
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
export const automationEngine = new AutomationEngine();

export default automationEngine;
