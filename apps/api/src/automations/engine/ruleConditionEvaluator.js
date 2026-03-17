import logger from '../../utils/logger.js';

/**
 * Rule Condition Evaluator
 * Evaluates automation rule conditions against event payloads
 */
export class RuleConditionEvaluator {
  /**
   * Evaluate all conditions against event payload
   * Returns true if conditions are null/empty or all conditions pass
   * Returns false if any condition fails
   * @param {Object|null} conditions - Conditions object with key-value pairs
   * @param {Object} eventPayload - Event payload to evaluate against
   * @returns {boolean} - True if all conditions pass or no conditions
   */
  evaluateConditions(conditions, eventPayload) {
    // If no conditions or empty conditions, return true (allow all)
    if (!conditions || typeof conditions !== 'object' || Object.keys(conditions).length === 0) {
      return true;
    }

    if (!eventPayload || typeof eventPayload !== 'object') {
      logger.warn('Invalid event payload provided to evaluateConditions');
      return false;
    }

    // Evaluate each condition
    for (const [conditionKey, conditionValue] of Object.entries(conditions)) {
      const result = this.evaluateCondition(conditionKey, conditionValue, eventPayload);
      if (!result) {
        logger.debug(`Condition failed: ${conditionKey}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate a single condition
   * Supports condition types: amount_greater_than, amount_less_than, amount_equals,
   * professional_id, status_equals, contains_field
   * @param {string} conditionKey - Condition type key
   * @param {*} conditionValue - Condition value to compare
   * @param {Object} eventPayload - Event payload to evaluate
   * @returns {boolean} - True if condition passes
   */
  evaluateCondition(conditionKey, conditionValue, eventPayload) {
    if (!conditionKey || typeof conditionKey !== 'string') {
      logger.warn('Invalid condition key');
      return false;
    }

    if (!eventPayload || typeof eventPayload !== 'object') {
      logger.warn('Invalid event payload in evaluateCondition');
      return false;
    }

    try {
      switch (conditionKey) {
        case 'amount_greater_than':
          if (typeof eventPayload.amount !== 'number') {
            logger.debug('amount_greater_than: eventPayload.amount is not a number');
            return false;
          }
          return eventPayload.amount > conditionValue;

        case 'amount_less_than':
          if (typeof eventPayload.amount !== 'number') {
            logger.debug('amount_less_than: eventPayload.amount is not a number');
            return false;
          }
          return eventPayload.amount < conditionValue;

        case 'amount_equals':
          if (typeof eventPayload.amount !== 'number') {
            logger.debug('amount_equals: eventPayload.amount is not a number');
            return false;
          }
          return eventPayload.amount === conditionValue;

        case 'professional_id':
          return eventPayload.professional_id === conditionValue;

        case 'status_equals':
          return eventPayload.status === conditionValue;

        case 'contains_field':
          // Check if field exists and is truthy in eventPayload
          return !!eventPayload[conditionValue];

        default:
          logger.warn(`Unknown condition type: ${conditionKey}`);
          return false;
      }
    } catch (error) {
      logger.error(`Error evaluating condition ${conditionKey}:`, error.message);
      return false;
    }
  }

  /**
   * Validate conditions schema
   * Checks that all condition keys are supported types
   * @param {Object} conditions - Conditions object to validate
   * @returns {Object} - {valid: boolean, errors: []}
   */
  validateConditionsSchema(conditions) {
    const errors = [];

    // If conditions is null or empty, it's valid
    if (!conditions || typeof conditions !== 'object') {
      return { valid: true, errors: [] };
    }

    const supportedConditionTypes = [
      'amount_greater_than',
      'amount_less_than',
      'amount_equals',
      'professional_id',
      'status_equals',
      'contains_field',
    ];

    for (const conditionKey of Object.keys(conditions)) {
      if (!supportedConditionTypes.includes(conditionKey)) {
        errors.push(`Unsupported condition type: ${conditionKey}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default RuleConditionEvaluator;
