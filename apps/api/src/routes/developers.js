
import express from 'express';

/**
 * Create developer routes with PocketBase client
 * @param {Object} pbInstance - PocketBase client instance
 * @returns {express.Router} - Express router with developer endpoints
 */
export default function createDeveloperRoutes(pbInstance) {
  const router = express.Router();

  /**
   * POST /register - Register a new developer account
   */
  router.post('/register', async (req, res, next) => {
    try {
      const { user_id, company_name, website } = req.body;
      
      if (!user_id || !company_name) {
        return res.status(400).json({ error: 'user_id and company_name are required' });
      }

      const record = await pbInstance.collection('developer_accounts').create({
        user_id,
        company_name,
        website,
        status: 'pending'
      }, { $autoCancel: false });

      res.status(201).json(record);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /integrations - Create a new integration submission
   */
  router.post('/integrations', async (req, res, next) => {
    try {
      const { developer_id, name, description, status } = req.body;

      if (!developer_id || !name) {
        return res.status(400).json({ error: 'developer_id and name are required' });
      }

      const record = await pbInstance.collection('integration_submissions').create({
        developer_id,
        name,
        description,
        status: status || 'draft'
      }, { $autoCancel: false });

      res.status(201).json(record);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /integrations/:id/version - Publish a new version for an integration
   */
  router.post('/integrations/:id/version', async (req, res, next) => {
    try {
      const { id } = req.params;
      const { version_name, adapter_type, status } = req.body;

      if (!version_name || !adapter_type) {
        return res.status(400).json({ error: 'version_name and adapter_type are required' });
      }

      const record = await pbInstance.collection('integration_app_versions').create({
        app_id: id,
        version_name,
        adapter_type,
        status: status || 'active'
      }, { $autoCancel: false });

      res.status(201).json(record);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /integrations/:id/capabilities - Add a capability to an integration version
   */
  router.post('/integrations/:id/capabilities', async (req, res, next) => {
    try {
      const { id } = req.params;
      const { capability_key, name, description, is_active } = req.body;

      if (!capability_key || !name) {
        return res.status(400).json({ error: 'capability_key and name are required' });
      }

      const record = await pbInstance.collection('integration_capabilities').create({
        integration_version_id: id,
        capability_key,
        name,
        description,
        is_active: is_active !== undefined ? is_active : true
      }, { $autoCancel: false });

      res.status(201).json(record);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /capabilities/:id/actions - Add an action to a capability
   */
  router.post('/capabilities/:id/actions', async (req, res, next) => {
    try {
      const { id } = req.params;
      const { action_key, name, description, handler, is_active } = req.body;

      if (!action_key || !name || !handler) {
        return res.status(400).json({ error: 'action_key, name, and handler are required' });
      }

      const record = await pbInstance.collection('capability_actions').create({
        capability_id: id,
        action_key,
        name,
        description,
        handler,
        is_active: is_active !== undefined ? is_active : true
      }, { $autoCancel: false });

      res.status(201).json(record);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /:id - Get developer profile
   */
  router.get('/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const record = await pbInstance.collection('developer_accounts').getOne(id, { $autoCancel: false });
      res.json(record);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /:id/integrations - List integrations for a developer
   */
  router.get('/:id/integrations', async (req, res, next) => {
    try {
      const { id } = req.params;
      const records = await pbInstance.collection('integration_submissions').getFullList({
        filter: `developer_id="${id}"`,
        sort: '-created',
        $autoCancel: false
      });
      res.json(records);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
