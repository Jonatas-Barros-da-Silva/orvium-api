
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

export class AnalyticsService {
  
  /**
   * Get metrics for a specific integration
   */
  async getIntegrationMetrics(integrationId) {
    try {
      // Fetch recent executions for aggregation (in a real app, use a dedicated aggregation query/view)
      const records = await pb.collection('integration_executions').getFullList({
        filter: `integration_id="${integrationId}"`,
        sort: '-created',
        $autoCancel: false
      });

      return this._calculateMetrics(records);
    } catch (error) {
      logger.error(`Error fetching metrics for integration ${integrationId}:`, error);
      throw error;
    }
  }

  /**
   * Get overall platform metrics
   */
  async getPlatformMetrics() {
    try {
      // Fetch recent executions
      const records = await pb.collection('integration_executions').getFullList({
        sort: '-created',
        $autoCancel: false
      });

      // Fetch total integrations
      const integrations = await pb.collection('integration_apps').getList(1, 1, { $autoCancel: false });

      const metrics = this._calculateMetrics(records);
      
      // Calculate executions today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const executionsToday = records.filter(r => new Date(r.created) >= today).length;

      return {
        ...metrics,
        total_integrations: integrations.totalItems,
        executions_today: executionsToday
      };
    } catch (error) {
      logger.error('Error fetching platform metrics:', error);
      throw error;
    }
  }

  /**
   * Get metrics broken down by capability for an integration
   */
  async getCapabilityMetrics(integrationId) {
    try {
      const records = await pb.collection('integration_executions').getFullList({
        filter: `integration_id="${integrationId}"`,
        $autoCancel: false
      });

      const capabilities = {};

      records.forEach(r => {
        if (!capabilities[r.capability]) {
          capabilities[r.capability] = {
            capability: r.capability,
            total_executions: 0,
            success_count: 0,
            total_latency: 0
          };
        }
        
        const cap = capabilities[r.capability];
        cap.total_executions++;
        cap.total_latency += r.latency_ms;
        if (r.status === 'success') cap.success_count++;
      });

      return Object.values(capabilities).map(cap => ({
        ...cap,
        success_rate: cap.total_executions > 0 ? (cap.success_count / cap.total_executions) * 100 : 0,
        avg_latency: cap.total_executions > 0 ? cap.total_latency / cap.total_executions : 0
      }));
    } catch (error) {
      logger.error(`Error fetching capability metrics for ${integrationId}:`, error);
      throw error;
    }
  }

  /**
   * List executions with filtering and pagination
   */
  async listExecutions(filters = {}) {
    try {
      const {
        integration_id,
        status,
        capability,
        action,
        error_type,
        trigger_type,
        date_from,
        date_to,
        limit = 50,
        offset = 0
      } = filters;

      const filterParts = [];
      if (integration_id) filterParts.push(`integration_id="${integration_id}"`);
      if (status) filterParts.push(`status="${status}"`);
      if (capability) filterParts.push(`capability="${capability}"`);
      if (action) filterParts.push(`action="${action}"`);
      if (error_type) filterParts.push(`error_type="${error_type}"`);
      if (trigger_type) filterParts.push(`trigger_type="${trigger_type}"`);
      if (date_from) filterParts.push(`created >= "${date_from}"`);
      if (date_to) filterParts.push(`created <= "${date_to}"`);

      const filterString = filterParts.join(' && ');
      const page = Math.floor(offset / limit) + 1;

      const result = await pb.collection('integration_executions').getList(page, limit, {
        filter: filterString,
        sort: '-created',
        $autoCancel: false
      });

      return {
        items: result.items,
        total: result.totalItems,
        page: result.page,
        perPage: result.perPage
      };
    } catch (error) {
      logger.error('Error listing executions:', error);
      throw error;
    }
  }

  /**
   * Internal helper to calculate metrics from a set of records
   */
  _calculateMetrics(records) {
    const total_executions = records.length;
    let success_count = 0;
    let failure_count = 0;
    let total_latency = 0;
    let min_latency = Infinity;
    let max_latency = 0;
    
    const error_breakdown = {};
    const executions_by_status = { success: 0, failure: 0, timeout: 0, error: 0 };
    const executions_by_trigger = { automation: 0, manual: 0, webhook: 0, scheduled: 0 };

    records.forEach(r => {
      // Status counts
      if (executions_by_status[r.status] !== undefined) {
        executions_by_status[r.status]++;
      }
      
      if (r.status === 'success') success_count++;
      else failure_count++;

      // Trigger counts
      if (executions_by_trigger[r.trigger_type] !== undefined) {
        executions_by_trigger[r.trigger_type]++;
      }

      // Latency
      total_latency += r.latency_ms;
      if (r.latency_ms < min_latency) min_latency = r.latency_ms;
      if (r.latency_ms > max_latency) max_latency = r.latency_ms;

      // Errors
      if (r.status !== 'success' && r.error_type) {
        error_breakdown[r.error_type] = (error_breakdown[r.error_type] || 0) + 1;
      }
    });

    if (min_latency === Infinity) min_latency = 0;

    return {
      total_executions,
      success_count,
      failure_count,
      success_rate: total_executions > 0 ? (success_count / total_executions) * 100 : 0,
      failure_rate: total_executions > 0 ? (failure_count / total_executions) * 100 : 0,
      avg_latency: total_executions > 0 ? total_latency / total_executions : 0,
      min_latency,
      max_latency,
      error_breakdown,
      executions_by_status,
      executions_by_trigger
    };
  }
}

export const analyticsService = new AnalyticsService();
