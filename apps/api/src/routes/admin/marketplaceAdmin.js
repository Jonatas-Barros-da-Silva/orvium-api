import express from 'express';
import pb from '../../utils/pocketbaseClient.js';
import { marketplaceService } from '../../services/marketplaceService.js';
import { requirePermission } from '../../middleware/permissionEngine.js';
import logger from '../../utils/logger.js';

const router = express.Router();

/**
 * POST /admin/marketplace/apps - Create new marketplace app
 * Body: {name, slug, description, icon_url, category}
 * Requires admin.marketplace permission
 */
router.post('/apps', requirePermission('admin.marketplace'), async (req, res) => {
  const { name, slug, description, icon_url, category } = req.body;

  if (!name || typeof name !== 'string') {
    const err = new Error('name is required and must be a string');
    err.status = 400;
    throw err;
  }

  if (!slug || typeof slug !== 'string') {
    const err = new Error('slug is required and must be a string');
    err.status = 400;
    throw err;
  }

  if (!description || typeof description !== 'string') {
    const err = new Error('description is required and must be a string');
    err.status = 400;
    throw err;
  }

  if (!icon_url || typeof icon_url !== 'string') {
    const err = new Error('icon_url is required and must be a string');
    err.status = 400;
    throw err;
  }

  if (!category || typeof category !== 'string') {
    const err = new Error('category is required and must be a string');
    err.status = 400;
    throw err;
  }

  const app = await pb.collection('integration_apps').create({
    name,
    slug,
    description,
    icon_url,
    category,
    status: 'active',
  }, { $autoCancel: false });

  logger.info(`Marketplace app created: ${app.id}`);

  res.status(201).json({
    id: app.id,
    name: app.name,
    slug: app.slug,
    description: app.description,
    icon_url: app.icon_url,
    category: app.category,
    status: app.status,
    created_at: app.created,
  });
});

/**
 * POST /admin/marketplace/apps/:appId/versions - Create app version
 * Body: {version_name, adapter_type, config_schema, permissions}
 * Requires admin.marketplace permission
 */
router.post('/apps/:appId/versions', requirePermission('admin.marketplace'), async (req, res) => {
  const { appId } = req.params;
  const { version_name, adapter_type, config_schema, permissions } = req.body;

  // Validate appId UUID format
  if (!marketplaceService.validateUUID(appId)) {
    const err = new Error('Invalid app ID format');
    err.status = 400;
    throw err;
  }

  if (!version_name || typeof version_name !== 'string') {
    const err = new Error('version_name is required and must be a string');
    err.status = 400;
    throw err;
  }

  // Validate semantic versioning format (e.g., 1.0.0 or 1.0.0-beta)
  const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/;
  if (!semverRegex.test(version_name)) {
    const err = new Error('version_name must match semantic versioning format (e.g., 1.0.0)');
    err.status = 400;
    throw err;
  }

  if (!adapter_type || typeof adapter_type !== 'string') {
    const err = new Error('adapter_type is required and must be a string');
    err.status = 400;
    throw err;
  }

  if (!config_schema || typeof config_schema !== 'object') {
    const err = new Error('config_schema is required and must be an object');
    err.status = 400;
    throw err;
  }

  if (!Array.isArray(permissions)) {
    const err = new Error('permissions is required and must be an array');
    err.status = 400;
    throw err;
  }

  // Verify app exists
  const app = await marketplaceService.getAppById(appId);
  if (!app) {
    const err = new Error('App not found');
    err.status = 404;
    throw err;
  }

  const appVersion = await pb.collection('integration_app_versions').create({
    app_id: appId,
    version_name,
    adapter_type,
    config_schema: typeof config_schema === 'string' ? config_schema : JSON.stringify(config_schema),
    permissions,
    status: 'active',
  }, { $autoCancel: false });

  logger.info(`App version created: app=${appId}, version=${version_name}`);

  res.status(201).json({
    id: appVersion.id,
    app_id: appVersion.app_id,
    version_name: appVersion.version_name,
    adapter_type: appVersion.adapter_type,
    config_schema: appVersion.config_schema,
    permissions: appVersion.permissions,
    status: appVersion.status,
    created_at: appVersion.created,
  });
});

/**
 * POST /admin/marketplace/apps/:appId/deprecate - Deprecate app
 * Requires admin.marketplace permission
 */
router.post('/apps/:appId/deprecate', requirePermission('admin.marketplace'), async (req, res) => {
  const { appId } = req.params;

  // Validate appId UUID format
  if (!marketplaceService.validateUUID(appId)) {
    const err = new Error('Invalid app ID format');
    err.status = 400;
    throw err;
  }

  const app = await pb.collection('integration_apps').update(
    appId,
    { status: 'deprecated' },
    { $autoCancel: false }
  );

  logger.info(`App deprecated: ${appId}`);

  res.json({
    id: app.id,
    name: app.name,
    slug: app.slug,
    status: app.status,
  });
});

/**
 * POST /admin/marketplace/apps/:appId/versions/:versionId/deprecate - Deprecate app version
 * Requires admin.marketplace permission
 */
router.post('/apps/:appId/versions/:versionId/deprecate', requirePermission('admin.marketplace'), async (req, res) => {
  const { appId, versionId } = req.params;

  // Validate UUID formats
  if (!marketplaceService.validateUUID(appId)) {
    const err = new Error('Invalid app ID format');
    err.status = 400;
    throw err;
  }

  if (!marketplaceService.validateUUID(versionId)) {
    const err = new Error('Invalid version ID format');
    err.status = 400;
    throw err;
  }

  // Verify version belongs to app
  const appVersion = await pb.collection('integration_app_versions').getOne(versionId, {
    $autoCancel: false,
  });

  if (appVersion.app_id !== appId) {
    const err = new Error('Version does not belong to this app');
    err.status = 400;
    throw err;
  }

  const updated = await pb.collection('integration_app_versions').update(
    versionId,
    { status: 'deprecated' },
    { $autoCancel: false }
  );

  logger.info(`App version deprecated: app=${appId}, version=${versionId}`);

  res.json({
    id: updated.id,
    app_id: updated.app_id,
    version_name: updated.version_name,
    status: updated.status,
  });
});

export default router;
