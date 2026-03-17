
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

export class LogService {
  
  /**
   * Get all logs for a specific execution
   */
  async getExecutionLogs(executionId) {
    try {
      const records = await pb.collection('integration_logs').getFullList({
        filter: `execution_id="${executionId}"`,
        sort: 'timestamp',
        expand: 'integration_id,version_id',
        $autoCancel: false
      });

      return records.map(this._parseMetadata);
    } catch (error) {
      logger.error(`Error fetching logs for execution ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * Get execution details along with its logs
   */
  async getExecutionWithLogs(executionId) {
    try {
      // 1. Fetch execution details
      let execution = null;
      try {
        const executions = await pb.collection('integration_executions').getFullList({
          filter: `execution_id="${executionId}"`,
          $autoCancel: false
        });
        if (executions.length > 0) {
          execution = executions[0];
        }
      } catch (e) {
        logger.warn(`Execution record not found for ${executionId}`);
      }

      // 2. Fetch logs
      const logs = await this.getExecutionLogs(executionId);

      return {
        execution,
        logs
      };
    } catch (error) {
      logger.error(`Error fetching execution with logs for ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * List logs with filtering and pagination
   */
  async listLogs(filters = {}) {
    try {
      const {
        integration_id,
        log_level,
        execution_id,
        trace_id,
        date_from,
        date_to,
        limit = 50,
        offset = 0
      } = filters;

      const filterParts = [];
      if (integration_id) filterParts.push(`integration_id="${integration_id}"`);
      if (log_level) filterParts.push(`log_level="${log_level}"`);
      if (execution_id) filterParts.push(`execution_id="${execution_id}"`);
      if (trace_id) filterParts.push(`trace_id="${trace_id}"`);
      if (date_from) filterParts.push(`timestamp >= "${date_from}"`);
      if (date_to) filterParts.push(`timestamp <= "${date_to}"`);

      const filterString = filterParts.join(' && ');
      const page = Math.floor(offset / limit) + 1;

      const result = await pb.collection('integration_logs').getList(page, limit, {
        filter: filterString,
        sort: '-timestamp',
        expand: 'integration_id,version_id',
        $autoCancel: false
      });

      return {
        items: result.items.map(this._parseMetadata),
        total: result.totalItems,
        page: result.page,
        perPage: result.perPage
      };
    } catch (error) {
      logger.error('Error listing logs:', error);
      throw error;
    }
  }

  /**
   * Get recent error logs across all integrations
   */
  async getErrorLogs(limit = 50) {
    return this.listLogs({ log_level: 'error', limit });
  }

  /**
   * Get recent error logs for a specific integration
   */
  async getIntegrationErrors(integrationId, limit = 50) {
    return this.listLogs({ integration_id: integrationId, log_level: 'error', limit });
  }

  /**
   * Helper to parse metadata_json
   */
  _parseMetadata(record) {
    let parsedMetadata = null;
    if (record.metadata_json) {
      try {
        parsedMetadata = JSON.parse(record.metadata_json);
      } catch (e) {
        parsedMetadata = { raw: record.metadata_json };
      }
    }
    return {
      ...record,
      metadata: parsedMetadata
    };
  }
}

export const logService = new LogService();
