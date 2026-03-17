
import express from 'express';
import { ManifestService } from '../manifest/manifest.service.js';
import pb from '../utils/pocketbaseClient.js';

export default function createManifestRoutes() {
  const router = express.Router();
  const manifestService = new ManifestService();

  /**
   * POST /api/manifest/validate
   * Validates a manifest file content
   */
  router.post('/validate', (req, res) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ success: false, error: 'Manifest content is required' });
      }

      const result = manifestService.validateManifest(content);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/manifest/register
   * Registers an integration from a manifest
   */
  router.post('/register', async (req, res) => {
    try {
      const { content, developer_id } = req.body;
      
      if (!content) {
        return res.status(400).json({ success: false, error: 'Manifest content is required' });
      }
      if (!developer_id) {
        return res.status(400).json({ success: false, error: 'developer_id is required' });
      }

      const result = await manifestService.registerFromManifest(content, developer_id);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/manifest/:integration_id/docs
   * Generates documentation for an installed integration
   */
  router.get('/:integration_id/docs', async (req, res) => {
    try {
      const { integration_id } = req.params;
      
      // Fetch the latest version to get the manifest
      const versions = await pb.collection('integration_versions').getFullList({
        filter: `integration_app_id="${integration_id}"`,
        sort: '-created',
        $autoCancel: false
      });

      if (versions.length === 0 || !versions[0].manifest_json) {
        return res.status(404).json({ success: false, error: 'Manifest not found for this integration' });
      }

      const manifest = versions[0].manifest_json;
      const markdown = manifestService.generateDocumentation(manifest);
      
      res.json({ success: true, data: { markdown, manifest } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
