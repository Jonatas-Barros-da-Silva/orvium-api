import express from 'express';
import { circuitBreakerService } from '../services/circuitBreakerService.js';
import { rateLimitingService } from '../services/rateLimitingService.js';
import { requirePermission } from '../middleware/permissionEngine.js';
import { marketplaceService } from '../services/marketplaceService.js';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /workspaces/:workspaceId/integrations/:integrationId/health
 * Get integration health status
 */
router.get('/:workspaceId/integrations/:integrationId/health', requirePermission('integration.read'), async (req, res) => {
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

  const health = await circuitBreakerService.getHealth(integrationId);

  if (!health) {
    return res.json({
      status: 'healthy',
      consecutive_failures: 0,
      disabled_at: null,
      disabled_reason: null,
    });
  }

  res.json({
    status: health.status,
    consecutive_failures: health.consecutive_failures,
    last_success_at: health.last_success_at,
    last_failure_at: health.last_failure_at,
    last_error_message: health.last_error_message,
    disabled_at: health.disabled_at,
    disabled_reason: health.disabled_reason,
  });
});

/**
 * GET /workspaces/:workspaceId/integrations/:integrationId/rate-limits
 * Get integration rate limits
 */
router.get('/:workspaceId/integrations/:integrationId/rate-limits', requirePermission('integration.read'), async (req, res) => {
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

  const limits = await rateLimitingService.getRateLimits(integrationId);

  res.json({
    max_requests_per_minute: limits.max_requests_per_minute,
    max_requests_per_hour: limits.max_requests_per_hour,
    max_requests_per_day: limits.max_requests_per_day,
  });
});

/**
 * PUT /workspaces/:workspaceId/integrations/:integrationId/rate-limits
 * Update integration rate limits
 * Requires integration.write permission
 */
router.put(
  '/:workspaceId/integrations/:integrationId/rate-limits',
  requirePermission('integration.write'),
  async (req, res) => {
    const { workspaceId, integrationId } = req.params;
    const { max_requests_per_minute, max_requests_per_hour, max_requests_per_day } = req.body;
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

    // Validate request body
    if (
      typeof max_requests_per_minute !== 'number' ||
      typeof max_requests_per_hour !== 'number' ||
      typeof max_requests_per_day !== 'number'
    ) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'max_requests_per_minute, max_requests_per_hour, and max_requests_per_day must be numbers',
      });
    }

    if (max_requests_per_minute < 1 || max_requests_per_hour < 1 || max_requests_per_day < 1) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'All rate limits must be positive numbers',
      });
    }

    const limits = await rateLimitingService.setRateLimits(integrationId, {
      max_requests_per_minute,
      max_requests_per_hour,
      max_requests_per_day,
    });

    logger.info(`Rate limits updated for integration ${integrationId}`);

    res.json({
      max_requests_per_minute: limits.max_requests_per_minute,
      max_requests_per_hour: limits.max_requests_per_hour,
      max_requests_per_day: limits.max_requests_per_day,
    });
  }
);

/**
 * POST /workspaces/:workspaceId/integrations/:integrationId/reset-circuit-breaker
 * Reset circuit breaker for integration
 * Requires integration.write permission
 */
router.post(
  '/:workspaceId/integrations/:integrationId/reset-circuit-breaker',
  requirePermission('integration.write'),
  async (req, res) => {
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

    const health = await circuitBreakerService.reset(integrationId);

    logger.info(`Circuit breaker reset for integration ${integrationId}`);

    res.json({
      status: health.status,
      consecutive_failures: health.consecutive_failures,
      disabled_at: health.disabled_at,
      disabled_reason: health.disabled_reason,
      message: 'Circuit breaker reset successfully',
    });
  }
);

export default router;
