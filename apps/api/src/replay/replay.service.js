
import pb from '../utils/pocketbaseClient.js';
import { ioService } from '../execution-io/io.service.js';
import crypto from 'crypto';
import logger from '../utils/logger.js';

export class ReplayService {
  
  async replayExecution(executionId, source = 'manual_debug') {
    try {
      // 1. Get original IO
      const originalIO = await ioService.getExecutionIO(executionId);
      if (!originalIO) {
        throw new Error('Original execution IO not found');
      }

      // 2. Create new execution ID
      const newExecutionId = `rep_${crypto.randomUUID().replace(/-/g, '')}`;

      // 3. Create execution record
      await pb.collection('integration_executions').create({
        execution_id: newExecutionId,
        replay_of_execution_id: executionId,
        replay_source: source
      }, { $autoCancel: false });

      // 4. Simulate execution by copying IO (In a real system, this would dispatch a job to the worker)
      await pb.collection('integration_execution_io').create({
        execution_id: newExecutionId,
        integration_id: originalIO.integration_id,
        version_id: originalIO.version_id,
        capability: originalIO.capability,
        action: originalIO.action,
        input_payload_json: originalIO.input_payload_json,
        context_json: originalIO.context_json,
        output_payload_json: originalIO.output_payload_json,
        error_payload_json: originalIO.error_payload_json,
        payload_size_bytes: originalIO.payload_size_bytes
      }, { $autoCancel: false });

      // 5. Copy context if it exists to maintain status and latency
      const originalCtxList = await pb.collection('integration_execution_context').getFullList({
        filter: `execution_id="${executionId}"`,
        $autoCancel: false
      });

      if (originalCtxList.length > 0) {
        const oCtx = originalCtxList[0];
        await pb.collection('integration_execution_context').create({
          execution_id: newExecutionId,
          workspace_id: oCtx.workspace_id,
          workspace_integration_id: oCtx.workspace_integration_id,
          adapter_type: oCtx.adapter_type,
          trigger_event: 'replay',
          status: oCtx.status,
          execution_time_ms: oCtx.execution_time_ms,
          request_payload: oCtx.request_payload,
          response_payload: oCtx.response_payload
        }, { $autoCancel: false });
      }

      return { 
        success: true, 
        execution_id: newExecutionId, 
        status: 'completed' 
      };
    } catch (error) {
      logger.error(`Error replaying execution ${executionId}:`, error);
      throw error;
    }
  }

  async getReplayHistory(executionId) {
    try {
      const replays = await pb.collection('integration_executions').getFullList({
        filter: `replay_of_execution_id="${executionId}"`,
        sort: '-created',
        $autoCancel: false
      });

      if (replays.length === 0) return [];

      // Fetch contexts to get status and latency
      const replayIds = replays.map(r => `"${r.execution_id}"`).join(',');
      let contexts = [];
      try {
        contexts = await pb.collection('integration_execution_context').getFullList({
          filter: `execution_id ?= [${replayIds}]`,
          $autoCancel: false
        });
      } catch (e) {
        logger.warn('Could not fetch contexts for replays', e.message);
      }

      return replays.map(r => {
        const ctx = contexts.find(c => c.execution_id === r.execution_id);
        return {
          ...r,
          status: ctx?.status || 'unknown',
          latency_ms: ctx?.execution_time_ms || 0
        };
      });
    } catch (error) {
      logger.error(`Error fetching replay history for ${executionId}:`, error);
      throw error;
    }
  }

  async listReplays(options = {}) {
    try {
      const { limit = 50, offset = 0, replay_source } = options;
      let filter = 'replay_of_execution_id != ""';
      
      if (replay_source) {
        filter += ` && replay_source="${replay_source}"`;
      }

      const page = Math.floor(offset / limit) + 1;
      return await pb.collection('integration_executions').getList(page, limit, {
        filter,
        sort: '-created',
        $autoCancel: false
      });
    } catch (error) {
      logger.error('Error listing replays:', error);
      throw error;
    }
  }

  async compareExecutions(originalId, replayId) {
    try {
      const originalIO = await ioService.getExecutionIO(originalId);
      const replayIO = await ioService.getExecutionIO(replayId);

      if (!originalIO || !replayIO) {
        throw new Error('Execution IO not found for comparison');
      }

      let originalCtx, replayCtx;
      try {
        const oCtx = await pb.collection('integration_execution_context').getFullList({ filter: `execution_id="${originalId}"`, $autoCancel: false });
        originalCtx = oCtx[0];
        const rCtx = await pb.collection('integration_execution_context').getFullList({ filter: `execution_id="${replayId}"`, $autoCancel: false });
        replayCtx = rCtx[0];
      } catch(e) {
        logger.warn('Could not fetch contexts for comparison', e.message);
      }

      const originalStatus = originalCtx?.status || (originalIO.error_payload ? 'failed' : 'success');
      const replayStatus = replayCtx?.status || (replayIO.error_payload ? 'failed' : 'success');

      const originalLatency = originalCtx?.execution_time_ms || 0;
      const replayLatency = replayCtx?.execution_time_ms || 0;

      const originalErrorStr = JSON.stringify(originalIO.error_payload || null);
      const replayErrorStr = JSON.stringify(replayIO.error_payload || null);
      
      const originalOutputStr = JSON.stringify(originalIO.output_payload || null);
      const replayOutputStr = JSON.stringify(replayIO.output_payload || null);

      return {
        original: {
          execution_id: originalId,
          status: originalStatus,
          latency_ms: originalLatency,
          error: originalIO.error_payload,
          output: originalIO.output_payload
        },
        replay: {
          execution_id: replayId,
          status: replayStatus,
          latency_ms: replayLatency,
          error: replayIO.error_payload,
          output: replayIO.output_payload
        },
        comparison: {
          status_match: originalStatus === replayStatus,
          latency_diff: replayLatency - originalLatency,
          error_match: originalErrorStr === replayErrorStr,
          output_match: originalOutputStr === replayOutputStr
        }
      };
    } catch (error) {
      logger.error(`Error comparing executions ${originalId} and ${replayId}:`, error);
      throw error;
    }
  }
}

export function createReplayService() {
  return new ReplayService();
}
