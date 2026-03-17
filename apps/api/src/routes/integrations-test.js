
/**
 * Test routes for verifying integration services and PocketBase collections
 */
export function setupIntegrationTestRoutes(app, pb) {
  // GET /integrations/health
  app.get('/integrations/health', async (req, res) => {
    try {
      const services = await global.getIntegrationServices(pb);
      
      if (!services) {
        return res.status(503).json({
          status: 'error',
          message: 'Integration services are currently unavailable.',
          details: null
        });
      }

      const health = {
        registry: !!services.registry,
        version: !!services.version,
        installation: !!services.installation,
        resolver: !!services.resolver
      };

      const allHealthy = Object.values(health).every(Boolean);

      if (allHealthy) {
        res.status(200).json({
          status: 'ok',
          message: 'All integration services are initialized and healthy.',
          details: health
        });
      } else {
        res.status(503).json({
          status: 'degraded',
          message: 'Some integration services failed to initialize.',
          details: health
        });
      }
    } catch (error) {
      res.status(500).json({ 
        status: 'error', 
        message: error.message,
        details: null
      });
    }
  });

  // GET /integrations/collections
  app.get('/integrations/collections', async (req, res) => {
    try {
      const collections = [
        'integration_apps',
        'integration_versions',
        'integration_permissions',
        'integration_metadata',
        'integration_installations'
      ];

      const results = {};
      let allExist = true;

      for (const name of collections) {
        try {
          // Fetch 1 item just to get the totalItems count and verify existence
          const result = await pb.collection(name).getList(1, 1, { $autoCancel: false });
          results[name] = { 
            exists: true, 
            count: result.totalItems 
          };
        } catch (err) {
          results[name] = { 
            exists: false, 
            error: err.message 
          };
          allExist = false;
        }
      }

      res.json({
        status: allExist ? 'ok' : 'error',
        message: allExist 
          ? 'All integration collections exist and are accessible.' 
          : 'Some integration collections are missing or inaccessible.',
        details: results
      });
    } catch (error) {
      res.status(500).json({ 
        status: 'error', 
        message: error.message,
        details: null
      });
    }
  });
}
