
import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import { automationRuleService } from '../services/automationRuleService.js';
import automationRuleVersionService from '../services/automationRuleVersionService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /automations/rules - List automation rules
 */
router.get('/', async (req, res) => {
  const { event_type, enabled } = req.query;
  const workspaceId = req.auth?.organization_id;

  if (!workspaceId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'workspace_id is required',
    });
  }

  let filter = `workspace_id="${workspaceId}"`;

  if (event_type) {
    filter += ` && event_type="${event_type}"`;
  }

  if (enabled !== undefined) {
    const enabledBool = enabled === 'true';
    filter += ` && enabled=${enabledBool}`;
  }

  const rules = await pb.collection('automation_rules').getFullList({
    filter,
    sort: '-created',
    $autoCancel: false,
  });

  res.json({
    rules: rules.map(rule => ({
      id: rule.id,
      name: rule.name,
      event_type: rule.event_type,
      conditions_json: rule.conditions_json,
      actions_json: rule.actions_json,
      enabled: rule.enabled,
      created_at: rule.created,
      updated_at: rule.updated,
    })),
    total: rules.length,
  });
});

/**
 * GET /automations/rules/:id - Get single automation rule
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const workspaceId = req.auth?.organization_id;

  if (!workspaceId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'workspace_id is required',
    });
  }

  try {
    const rule = await pb.collection('automation_rules').getOne(id, { $autoCancel: false });

    if (rule.workspace_id !== workspaceId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Rule does not belong to this workspace',
      });
    }

    res.json({
      id: rule.id,
      name: rule.name,
      event_type: rule.event_type,
      conditions_json: rule.conditions_json,
      actions_json: rule.actions_json,
      enabled: rule.enabled,
      created_at: rule.created,
      updated_at: rule.updated,
    });
  } catch (error) {
    return res.status(404).json({ error: 'Not Found', message: 'Rule not found' });
  }
});

/**
 * GET /automations/rules/:id/versions - Get rule versions
 */
router.get('/:id/versions', async (req, res) => {
  const { id } = req.params;
  const workspaceId = req.auth?.organization_id;

  if (!workspaceId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'workspace_id is required',
    });
  }

  try {
    const rule = await pb.collection('automation_rules').getOne(id, { $autoCancel: false });

    if (rule.workspace_id !== workspaceId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Rule does not belong to this workspace',
      });
    }

    const versions = await automationRuleVersionService.getRuleVersions(id, workspaceId);

    res.json({
      versions: versions.map(v => ({
        id: v.id,
        version_number: v.version_number,
        event_type: v.event_type,
        conditions_json: v.conditions_json,
        actions_json: v.actions_json,
        created_at: v.created,
      })),
      total: versions.length,
    });
  } catch (error) {
    return res.status(404).json({ error: 'Not Found', message: 'Rule not found' });
  }
});

/**
 * POST /automations/rules/:id/rollback - Rollback rule to a specific version
 */
router.post('/:id/rollback', async (req, res) => {
  const { id } = req.params;
  const { version_number } = req.body;
  const workspaceId = req.auth?.organization_id;

  if (!workspaceId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'workspace_id is required',
    });
  }

  if (!version_number) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'version_number is required',
    });
  }

  try {
    const rule = await pb.collection('automation_rules').getOne(id, { $autoCancel: false });

    if (rule.workspace_id !== workspaceId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Rule does not belong to this workspace',
      });
    }

    const version = await automationRuleVersionService.getVersionByNumber(id, version_number);

    if (!version) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Version ${version_number} not found`,
      });
    }

    // Create a new version based on the old one
    const newVersion = await automationRuleVersionService.createVersion(
      id,
      workspaceId,
      version.event_type,
      version.conditions_json,
      version.actions_json
    );

    // Update the rule with the rolled-back configuration
    await pb.collection('automation_rules').update(id, {
      event_type: version.event_type,
      conditions_json: version.conditions_json,
      actions_json: version.actions_json,
    }, { $autoCancel: false });

    res.json({
      success: true,
      newVersion: newVersion.version_number,
    });
  } catch (error) {
    logger.error(`Rollback error for rule ${id}:`, error.message);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

/**
 * POST /automations/rules - Create new automation rule
 */
router.post('/', async (req, res) => {
  const { name, event_type, conditions_json, actions_json } = req.body;
  const workspaceId = req.auth?.organization_id;

  if (!workspaceId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'workspace_id is required',
    });
  }

  // Validate required fields
  if (!name || typeof name !== 'string') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'name is required and must be a string',
    });
  }

  if (!event_type || typeof event_type !== 'string') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'event_type is required and must be a string',
    });
  }

  if (!actions_json || !Array.isArray(actions_json)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'actions_json is required and must be an array',
    });
  }

  try {
    const rule = await automationRuleService.createRule(
      workspaceId,
      name,
      event_type,
      conditions_json || {},
      actions_json
    );

    res.status(201).json({
      id: rule.id,
      name: rule.name,
      event_type: rule.event_type,
      conditions_json: rule.conditions_json,
      actions_json: rule.actions_json,
      enabled: rule.enabled,
      created_at: rule.created,
      updated_at: rule.updated,
      current_version: rule.current_version,
    });
  } catch (error) {
    res.status(400).json({ error: 'Bad Request', message: error.message });
  }
});

/**
 * PUT /automations/rules/:id - Update automation rule
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, event_type, conditions_json, actions_json, enabled } = req.body;
  const workspaceId = req.auth?.organization_id;

  if (!workspaceId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'workspace_id is required',
    });
  }

  try {
    // Verify rule belongs to workspace
    const existingRule = await pb.collection('automation_rules').getOne(id, { $autoCancel: false });
    if (existingRule.workspace_id !== workspaceId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Rule does not belong to this workspace',
      });
    }

    const rule = await automationRuleService.updateRule(
      id,
      workspaceId,
      name,
      event_type,
      conditions_json,
      actions_json,
      enabled
    );

    res.json({
      id: rule.id,
      name: rule.name,
      event_type: rule.event_type,
      conditions_json: rule.conditions_json,
      actions_json: rule.actions_json,
      enabled: rule.enabled,
      created_at: rule.created,
      updated_at: rule.updated,
      current_version: rule.current_version,
    });
  } catch (error) {
    res.status(400).json({ error: 'Bad Request', message: error.message });
  }
});

/**
 * DELETE /automations/rules/:id - Delete automation rule
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const workspaceId = req.auth?.organization_id;

  if (!workspaceId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'workspace_id is required',
    });
  }

  try {
    // Verify rule belongs to workspace
    const existingRule = await pb.collection('automation_rules').getOne(id, { $autoCancel: false });
    if (existingRule.workspace_id !== workspaceId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Rule does not belong to this workspace',
      });
    }

    await automationRuleService.deleteRule(id, workspaceId);

    res.json({
      success: true,
      message: 'Rule deleted successfully',
    });
  } catch (error) {
    res.status(400).json({ error: 'Bad Request', message: error.message });
  }
});

/**
 * POST /automations/rules/:id/enable - Enable automation rule
 */
router.post('/:id/enable', async (req, res) => {
  const { id } = req.params;
  const workspaceId = req.auth?.organization_id;

  if (!workspaceId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'workspace_id is required',
    });
  }

  try {
    // Verify rule belongs to workspace
    const existingRule = await pb.collection('automation_rules').getOne(id, { $autoCancel: false });
    if (existingRule.workspace_id !== workspaceId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Rule does not belong to this workspace',
      });
    }

    const rule = await automationRuleService.enableRule(id, workspaceId);

    res.json({
      id: rule.id,
      name: rule.name,
      event_type: rule.event_type,
      enabled: rule.enabled,
      created_at: rule.created,
      updated_at: rule.updated,
    });
  } catch (error) {
    res.status(400).json({ error: 'Bad Request', message: error.message });
  }
});

/**
 * POST /automations/rules/:id/disable - Disable automation rule
 */
router.post('/:id/disable', async (req, res) => {
  const { id } = req.params;
  const workspaceId = req.auth?.organization_id;

  if (!workspaceId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'workspace_id is required',
    });
  }

  try {
    // Verify rule belongs to workspace
    const existingRule = await pb.collection('automation_rules').getOne(id, { $autoCancel: false });
    if (existingRule.workspace_id !== workspaceId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Rule does not belong to this workspace',
      });
    }

    const rule = await automationRuleService.disableRule(id, workspaceId);

    res.json({
      id: rule.id,
      name: rule.name,
      event_type: rule.event_type,
      enabled: rule.enabled,
      created_at: rule.created,
      updated_at: rule.updated,
    });
  } catch (error) {
    res.status(400).json({ error: 'Bad Request', message: error.message });
  }
});

export default router;
