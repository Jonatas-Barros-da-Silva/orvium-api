import { Router } from 'express';
import pb from '../utils/pocketbaseClient.js';
import { integrationConfigService } from '../services/integrationConfigService.js';
import { adapterRegistry } from '../integrations/index.js';
import { requirePermission } from '../middleware/permissionEngine.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * GET /integrations/configs - List integration configurations
 */
router.get('/', requirePermission('integration.config.read'), async (req, res) => {
  const { adapter_name, enabled } = req.query;
  const workspaceId = req.workspaceId;

  if (!workspaceId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'workspace_id is required',
    });
  }

  let filter = `workspace_id="${workspaceId}"`;

  if (adapter_name) {
    filter += ` && adapter_name="${adapter_name}"`;
  }

  if (enabled !== undefined) {
    const enabledBool = enabled === 'true';
    filter += ` && enabled=${enabledBool}`;
  }

  try {
    const configs = await pb.collection('integration_configs').getFullList({
      filter,
      sort: '-created',
      $autoCancel: false,
    });

    res.json({
      configs: configs.map(config => ({
        id: config.id,
        adapter_name: config.adapter_name,
        enabled: config.enabled,
        config_json: config.config_json,
        created_at: config.created,
        updated_at: config.updated,
      })),
      total: configs.length,
    });
  } catch (error) {
    logger.error('Error fetching integration configs:', error.message);
    throw error;
  }
});

/**
 * GET /integrations/configs/:id - Get single integration configuration
 */
router.get('/:id', requirePermission('integration.config.read'), async (req, res) => {
  const { id } = req.params;
  const workspaceId = req.workspaceId;

  if (!workspaceId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'workspace_id is required',
    });
  }

  try {
    const config = await pb.collection('integration_configs').getOne(id, {
      $autoCancel: false,
    });

    if (config.workspace_id !== workspaceId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Configuration does not belong to this workspace',
      });
    }

    res.json({
      id: config.id,
      adapter_name: config.adapter_name,
      enabled: config.enabled,
      config_json: config.config_json,
      created_at: config.created,
      updated_at: config.updated,
    });
  } catch (error) {
    if (error.message.includes('Failed to find')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Configuration not found',
      });
    }
    logger.error('Error fetching integration config:', error.message);
    throw error;
  }
});

/**
 * POST /integrations/configs - Create new integration configuration
 */
router.post('/', requirePermission('integration.config.write'), async (req, res) => {
  const { adapter_name, enabled, config_json } = req.body;
  const workspaceId = req.workspaceId;

  if (!workspaceId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'workspace_id is required',
    });
  }

  // Validate required fields
  if (!adapter_name || typeof adapter_name !== 'string') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'adapter_name is required and must be a string',
    });
  }

  if (typeof enabled !== 'boolean') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'enabled is required and must be a boolean',
    });
  }

  if (!config_json || typeof config_json !== 'object') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'config_json is required and must be a valid JSON object',
    });
  }

  // Validate adapter exists in registry
  const adapter = adapterRegistry.getAdapterByName(adapter_name);
  if (!adapter) {
    return res.status(400).json({
      error: 'Bad Request',
      message: `Invalid adapter_name. Adapter '${adapter_name}' not found`,
    });
  }

  try {
    const config = await integrationConfigService.createIntegrationConfig(
      workspaceId,
      adapter_name,
      enabled,
      config_json
    );

    res.status(201).json({
      id: config.id,
      adapter_name: config.adapter_name,
      enabled: config.enabled,
      config_json: config.config_json,
      created_at: config.created,
      updated_at: config.updated,
    });
  } catch (error) {
    logger.error('Error creating integration config:', error.message);
    throw error;
  }
});

/**
 * PUT /integrations/configs/:id - Update integration configuration
 */
router.put('/:id', requirePermission('integration.config.write'), async (req, res) => {
  const { id } = req.params;
  const { enabled, config_json } = req.body;
  const workspaceId = req.workspaceId;

  if (!workspaceId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'workspace_id is required',
    });
  }

  // Validate required fields
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'enabled is required and must be a boolean',
    });
  }

  if (!config_json || typeof config_json !== 'object') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'config_json is required and must be a valid JSON object',
    });
  }

  try {
    // Verify config belongs to workspace
    const existingConfig = await pb.collection('integration_configs').getOne(id, {
      $autoCancel: false,
    });

    if (existingConfig.workspace_id !== workspaceId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Configuration does not belong to this workspace',
      });
    }

    const config = await integrationConfigService.updateIntegrationConfig(id, enabled, config_json);

    res.json({
      id: config.id,
      adapter_name: config.adapter_name,
      enabled: config.enabled,
      config_json: config.config_json,
      created_at: config.created,
      updated_at: config.updated,
    });
  } catch (error) {
    if (error.message.includes('Failed to find')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Configuration not found',
      });
    }
    logger.error('Error updating integration config:', error.message);
    throw error;
  }
});

/**
 * DELETE /integrations/configs/:id - Delete integration configuration
 */
router.delete('/:id', requirePermission('integration.config.write'), async (req, res) => {
  const { id } = req.params;
  const workspaceId = req.workspaceId;

  if (!workspaceId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'workspace_id is required',
    });
  }

  try {
    // Verify config belongs to workspace
    const existingConfig = await pb.collection('integration_configs').getOne(id, {
      $autoCancel: false,
    });

    if (existingConfig.workspace_id !== workspaceId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Configuration does not belong to this workspace',
      });
    }

    await integrationConfigService.deleteIntegrationConfig(id);

    res.json({
      success: true,
      message: 'Configuration deleted successfully',
    });
  } catch (error) {
    if (error.message.includes('Failed to find')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Configuration not found',
      });
    }
    logger.error('Error deleting integration config:', error.message);
    throw error;
  }
});

export default router;
