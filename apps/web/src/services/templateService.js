
import apiServerClient from '@/lib/apiServerClient.js';

/**
 * Fetch automation templates with optional filters
 * @param {Object} filters - category, event_type
 * @returns {Promise<Array>} Array of templates
 */
export const fetchTemplates = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (filters.category && filters.category !== 'all') queryParams.append('category', filters.category);
    if (filters.event_type && filters.event_type !== 'all') queryParams.append('event_type', filters.event_type);

    const url = `/automation/templates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiServerClient.fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch templates');
    }
    
    const data = await response.json();
    return data.templates || [];
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
};

/**
 * Fetch a single template by ID
 * @param {string} templateId 
 * @returns {Promise<Object>} Template object
 */
export const fetchTemplateById = async (templateId) => {
  try {
    const response = await apiServerClient.fetch(`/automation/templates/${templateId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch template');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching template:', error);
    throw error;
  }
};

/**
 * Install a template
 * @param {string} templateId 
 * @param {string} ruleName 
 * @returns {Promise<Object>} Created rule
 */
export const installTemplate = async (templateId, ruleName) => {
  try {
    const response = await apiServerClient.fetch(`/automation/templates/${templateId}/install`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rule_name: ruleName }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to install template');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error installing template:', error);
    throw error;
  }
};
