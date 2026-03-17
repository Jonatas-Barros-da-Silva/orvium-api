
import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /automations/logs - List automation execution logs
 */
router.get('/', async (req, res) => {
  const { rule_id, event_type, status, limit = '50', offset = '0' } = req.query;
  const workspaceId = req.auth?.organization_id;

  if (!workspaceId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'workspace_id is required',
    });
  }

  const parsedLimit = Math.min(parseInt(limit, 10) || 50, 500);
  const parsedOffset = parseInt(offset, 10) || 0;

  if (parsedLimit < 1 || parsedOffset < 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid limit or offset',
    });
  }

  let filter = `workspace_id="${workspaceId}"`;

  if (rule_id) {
    filter += ` && rule_id="${rule_id}"`;
  }

  if (event_type) {
    filter += ` && event_type="${event_type}"`;
  }

  if (status) {
    filter += ` && status="${status}"`;
  }

  try {
    const logs = await pb.collection('automation_logs').getList(
      Math.floor(parsedOffset / parsedLimit) + 1,
      parsedLimit,
      {
        filter,
        sort: '-created',
        expand: 'rule_version_id',
        $autoCancel: false,
      }
    );

    res.json({
      logs: logs.items.map(log => ({
        id: log.id,
        rule_id: log.rule_id,
        rule_version_id: log.rule_version_id,
        version_number: log.expand?.rule_version_id?.version_number || null,
        event_type: log.event_type,
        status: log.status,
        execution_time_ms: log.execution_time_ms,
        error_message: log.error_message,
        action_results: log.action_results,
        created_at: log.created,
      })),
      total: logs.totalItems,
      limit: parsedLimit,
      offset: parsedOffset,
    });
  } catch (error) {
    logger.error('Error fetching automation logs:', error.message);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

/**
 * GET /automations/logs/:id - Get single automation log
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const workspaceId = req.auth?.organization_id;

  if (!workspaceId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'workspace_id is required',
    });
  }

  try {
    const log = await pb.collection('automation_logs').getOne(id, {
      expand: 'rule_version_id',
      $autoCancel: false,
    });

    if (log.workspace_id !== workspaceId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Log does not belong to this workspace',
      });
    }

    res.json({
      id: log.id,
      rule_id: log.rule_id,
      rule_version_id: log.rule_version_id,
      version_number: log.expand?.rule_version_id?.version_number || null,
      event_type: log.event_type,
      status: log.status,
      execution_time_ms: log.execution_time_ms,
      error_message: log.error_message,
      action_results: log.action_results,
      created_at: log.created,
    });
  } catch (error) {
    if (error.message.includes('Failed to find')) {
      return res.status(404).json({ error: 'Not Found', message: 'Log not found' });
    }
    logger.error(`Error fetching automation log ${id}:`, error.message);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

export default router;
