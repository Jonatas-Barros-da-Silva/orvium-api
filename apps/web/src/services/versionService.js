
import apiServerClient from '@/lib/apiServerClient.js';

/**
 * Fetch all versions for a specific automation rule
 * @param {string} ruleId - Rule ID
 * @returns {Promise<Array>} Array of rule versions
 */
export const fetchRuleVersions = async (ruleId) => {
  try {
    const response = await apiServerClient.fetch(`/automations/rules/${ruleId}/versions`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch rule versions');
    }
    const data = await response.json();
    return data.versions || [];
  } catch (error) {
    console.error('Error fetching rule versions:', error);
    throw error;
  }
};

/**
 * Rollback an automation rule to a specific version
 * @param {string} ruleId - Rule ID
 * @param {number} versionNumber - Version number to rollback to
 * @returns {Promise<Object>} Success response with new version number
 */
export const rollbackRule = async (ruleId, versionNumber) => {
  try {
    const response = await apiServerClient.fetch(`/automations/rules/${ruleId}/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version_number: versionNumber }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to rollback rule');
    }
    return await response.json();
  } catch (error) {
    console.error('Error rolling back rule:', error);
    throw error;
  }
};
