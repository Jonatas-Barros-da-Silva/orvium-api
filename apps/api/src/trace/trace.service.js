
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

export class TraceService {
  
  async getTrace(traceId) {
    try {
      const traces = await pb.collection('integration_traces').getFullList({
        filter: `trace_id="${traceId}"`,
        expand: 'integration_id,version_id',
        $autoCancel: false
      });

      if (traces.length === 0) {
        return null;
      }

      const trace = traces[0];

      const spans = await pb.collection('integration_trace_spans').getFullList({
        filter: `trace_id="${traceId}"`,
        sort: 'start_time',
        $autoCancel: false
      });

      return {
        ...trace,
        spans: spans.map(this._parseMetadata)
      };
    } catch (error) {
      logger.error(`Error fetching trace ${traceId}:`, error);
      throw error;
    }
  }

  async getExecutionTrace(executionId) {
    try {
      const traces = await pb.collection('integration_traces').getFullList({
        filter: `execution_id="${executionId}"`,
        $autoCancel: false
      });

      if (traces.length === 0) {
        return null;
      }

      return this.getTrace(traces[0].trace_id);
    } catch (error) {
      logger.error(`Error fetching trace for execution ${executionId}:`, error);
      throw error;
    }
  }

  async getSlowTraces(thresholdMs = 5000, limit = 50) {
    try {
      const traces = await pb.collection('integration_traces').getList(1, limit, {
        filter: `total_duration_ms >= ${thresholdMs}`,
        sort: '-total_duration_ms',
        expand: 'integration_id',
        $autoCancel: false
      });

      return traces.items;
    } catch (error) {
      logger.error('Error fetching slow traces:', error);
      throw error;
    }
  }

  async getIntegrationSpanStats(integrationId) {
    try {
      // In a real production system, this would use a dedicated aggregation endpoint or view.
      // For this implementation, we fetch recent traces and aggregate their spans.
      const traces = await pb.collection('integration_traces').getList(1, 100, {
        filter: `integration_id="${integrationId}"`,
        sort: '-created',
        $autoCancel: false
      });

      if (traces.items.length === 0) return [];

      const traceIds = traces.items.map(t => `"${t.trace_id}"`).join(',');
      
      const spans = await pb.collection('integration_trace_spans').getFullList({
        filter: `trace_id ?= [${traceIds}]`,
        $autoCancel: false
      });

      const stats = {};
      spans.forEach(span => {
        if (!stats[span.span_type]) {
          stats[span.span_type] = { type: span.span_type, count: 0, total_duration: 0, max_duration: 0 };
        }
        stats[span.span_type].count++;
        stats[span.span_type].total_duration += (span.duration_ms || 0);
        if ((span.duration_ms || 0) > stats[span.span_type].max_duration) {
          stats[span.span_type].max_duration = span.duration_ms;
        }
      });

      return Object.values(stats).map(s => ({
        ...s,
        avg_duration: s.count > 0 ? Math.round(s.total_duration / s.count) : 0
      }));
    } catch (error) {
      logger.error(`Error fetching span stats for integration ${integrationId}:`, error);
      throw error;
    }
  }

  _parseMetadata(span) {
    let parsedMetadata = null;
    if (span.metadata_json) {
      try {
        parsedMetadata = JSON.parse(span.metadata_json);
      } catch (e) {
        parsedMetadata = { raw: span.metadata_json };
      }
    }
    return {
      ...span,
      metadata: parsedMetadata
    };
  }
}

export const traceService = new TraceService();
