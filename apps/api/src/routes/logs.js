
import express from 'express';
import { logService } from '../logs/log.service.js';
import logger from '../utils/logger.js';

export default function createLogsRoutes(pbInstance) {
  const router = express.Router();

  /**
   * GET /executions/:execution_id
   * Returns logs for a specific execution
   */
  router.get('/executions/:execution_id', async (req, res) => {
    try {
      const logs = await logService.getExecutionLogs(req.params.execution_id);
      res.json({ success: true, data: logs });
    } catch (error) {
      logger.error('Logs API Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch execution logs' });
    }
  });

  /**
   * GET /executions/:execution_id/details
   * Returns execution details along with its logs
   */
  router.get('/executions/:execution_id/details', async (req, res) => {
    try {
      const details = await logService.getExecutionWithLogs(req.params.execution_id);
      res.json({ success: true, data: details });
    } catch (error) {
      logger.error('Logs API Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch execution details' });
    }
  });

  /**
   * GET /
   * List logs with filters
   */
  router.get('/', async (req, res) => {
    try {
      const filters = {
        integration_id: req.query.integration_id,
        log_level: req.query.log_level,
        execution_id: req.query.execution_id,
        trace_id: req.query.trace_id,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      const result = await logService.listLogs(filters);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Logs API Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch logs' });
    }
  });

  /**
   * GET /errors
   * Get recent error logs
   */
  router.get('/errors', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const result = await logService.getErrorLogs(limit);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Logs API Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch error logs' });
    }
  });

  /**
   * GET /integrations/:integration_id/errors
   * Get recent error logs for a specific integration
   */
  router.get('/integrations/:integration_id/errors', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const result = await logService.getIntegrationErrors(req.params.integration_id, limit);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Logs API Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch integration error logs' });
    }
  });

  return router;
}
