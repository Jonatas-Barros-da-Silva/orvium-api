
import { globalCache } from '../cache/cache.manager.js';
import { runtimeConfig } from '../config/runtime.config.js';
import { TraceSampler } from './trace.sampler.js';

class RuntimeMetrics {
  constructor() {
    this.startTime = Date.now();
    this.recentExecutions = [];
    this.maxStoredExecutions = 1000;
    
    // Aggregate stats
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      totalLatencyMs: 0
    };
  }

  /**
   * Record an execution for metrics tracking
   * @param {Object} data - { id, integrationName, status, latencyMs, error }
   */
  recordExecution(data) {
    const execution = {
      ...data,
      timestamp: Date.now()
    };

    this.recentExecutions.push(execution);
    
    // Maintain buffer size
    if (this.recentExecutions.length > this.maxStoredExecutions) {
      this.recentExecutions.shift();
    }

    // Update aggregates
    this.stats.totalExecutions++;
    this.stats.totalLatencyMs += (data.latencyMs || 0);
    
    if (data.status === 'success' || data.status === 'completed') {
      this.stats.successfulExecutions++;
    } else if (data.status === 'failed' || data.status === 'error') {
      this.stats.failedExecutions++;
    }
  }

  getMetrics() {
    const uptimeMs = Date.now() - this.startTime;
    const avgLatency = this.stats.totalExecutions > 0 
      ? Math.round(this.stats.totalLatencyMs / this.stats.totalExecutions) 
      : 0;
      
    const successRate = this.stats.totalExecutions > 0
      ? ((this.stats.successfulExecutions / this.stats.totalExecutions) * 100).toFixed(2)
      : 100;

    return {
      uptime_seconds: Math.floor(uptimeMs / 1000),
      executions: {
        total: this.stats.totalExecutions,
        success: this.stats.successfulExecutions,
        failed: this.stats.failedExecutions,
        success_rate: parseFloat(successRate),
        avg_latency_ms: avgLatency
      },
      cache: globalCache.getStats(),
      config: {
        worker: {
          concurrency: runtimeConfig.worker_concurrency,
          timeout_ms: runtimeConfig.worker_timeout_ms
        },
        queue: {
          batch_size: runtimeConfig.queue_batch_size,
          poll_interval_ms: runtimeConfig.queue_poll_interval_ms
        },
        sampling: TraceSampler.getConfig()
      }
    };
  }

  getSlowExecutions() {
    const threshold = runtimeConfig.slow_execution_threshold_ms;
    return this.recentExecutions
      .filter(ex => ex.latencyMs >= threshold)
      .sort((a, b) => b.latencyMs - a.latencyMs)
      .slice(0, 50); // Return top 50 slowest
  }

  getWorkerUtilization() {
    // In a real system, this would query active worker threads.
    // Here we estimate based on recent executions in the last minute.
    const oneMinuteAgo = Date.now() - 60000;
    const recentMinuteExecutions = this.recentExecutions.filter(ex => ex.timestamp >= oneMinuteAgo);
    
    const count = recentMinuteExecutions.length;
    const avgLatency = count > 0 
      ? recentMinuteExecutions.reduce((sum, ex) => sum + ex.latencyMs, 0) / count 
      : 0;

    // Little's Law estimation: L = λW
    // Active requests = (requests/sec) * (avg latency in sec)
    const requestsPerSec = count / 60;
    const avgLatencySec = avgLatency / 1000;
    const estimatedActive = requestsPerSec * avgLatencySec;
    
    const utilizationPct = Math.min(100, (estimatedActive / runtimeConfig.worker_concurrency) * 100);

    return {
      estimated_utilization_pct: parseFloat(utilizationPct.toFixed(2)),
      estimated_active_workers: parseFloat(estimatedActive.toFixed(2)),
      max_concurrency: runtimeConfig.worker_concurrency,
      recent_minute_executions: count,
      recent_avg_latency_ms: Math.round(avgLatency)
    };
  }
}

export const runtimeMetrics = new RuntimeMetrics();
