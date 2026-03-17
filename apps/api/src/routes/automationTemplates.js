
import express from 'express';
import { automationTemplateService } from '../services/automationTemplateService.js';

const router = express.Router();

/**
 * GET /automation/templates
 * Fetch all active templates with optional filters
 */
router.get('/', async (req, res) => {
  const { category, event_type } = req.query;
  
  const templates = await automationTemplateService.getTemplates({
    category,
    event_type,
    is_active: true
  });

  res.json({
    templates,
    total: templates.length
  });
});

/**
 * GET /automation/templates/:id
 * Fetch a single template by ID
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  const template = await automationTemplateService.getTemplateById(id);
  
  if (!template || !template.is_active) {
    const error = new Error('Template not found or inactive');
    error.status = 404;
    throw error;
  }

  res.json(template);
});

/**
 * POST /automation/templates/:id/install
 * Install a template to the user's workspace
 */
router.post('/:id/install', async (req, res) => {
  const { id } = req.params;
  const { rule_name } = req.body;
  const workspaceId = req.auth?.organization_id;

  if (!workspaceId) {
    const error = new Error('Unauthorized: workspace_id is required');
    error.status = 401;
    throw error;
  }

  const createdRule = await automationTemplateService.installTemplate(id, workspaceId, rule_name);
  
  res.status(201).json(createdRule);
});

export default router;
