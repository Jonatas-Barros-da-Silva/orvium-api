
import express from 'express';
import { analyticsService } from '../analytics/analytics.service.js';
import { analyticsRecorder } from '../analytics/analytics.recorder.js';
import logger from '../utils/logger.js';

export default function createAnalyticsRoutes(pbInstance) {
  const router = express.Router();

  /**
   * GET /analytics/platform
   * Get overall platform metrics
   */
  router.get('/platform', async (req, res) => {
    try {
      const metrics = await analyticsService.getPlatformMetrics();
      res.json({ success: true, data: metrics });
    } catch (error) {
      logger.error('Analytics API Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch platform metrics' });
    }
  });

  /**
   * GET /analytics/integrations/:id
   * Get metrics for a specific integration
   */
  router.get('/integrations/:id', async (req, res) => {
    try {
      const metrics = await analyticsService.getIntegrationMetrics(req.params.id);
      res.json({ success: true, data: metrics });
    } catch (error) {
      logger.error('Analytics API Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch integration metrics' });
    }
  });

  /**
   * GET /analytics/integrations/:id/capabilities
   * Get capability metrics for a specific integration
   */
  router.get('/integrations/:id/capabilities', async (req, res) => {
    try {
      const metrics = await analyticsService.getCapabilityMetrics(req.params.id);
      res.json({ success: true, data: metrics });
    } catch (error) {
      logger.error('Analytics API Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch capability metrics' });
    }
  });

  /**
   * GET /analytics/executions
   * List executions with filters
   */
  router.get('/executions', async (req, res) => {
    try {
      const filters = {
        integration_id: req.query.integration_id,
        status: req.query.status,
        capability: req.query.capability,
        action: req.query.action,
        error_type: req.query.error_type,
        trigger_type: req.query.trigger_type,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      const result = await analyticsService.listExecutions(filters);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Analytics API Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch executions' });
    }
  });

  /**
   * POST /analytics/record
   * Internal endpoint to record an execution
   */
  router.post('/record', (req, res) => {
    try {
      const data = req.body;
      
      // Basic validation
      const required = ['integration_id', 'version_id', 'capability', 'action', 'status', 'latency_ms', 'trigger_type', 'started_at', 'finished_at'];
      const missing = required.filter(field => data[field] === undefined);
      
      if (missing.length > 0) {
        return res.status(400).json({ success: false, error: `Missing required fields: ${missing.join(', ')}` });
      }

      // Record asynchronously
      analyticsRecorder.recordExecution(data);
      
      res.status(202).json({ success: true, message: 'Execution queued for recording' });
    } catch (error) {
      logger.error('Analytics API Error:', error);
      res.status(500).json({ success: false, error: 'Failed to record execution' });
    }
  });

  return router;
}
