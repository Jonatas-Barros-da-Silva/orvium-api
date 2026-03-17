
import 'dotenv/config';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

/**
 * Automation Rule Version Service
 * Manages version history for automation rules
 */
export class AutomationRuleVersionService {
  /**
   * Create a new version for a rule
   * @param {string} ruleId - Rule ID
   * @param {string} workspaceId - Workspace ID
   * @param {string} eventType - Event type
   * @param {Object} conditionsJson - Conditions object
   * @param {Array} actionsJson - Actions array
   * @returns {Promise<Object>} - Created version record
   */
  async createVersion(ruleId, workspaceId, eventType, conditionsJson, actionsJson) {
    try {
      const latestVersionNumber = await this.getLatestVersionNumber(ruleId);
      const newVersionNumber = latestVersionNumber + 1;

      const version = await pb.collection('automation_rule_versions').create({
        rule_id: ruleId,
        workspace_id: workspaceId,
        version_number: newVersionNumber,
        event_type: eventType,
        conditions_json: conditionsJson || {},
        actions_json: actionsJson || [],
      }, { $autoCancel: false });

      logger.info(`Created version ${newVersionNumber} for rule ${ruleId}`);
      return version;
    } catch (error) {
      logger.error(`Error creating version for rule ${ruleId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get the latest version number for a rule
   * @param {string} ruleId - Rule ID
   * @returns {Promise<number>} - Latest version number or 0
   */
  async getLatestVersionNumber(ruleId) {
    try {
      const result = await pb.collection('automation_rule_versions').getList(1, 1, {
        filter: `rule_id="${ruleId}"`,
        sort: '-version_number',
        $autoCancel: false,
      });

      if (result.items.length > 0) {
        return result.items[0].version_number;
      }
      return 0;
    } catch (error) {
      logger.error(`Error getting latest version number for rule ${ruleId}:`, error.message);
      return 0;
    }
  }

  /**
   * Get the latest version record for a rule
   * @param {string} ruleId - Rule ID
   * @returns {Promise<Object|null>} - Latest version record or null
   */
  async getLatestVersion(ruleId) {
    try {
      const result = await pb.collection('automation_rule_versions').getList(1, 1, {
        filter: `rule_id="${ruleId}"`,
        sort: '-version_number',
        $autoCancel: false,
      });

      if (result.items.length > 0) {
        return result.items[0];
      }
      return null;
    } catch (error) {
      logger.error(`Error getting latest version for rule ${ruleId}:`, error.message);
      return null;
    }
  }

  /**
   * Get a specific version by its number
   * @param {string} ruleId - Rule ID
   * @param {number} versionNumber - Version number
   * @returns {Promise<Object|null>} - Version record or null
   */
  async getVersionByNumber(ruleId, versionNumber) {
    try {
      const result = await pb.collection('automation_rule_versions').getList(1, 1, {
        filter: `rule_id="${ruleId}" && version_number=${versionNumber}`,
        $autoCancel: false,
      });

      if (result.items.length > 0) {
        return result.items[0];
      }
      return null;
    } catch (error) {
      logger.error(`Error getting version ${versionNumber} for rule ${ruleId}:`, error.message);
      return null;
    }
  }

  /**
   * Get all versions for a rule
   * @param {string} ruleId - Rule ID
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise<Array>} - Array of version records
   */
  async getRuleVersions(ruleId, workspaceId) {
    try {
      const versions = await pb.collection('automation_rule_versions').getFullList({
        filter: `rule_id="${ruleId}" && workspace_id="${workspaceId}"`,
        sort: '-version_number',
        $autoCancel: false,
      });

      return versions;
    } catch (error) {
      logger.error(`Error getting versions for rule ${ruleId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get a version by its ID
   * @param {string} versionId - Version ID
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise<Object|null>} - Version record or null
   */
  async getVersionById(versionId, workspaceId) {
    try {
      const version = await pb.collection('automation_rule_versions').getOne(versionId, {
        $autoCancel: false,
      });

      if (version.workspace_id !== workspaceId) {
        return null;
      }

      return version;
    } catch (error) {
      if (error.message.includes('Failed to find')) {
        return null;
      }
      logger.error(`Error getting version ${versionId}:`, error.message);
      throw error;
    }
  }
}

// Export singleton instance
export const automationRuleVersionService = new AutomationRuleVersionService();

export default automationRuleVersionService;
