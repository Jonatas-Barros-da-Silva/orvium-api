
import express from 'express';
import { ioService } from '../execution-io/io.service.js';
import logger from '../utils/logger.js';

export default function createExecutionIORoutes(pbInstance) {
  const router = express.Router();

  /**
   * GET /executions/:execution_id/io
   * Returns full IO details for an execution
   */
  router.get('/:execution_id/io', async (req, res) => {
    try {
      const io = await ioService.getExecutionIO(req.params.execution_id);
      if (!io) {
        return res.status(404).json({ success: false, error: 'Execution IO not found' });
      }
      res.json({ success: true, data: io });
    } catch (error) {
      logger.error('Execution IO API Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch execution IO' });
    }
  });

  /**
   * GET /executions/:execution_id/input
   * Returns only input payload and context
   */
  router.get('/:execution_id/input', async (req, res) => {
    try {
      const input = await ioService.getExecutionInput(req.params.execution_id);
      if (!input) {
        return res.status(404).json({ success: false, error: 'Execution input not found' });
      }
      res.json({ success: true, data: input });
    } catch (error) {
      logger.error('Execution IO API Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch execution input' });
    }
  });

  /**
   * GET /executions/:execution_id/output
   * Returns only output payload
   */
  router.get('/:execution_id/output', async (req, res) => {
    try {
      const output = await ioService.getExecutionOutput(req.params.execution_id);
      if (!output) {
        return res.status(404).json({ success: false, error: 'Execution output not found' });
      }
      res.json({ success: true, data: output });
    } catch (error) {
      logger.error('Execution IO API Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch execution output' });
    }
  });

  /**
   * GET /executions/:execution_id/error
   * Returns only error payload
   */
  router.get('/:execution_id/error', async (req, res) => {
    try {
      const error = await ioService.getExecutionError(req.params.execution_id);
      if (!error) {
        return res.status(404).json({ success: false, error: 'Execution error not found' });
      }
      res.json({ success: true, data: error });
    } catch (error) {
      logger.error('Execution IO API Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch execution error' });
    }
  });

  return router;
}
