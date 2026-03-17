
import express from 'express';
import { runtimeMetrics } from '../performance/runtime.metrics.js';
import { globalCache } from '../cache/cache.manager.js';
import logger from '../utils/logger.js';

export default function createRuntimeRoutes() {
  const router = express.Router();

  /**
   * GET /api/runtime/metrics
   * Returns overall runtime performance metrics
   */
  router.get('/metrics', (req, res) => {
    try {
      const metrics = runtimeMetrics.getMetrics();
      res.json({ success: true, data: metrics });
    } catch (error) {
      logger.error('Error fetching runtime metrics:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch metrics' });
    }
  });

  /**
   * GET /api/runtime/slow-executions
   * Returns recent executions that exceeded the slow threshold
   */
  router.get('/slow-executions', (req, res) => {
    try {
      const slowExecutions = runtimeMetrics.getSlowExecutions();
      res.json({ success: true, data: slowExecutions });
    } catch (error) {
      logger.error('Error fetching slow executions:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch slow executions' });
    }
  });

  /**
   * GET /api/runtime/worker-utilization
   * Returns estimated worker utilization stats
   */
  router.get('/worker-utilization', (req, res) => {
    try {
      const utilization = runtimeMetrics.getWorkerUtilization();
      res.json({ success: true, data: utilization });
    } catch (error) {
      logger.error('Error fetching worker utilization:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch worker utilization' });
    }
  });

  /**
   * POST /api/runtime/cache/clear
   * Clears the global in-memory cache
   */
  router.post('/cache/clear', (req, res) => {
    try {
      globalCache.clear();
      res.json({ success: true, message: 'Cache cleared successfully' });
    } catch (error) {
      logger.error('Error clearing cache:', error);
      res.status(500).json({ success: false, error: 'Failed to clear cache' });
    }
  });

  return router;
}
