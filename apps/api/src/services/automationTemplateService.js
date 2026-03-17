
import pb from '../utils/pocketbaseClient.js';
import { automationRuleService } from './automationRuleService.js';
import logger from '../utils/logger.js';

class AutomationTemplateService {
  /**
   * Get templates with optional filters
   * @param {Object} filters - category, event_type, is_active
   * @returns {Promise<Array>}
   */
  async getTemplates(filters = {}) {
    let filterString = 'is_active = true';
    
    if (filters.category) {
      filterString += ` && category = "${filters.category}"`;
    }
    if (filters.event_type) {
      filterString += ` && event_type = "${filters.event_type}"`;
    }
    if (filters.is_active !== undefined) {
      filterString = `is_active = ${filters.is_active}`;
    }

    const records = await pb.collection('automation_templates').getFullList({
      filter: filterString,
      sort: '-created',
      $autoCancel: false
    });

    return records;
  }

  /**
   * Get a single template by ID
   * @param {string} templateId 
   * @returns {Promise<Object|null>}
   */
  async getTemplateById(templateId) {
    try {
      const template = await pb.collection('automation_templates').getOne(templateId, {
        $autoCancel: false
      });
      return template;
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  /**
   * Install a template to a workspace
   * @param {string} templateId 
   * @param {string} workspaceId 
   * @param {string} ruleName 
   * @returns {Promise<Object>}
   */
  async installTemplate(templateId, workspaceId, ruleName) {
    const template = await this.getTemplateById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    if (!template.is_active) {
      throw new Error('Template is not active');
    }

    const finalRuleName = ruleName || template.name;

    const createdRule = await automationRuleService.createRule(
      workspaceId,
      finalRuleName,
      template.event_type,
      template.conditions_json || {},
      template.actions_json
    );

    logger.info(`Template ${templateId} installed to workspace ${workspaceId} as rule ${createdRule.id}`);
    return createdRule;
  }

  /**
   * Validate a template structure
   * @param {Object} template 
   * @returns {Object} {valid: boolean, errors: []}
   */
  validateTemplate(template) {
    const errors = [];
    if (!template.name) errors.push('Name is required');
    if (!template.description) errors.push('Description is required');
    if (!template.category) errors.push('Category is required');
    if (!template.event_type) errors.push('Event type is required');
    if (!template.actions_json || !Array.isArray(template.actions_json) || template.actions_json.length === 0) {
      errors.push('Actions JSON must be a non-empty array');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const automationTemplateService = new AutomationTemplateService();
export default automationTemplateService;
