
import express from 'express';
import { createReplayService } from '../replay/replay.service.js';
import logger from '../utils/logger.js';

export default function createReplayRoutes(pbInstance) {
  const router = express.Router();
  const replayService = createReplayService();

  /**
   * POST /executions/:execution_id/replay
   * Trigger a replay of an execution
   */
  router.post('/executions/:execution_id/replay', async (req, res) => {
    try {
      const { replay_source } = req.body;
      const result = await replayService.replayExecution(req.params.execution_id, replay_source);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Replay API Error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to replay execution' });
    }
  });

  /**
   * GET /executions/:execution_id/replays
   * Get replay history for an execution
   */
  router.get('/executions/:execution_id/replays', async (req, res) => {
    try {
      const history = await replayService.getReplayHistory(req.params.execution_id);
      res.json({ success: true, data: history });
    } catch (error) {
      logger.error('Replay API Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch replay history' });
    }
  });

  /**
   * GET /replays
   * List all replays with pagination
   */
  router.get('/replays', async (req, res) => {
    try {
      const options = {
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0,
        replay_source: req.query.replay_source
      };
      const replays = await replayService.listReplays(options);
      res.json({ success: true, data: replays });
    } catch (error) {
      logger.error('Replay API Error:', error);
      res.status(500).json({ success: false, error: 'Failed to list replays' });
    }
  });

  /**
   * GET /executions/:original_id/compare/:replay_id
   * Compare original execution with a replay
   */
  router.get('/executions/:original_id/compare/:replay_id', async (req, res) => {
    try {
      const comparison = await replayService.compareExecutions(
        req.params.original_id, 
        req.params.replay_id
      );
      res.json({ success: true, data: comparison });
    } catch (error) {
      logger.error('Replay API Error:', error);
      res.status(500).json({ success: false, error: 'Failed to compare executions' });
    }
  });

  return router;
}
