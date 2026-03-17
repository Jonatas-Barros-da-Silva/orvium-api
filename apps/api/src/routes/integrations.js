
import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

/**
 * Create integration routes with PocketBase client
 * @param {Object} pbInstance - PocketBase client instance
 * @returns {express.Router} - Express router with integration endpoints
 */
export default function createIntegrationRoutes(pbInstance) {
  const router = express.Router();

  /**
   * GET /integrations - List all active integrations with capability count
   * Returns array of integration apps with their latest active version and capability counts
   * ONLY returns approved and public integrations.
   */
  router.get('/', async (req, res) => {
    try {
      // 1. Fetch approved and public submissions
      const approvedSubmissions = await pbInstance.collection('integration_submissions').getFullList({
        filter: `status="approved" && is_public=true`,
        $autoCancel: false,
      });

      const approvedAppIds = approvedSubmissions.map(sub => sub.integration_id).filter(Boolean);

      if (approvedAppIds.length === 0) {
        return res.json([]);
      }

      // 2. Fetch the corresponding active apps
      const idFilter = approvedAppIds.map(id => `id="${id}"`).join(' || ');
      const apps = await pbInstance.collection('integration_apps').getFullList({
        filter: `status="active" && (${idFilter})`,
        sort: 'name',
        $autoCancel: false,
      });

      const enrichedApps = await Promise.all(
        apps.map(async (app) => {
          // Get active versions for this app
          const versions = await pbInstance.collection('integration_app_versions').getFullList({
            filter: `app_id="${app.id}" && status="active"`,
            $autoCancel: false,
          });

          let capabilityCount = 0;
          if (versions.length > 0) {
            const activeVersion = versions[0];
            const capabilities = await pbInstance.collection('integration_capabilities').getFullList({
              filter: `integration_version_id="${activeVersion.id}" && is_active=true`,
              $autoCancel: false,
            });
            capabilityCount = capabilities.length;
          }

          return {
            id: app.id,
            name: app.name,
            slug: app.slug,
            description: app.description,
            category: app.category,
            icon_url: app.icon_url,
            capabilityCount,
          };
        })
      );

      res.json(enrichedApps);
    } catch (error) {
      logger.error('Error fetching integrations:', error);
      res.status(500).json({ error: 'Failed to fetch integrations' });
    }
  });

  /**
   * GET /integrations/:slug - Get full integration details with capabilities and actions
   */
  router.get('/:slug', async (req, res) => {
    try {
      const { slug } = req.params;

      const apps = await pbInstance.collection('integration_apps').getFullList({
        filter: `slug="${slug}" && status="active"`,
        $autoCancel: false,
      });

      if (apps.length === 0) {
        return res.status(404).json({ error: 'Integration not found' });
      }

      const app = apps[0];

      // Verify it is approved
      const submissions = await pbInstance.collection('integration_submissions').getFullList({
        filter: `integration_id="${app.id}" && status="approved" && is_public=true`,
        $autoCancel: false,
      });

      if (submissions.length === 0) {
        return res.status(403).json({ error: 'Integration is not approved for public viewing' });
      }

      // Get active versions
      const versions = await pbInstance.collection('integration_app_versions').getFullList({
        filter: `app_id="${app.id}" && status="active"`,
        sort: '-created',
        $autoCancel: false,
      });

      if (versions.length === 0) {
        return res.status(404).json({ error: 'No active version found for this integration' });
      }

      const activeVersion = versions[0];

      // Get capabilities
      const capabilities = await pbInstance.collection('integration_capabilities').getFullList({
        filter: `integration_version_id="${activeVersion.id}"`,
        $autoCancel: false,
      });

      // Get actions for each capability
      const enrichedCapabilities = await Promise.all(
        capabilities.map(async (cap) => {
          const actions = await pbInstance.collection('capability_actions').getFullList({
            filter: `capability_id="${cap.id}" && is_active=true`,
            $autoCancel: false,
          });
          return {
            ...cap,
            actions,
          };
        })
      );

      res.json({
        id: app.id,
        name: app.name,
        slug: app.slug,
        description: app.description,
        category: app.category,
        icon_url: app.icon_url,
        version: activeVersion.version_name,
        versionId: activeVersion.id,
        updated_at: activeVersion.updated,
        capabilityCount: capabilities.filter((c) => c.is_active).length,
        capabilities: enrichedCapabilities,
      });
    } catch (error) {
      logger.error(`Error fetching integration ${req.params.slug}:`, error);
      res.status(500).json({ error: 'Failed to fetch integration details' });
    }
  });

  /**
   * GET /integrations/:slug/docs - Generate markdown documentation for an integration
   */
  router.get('/:slug/docs', async (req, res) => {
    try {
      const { slug } = req.params;

      const apps = await pbInstance.collection('integration_apps').getFullList({
        filter: `slug="${slug}" && status="active"`,
        $autoCancel: false,
      });

      if (apps.length === 0) {
        return res.status(404).json({ error: 'Integration not found' });
      }

      const app = apps[0];

      const versions = await pbInstance.collection('integration_app_versions').getFullList({
        filter: `app_id="${app.id}" && status="active"`,
        sort: '-created',
        $autoCancel: false,
      });

      if (versions.length === 0) {
        return res.status(404).json({ error: 'No active version found' });
      }

      const activeVersion = versions[0];

      const capabilities = await pbInstance.collection('integration_capabilities').getFullList({
        filter: `integration_version_id="${activeVersion.id}" && is_active=true`,
        $autoCancel: false,
      });

      let markdown = `# ${app.name} Integration Documentation\n\n`;
      markdown += `**Version:** ${activeVersion.version_name}\n\n`;
      markdown += `${app.description}\n\n`;
      
      if (capabilities.length > 0) {
        markdown += `## Capabilities\n\n`;
        markdown += `This integration provides the following capabilities:\n\n`;

        for (const cap of capabilities) {
          markdown += `### ${cap.name}\n`;
          if (cap.description) markdown += `${cap.description}\n\n`;
          
          const actions = await pbInstance.collection('capability_actions').getFullList({
            filter: `capability_id="${cap.id}" && is_active=true`,
            $autoCancel: false,
          });

          if (actions.length > 0) {
            markdown += `#### Available Actions\n\n`;
            for (const action of actions) {
              markdown += `- **${action.name}** (\`${action.action_key}\`)\n`;
              if (action.description) markdown += `  ${action.description}\n`;
            }
            markdown += `\n`;
          } else {
            markdown += `*No actions defined for this capability yet.*\n\n`;
          }
        }
      } else {
        markdown += `*No capabilities documented for this version.*\n`;
      }

      res.json({ markdown });
    } catch (error) {
      logger.error(`Error generating docs for ${req.params.slug}:`, error);
      res.status(500).json({ error: 'Failed to generate documentation' });
    }
  });

  /**
   * GET /integrations/:slug/installed - Check if integration is installed in workspace
   */
  router.get('/:slug/installed', async (req, res) => {
    try {
      const { slug } = req.params;
      const { workspaceId } = req.query;

      if (!workspaceId) {
        return res.status(400).json({ error: 'workspaceId query parameter is required' });
      }

      const apps = await pbInstance.collection('integration_apps').getFullList({
        filter: `slug="${slug}"`,
        $autoCancel: false,
      });

      if (apps.length === 0) {
        return res.status(404).json({ error: 'Integration not found' });
      }

      const installations = await pbInstance.collection('integration_installations').getFullList({
        filter: `workspace_id="${workspaceId}" && integration_app_id="${apps[0].id}"`,
        $autoCancel: false,
      });

      res.json({
        installed: installations.length > 0,
        installationId: installations.length > 0 ? installations[0].id : null,
        status: installations.length > 0 ? installations[0].status : null
      });
    } catch (error) {
      logger.error('Error checking installation status:', error);
      res.status(500).json({ error: 'Failed to check installation status' });
    }
  });

  /**
   * POST /integrations/install - Install integration into workspace
   */
  router.post('/install', async (req, res) => {
    try {
      const { workspaceId, integrationAppId, versionId } = req.body;

      if (!workspaceId || !integrationAppId || !versionId) {
        return res.status(400).json({
          error: 'workspaceId, integrationAppId, and versionId are required',
        });
      }

      const existing = await pbInstance.collection('integration_installations').getFullList({
        filter: `workspace_id="${workspaceId}" && integration_app_id="${integrationAppId}"`,
        $autoCancel: false,
      });

      if (existing.length > 0) {
        return res.json({
          success: true,
          installation: existing[0],
          message: 'Already installed',
        });
      }

      const installation = await pbInstance.collection('integration_installations').create(
        {
          workspace_id: workspaceId,
          integration_app_id: integrationAppId,
          integration_version_id: versionId,
          status: 'needs_configuration',
          installed_by: 'system',
          installed_at: new Date().toISOString(),
        },
        { $autoCancel: false }
      );

      await pbInstance.collection('integration_install_logs').create(
        {
          workspace_id: workspaceId,
          app_id: integrationAppId,
          app_version_id: versionId,
          action: 'install',
          status: 'success',
          installed_by: 'system',
        },
        { $autoCancel: false }
      );

      logger.info(`Integration installed: workspace=${workspaceId}, app=${integrationAppId}`);

      res.status(201).json({
        success: true,
        installation,
      });
    } catch (error) {
      logger.error('Error installing integration:', error);
      res.status(500).json({ error: 'Failed to install integration' });
    }
  });

  return router;
}
