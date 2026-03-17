
/**
 * Formats a single condition object into a readable string
 * @param {Object} condition - Condition object with field, operator, value
 * @returns {string} Readable condition string
 */
export const formatCondition = (condition) => {
  if (!condition || !condition.field || !condition.operator) {
    return '';
  }

  const operatorMap = {
    greater_than: '>',
    less_than: '<',
    equals: '=',
    contains: 'contains',
    not_equals: '≠',
    greater_than_or_equal: '≥',
    less_than_or_equal: '≤',
  };

  const fieldMap = {
    amount: 'Amount',
    professional_id: 'Professional ID',
    status: 'Status',
    field_exists: 'Field Exists',
    event_type: 'Event Type',
    organization_id: 'Organization ID',
  };

  const field = fieldMap[condition.field] || condition.field;
  const operator = operatorMap[condition.operator] || condition.operator;
  const value = condition.value || '';

  return `${field} ${operator} ${value}`;
};

/**
 * Formats an array of conditions into a readable string with AND logic
 * @param {Array} conditions - Array of condition objects
 * @returns {string} Readable conditions string
 */
export const formatConditions = (conditions) => {
  if (!conditions || conditions.length === 0) {
    return 'No conditions';
  }

  return conditions.map(formatCondition).filter(Boolean).join(' AND ');
};

/**
 * Converts UI inputs to a condition object
 * @param {string} field - Field name
 * @param {string} operator - Operator type
 * @param {string} value - Condition value
 * @returns {Object} Condition object
 */
export const parseConditionFromUI = (field, operator, value) => {
  return {
    field,
    operator,
    value,
  };
};

/**
 * Validates a condition object
 * @param {Object} condition - Condition to validate
 * @returns {boolean} True if valid
 */
export const validateCondition = (condition) => {
  return !!(condition.field && condition.operator && condition.value);
};
