
import express from 'express';
import { traceService } from '../trace/trace.service.js';
import logger from '../utils/logger.js';

export default function createTracesRoutes(pbInstance) {
  const router = express.Router();

  /**
   * GET /traces/slow
   * Get slow traces across the platform
   */
  router.get('/slow', async (req, res) => {
    try {
      const threshold = parseInt(req.query.threshold) || 5000;
      const limit = parseInt(req.query.limit) || 50;
      const traces = await traceService.getSlowTraces(threshold, limit);
      res.json({ success: true, data: traces });
    } catch (error) {
      logger.error('Traces API Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch slow traces' });
    }
  });

  /**
   * GET /traces/integrations/:integration_id/stats
   * Get span statistics for an integration
   */
  router.get('/integrations/:integration_id/stats', async (req, res) => {
    try {
      const stats = await traceService.getIntegrationSpanStats(req.params.integration_id);
      res.json({ success: true, data: stats });
    } catch (error) {
      logger.error('Traces API Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch integration trace stats' });
    }
  });

  /**
   * GET /traces/execution/:execution_id
   * Get trace by execution ID
   */
  router.get('/execution/:execution_id', async (req, res) => {
    try {
      const trace = await traceService.getExecutionTrace(req.params.execution_id);
      if (!trace) {
        return res.status(404).json({ success: false, error: 'Trace not found for execution' });
      }
      res.json({ success: true, data: trace });
    } catch (error) {
      logger.error('Traces API Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch execution trace' });
    }
  });

  /**
   * GET /traces/:trace_id
   * Get full trace details including spans
   */
  router.get('/:trace_id', async (req, res) => {
    try {
      const trace = await traceService.getTrace(req.params.trace_id);
      if (!trace) {
        return res.status(404).json({ success: false, error: 'Trace not found' });
      }
      res.json({ success: true, data: trace });
    } catch (error) {
      logger.error('Traces API Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch trace' });
    }
  });

  return router;
}
