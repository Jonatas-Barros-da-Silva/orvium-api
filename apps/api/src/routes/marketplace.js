import express from 'express';
import { marketplaceService } from '../services/marketplaceService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /marketplace/apps - List marketplace apps
 * Query params: category (optional), status (optional)
 * No authentication required
 */
router.get('/apps', async (req, res) => {
  const { category, status } = req.query;

  const filters = {};
  if (category) filters.category = category;
  if (status) filters.status = status;

  const result = await marketplaceService.getMarketplaceApps(filters);

  res.json(result);
});

/**
 * GET /marketplace/apps/:appId - Get single app with all versions
 * No authentication required
 */
router.get('/apps/:appId', async (req, res) => {
  const { appId } = req.params;

  // Validate UUID format
  if (!marketplaceService.validateUUID(appId)) {
    const err = new Error('Invalid app ID format');
    err.status = 400;
    throw err;
  }

  const app = await marketplaceService.getAppById(appId);

  res.json(app);
});

export default router;
