import express from 'express';
import { marketplaceService } from '../services/marketplaceService.js';
import { requirePermission } from '../middleware/permissionEngine.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /workspaces/:workspaceId/integrations - List workspace integrations
 * Requires integration.read permission
 */
router.get('/:workspaceId/integrations', requirePermission('integration.read'), async (req, res) => {
  const { workspaceId } = req.params;
  const authWorkspaceId = req.auth?.organization_id;

  // Validate UUID format
  if (!marketplaceService.validateUUID(workspaceId)) {
    const err = new Error('Invalid workspace ID format');
    err.status = 400;
    throw err;
  }

  if (!authWorkspaceId) {
    const err = new Error('Workspace ID is required');
    err.status = 401;
    throw err;
  }

  if (workspaceId !== authWorkspaceId) {
    const err = new Error('Unauthorized');
    err.status = 403;
    throw err;
  }

  const integrations = await marketplaceService.getWorkspaceIntegrations(workspaceId);

  res.json({
    integrations,
    total: integrations.length,
  });
});

/**
 * GET /workspaces/:workspaceId/integrations/:integrationId - Get single integration
 * Requires integration.read permission
 */
router.get('/:workspaceId/integrations/:integrationId', requirePermission('integration.read'), async (req, res) => {
  const { workspaceId, integrationId } = req.params;
  const authWorkspaceId = req.auth?.organization_id;

  // Validate UUID formats
  if (!marketplaceService.validateUUID(workspaceId)) {
    const err = new Error('Invalid workspace ID format');
    err.status = 400;
    throw err;
  }

  if (!marketplaceService.validateUUID(integrationId)) {
    const err = new Error('Invalid integration ID format');
    err.status = 400;
    throw err;
  }

  if (!authWorkspaceId) {
    const err = new Error('Workspace ID is required');
    err.status = 401;
    throw err;
  }

  if (workspaceId !== authWorkspaceId) {
    const err = new Error('Unauthorized');
    err.status = 403;
    throw err;
  }

  const integration = await marketplaceService.getWorkspaceIntegration(workspaceId, integrationId);

  res.json(integration);
});

/**
 * POST /workspaces/:workspaceId/integrations/install - Install integration
 * Body: {appId, versionId, config}
 * Requires integration.write permission
 */
router.post('/:workspaceId/integrations/install', requirePermission('integration.write'), async (req, res) => {
  const { workspaceId } = req.params;
  const { appId, versionId, config } = req.body;
  const authWorkspaceId = req.auth?.organization_id;
  const userId = req.auth?.id;

  // Validate UUID format
  if (!marketplaceService.validateUUID(workspaceId)) {
    const err = new Error('Invalid workspace ID format');
    err.status = 400;
    throw err;
  }

  if (!authWorkspaceId) {
    const err = new Error('Workspace ID is required');
    err.status = 401;
    throw err;
  }

  if (workspaceId !== authWorkspaceId) {
    const err = new Error('Unauthorized');
    err.status = 403;
    throw err;
  }

  if (!appId || typeof appId !== 'string') {
    const err = new Error('appId is required and must be a string');
    err.status = 400;
    throw err;
  }

  if (!marketplaceService.validateUUID(appId)) {
    const err = new Error('Invalid app ID format');
    err.status = 400;
    throw err;
  }

  if (!versionId || typeof versionId !== 'string') {
    const err = new Error('versionId is required and must be a string');
    err.status = 400;
    throw err;
  }

  if (!marketplaceService.validateUUID(versionId)) {
    const err = new Error('Invalid version ID format');
    err.status = 400;
    throw err;
  }

  if (!config || typeof config !== 'object') {
    const err = new Error('config is required and must be an object');
    err.status = 400;
    throw err;
  }

  const integration = await marketplaceService.installIntegration(
    workspaceId,
    appId,
    versionId,
    config,
    userId
  );

  res.status(201).json(integration);
});

/**
 * PUT /workspaces/:workspaceId/integrations/:integrationId - Update integration config
 * Body: {config}
 * Requires integration.write permission
 */
router.put('/:workspaceId/integrations/:integrationId', requirePermission('integration.write'), async (req, res) => {
  const { workspaceId, integrationId } = req.params;
  const { config } = req.body;
  const authWorkspaceId = req.auth?.organization_id;

  // Validate UUID formats
  if (!marketplaceService.validateUUID(workspaceId)) {
    const err = new Error('Invalid workspace ID format');
    err.status = 400;
    throw err;
  }

  if (!marketplaceService.validateUUID(integrationId)) {
    const err = new Error('Invalid integration ID format');
    err.status = 400;
    throw err;
  }

  if (!authWorkspaceId) {
    const err = new Error('Workspace ID is required');
    err.status = 401;
    throw err;
  }

  if (workspaceId !== authWorkspaceId) {
    const err = new Error('Unauthorized');
    err.status = 403;
    throw err;
  }

  if (!config || typeof config !== 'object') {
    const err = new Error('config is required and must be an object');
    err.status = 400;
    throw err;
  }

  const integration = await marketplaceService.updateIntegrationConfig(workspaceId, integrationId, config);

  res.json(integration);
});

/**
 * POST /workspaces/:workspaceId/integrations/:integrationId/disable - Disable integration
 * Requires integration.write permission
 */
router.post('/:workspaceId/integrations/:integrationId/disable', requirePermission('integration.write'), async (req, res) => {
  const { workspaceId, integrationId } = req.params;
  const authWorkspaceId = req.auth?.organization_id;
  const userId = req.auth?.id;

  // Validate UUID formats
  if (!marketplaceService.validateUUID(workspaceId)) {
    const err = new Error('Invalid workspace ID format');
    err.status = 400;
    throw err;
  }

  if (!marketplaceService.validateUUID(integrationId)) {
    const err = new Error('Invalid integration ID format');
    err.status = 400;
    throw err;
  }

  if (!authWorkspaceId) {
    const err = new Error('Workspace ID is required');
    err.status = 401;
    throw err;
  }

  if (workspaceId !== authWorkspaceId) {
    const err = new Error('Unauthorized');
    err.status = 403;
    throw err;
  }

  const integration = await marketplaceService.disableIntegration(workspaceId, integrationId, userId);

  res.json(integration);
});

/**
 * POST /workspaces/:workspaceId/integrations/:integrationId/enable - Enable integration
 * Requires integration.write permission
 */
router.post('/:workspaceId/integrations/:integrationId/enable', requirePermission('integration.write'), async (req, res) => {
  const { workspaceId, integrationId } = req.params;
  const authWorkspaceId = req.auth?.organization_id;
  const userId = req.auth?.id;

  // Validate UUID formats
  if (!marketplaceService.validateUUID(workspaceId)) {
    const err = new Error('Invalid workspace ID format');
    err.status = 400;
    throw err;
  }

  if (!marketplaceService.validateUUID(integrationId)) {
    const err = new Error('Invalid integration ID format');
    err.status = 400;
    throw err;
  }

  if (!authWorkspaceId) {
    const err = new Error('Workspace ID is required');
    err.status = 401;
    throw err;
  }

  if (workspaceId !== authWorkspaceId) {
    const err = new Error('Unauthorized');
    err.status = 403;
    throw err;
  }

  const integration = await marketplaceService.enableIntegration(workspaceId, integrationId, userId);

  res.json(integration);
});

/**
 * DELETE /workspaces/:workspaceId/integrations/:integrationId - Remove integration
 * Requires integration.write permission
 */
router.delete('/:workspaceId/integrations/:integrationId', requirePermission('integration.write'), async (req, res) => {
  const { workspaceId, integrationId } = req.params;
  const authWorkspaceId = req.auth?.organization_id;
  const userId = req.auth?.id;

  // Validate UUID formats
  if (!marketplaceService.validateUUID(workspaceId)) {
    const err = new Error('Invalid workspace ID format');
    err.status = 400;
    throw err;
  }

  if (!marketplaceService.validateUUID(integrationId)) {
    const err = new Error('Invalid integration ID format');
    err.status = 400;
    throw err;
  }

  if (!authWorkspaceId) {
    const err = new Error('Workspace ID is required');
    err.status = 401;
    throw err;
  }

  if (workspaceId !== authWorkspaceId) {
    const err = new Error('Unauthorized');
    err.status = 403;
    throw err;
  }

  await marketplaceService.removeIntegration(workspaceId, integrationId, userId);

  res.json({
    success: true,
  });
});

export default router;
