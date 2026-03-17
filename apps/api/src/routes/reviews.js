
import express from 'express';

/**
 * Create review routes with PocketBase client
 * @param {Object} pbInstance - PocketBase client instance
 * @returns {express.Router} - Express router with review endpoints
 */
export default function createReviewRoutes(pbInstance) {
  const router = express.Router();

  /**
   * POST /submit - Submit an integration for review
   */
  router.post('/submit', async (req, res, next) => {
    try {
      const { integration_id, developer_id } = req.body;
      
      if (!integration_id || !developer_id) {
        return res.status(400).json({ error: 'integration_id and developer_id are required' });
      }

      // Check if submission already exists
      const existing = await pbInstance.collection('integration_submissions').getFullList({
        filter: `integration_id="${integration_id}" && developer_id="${developer_id}"`,
        $autoCancel: false
      });

      let record;
      if (existing.length > 0) {
        record = await pbInstance.collection('integration_submissions').update(existing[0].id, {
          status: 'submitted',
          review_notes: ''
        }, { $autoCancel: false });
      } else {
        record = await pbInstance.collection('integration_submissions').create({
          integration_id,
          developer_id,
          status: 'submitted'
        }, { $autoCancel: false });
      }

      res.status(200).json(record);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /pending - Get all pending submissions with details
   */
  router.get('/pending', async (req, res, next) => {
    try {
      const submissions = await pbInstance.collection('integration_submissions').getFullList({
        filter: `status="submitted"`,
        sort: '-created',
        $autoCancel: false
      });

      // Enrich with app and developer details
      const enriched = await Promise.all(submissions.map(async (sub) => {
        let app = null;
        let developer = null;
        
        try {
          app = await pbInstance.collection('integration_apps').getOne(sub.integration_id, { $autoCancel: false });
        } catch (e) {
          console.warn(`App not found for submission ${sub.id}`);
        }
        
        try {
          developer = await pbInstance.collection('users').getOne(sub.developer_id, { $autoCancel: false });
        } catch (e) {
          console.warn(`Developer not found for submission ${sub.id}`);
        }

        return { ...sub, app, developer };
      }));

      res.json(enriched);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /:id - Get single submission details
   */
  router.get('/:id', async (req, res, next) => {
    try {
      const sub = await pbInstance.collection('integration_submissions').getOne(req.params.id, { $autoCancel: false });
      
      let app = null;
      let developer = null;
      let versions = [];
      let capabilities = [];

      try {
        app = await pbInstance.collection('integration_apps').getOne(sub.integration_id, { $autoCancel: false });
        
        versions = await pbInstance.collection('integration_app_versions').getFullList({
          filter: `app_id="${app.id}"`,
          sort: '-created',
          $autoCancel: false
        });

        if (versions.length > 0) {
          const activeVersion = versions[0];
          const caps = await pbInstance.collection('integration_capabilities').getFullList({
            filter: `integration_version_id="${activeVersion.id}"`,
            $autoCancel: false
          });

          capabilities = await Promise.all(caps.map(async (cap) => {
            const actions = await pbInstance.collection('capability_actions').getFullList({
              filter: `capability_id="${cap.id}"`,
              $autoCancel: false
            });
            return { ...cap, actions };
          }));
        }
      } catch (e) {
        console.warn(`Failed to fetch full app details for submission ${sub.id}`);
      }

      try {
        developer = await pbInstance.collection('users').getOne(sub.developer_id, { $autoCancel: false });
      } catch (e) {
        console.warn(`Developer not found for submission ${sub.id}`);
      }

      res.json({ ...sub, app, developer, versions, capabilities });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /:id/approve - Approve a submission
   */
  router.post('/:id/approve', async (req, res, next) => {
    try {
      const updated = await pbInstance.collection('integration_submissions').update(req.params.id, {
        status: 'approved',
        is_public: true,
        review_notes: 'Approved for marketplace.'
      }, { $autoCancel: false });
      
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /:id/reject - Reject a submission with notes
   */
  router.post('/:id/reject', async (req, res, next) => {
    try {
      const { notes } = req.body;
      if (!notes) {
        return res.status(400).json({ error: 'Rejection notes are required' });
      }

      const updated = await pbInstance.collection('integration_submissions').update(req.params.id, {
        status: 'rejected',
        is_public: false,
        review_notes: notes
      }, { $autoCancel: false });
      
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
