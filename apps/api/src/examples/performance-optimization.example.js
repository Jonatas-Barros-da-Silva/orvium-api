
/**
 * EXAMPLE: Performance Optimization Patterns
 * 
 * This file demonstrates how to use the caching, sampling, and metrics
 * systems within the integration runtime to optimize performance.
 */

import { integrationCache } from '../cache/integration.cache.js';
import { TraceSampler } from '../performance/trace.sampler.js';
import { runtimeMetrics } from '../performance/runtime.metrics.js';

/**
 * Example 1: Using the Integration Cache
 * Instead of querying the database directly for static metadata,
 * use the cache which has a 60s TTL.
 */
export async function resolveIntegrationCapabilities(versionId) {
  // This will hit the in-memory cache first, falling back to DB if missing
  const capabilities = await integrationCache.getCapabilities(versionId);
  return capabilities;
}

/**
 * Example 2: Trace Sampling
 * Don't trace every single execution to save DB writes and storage.
 * Use the sampler which respects the configured sampling rate.
 */
export async function executeWithSampling(context, actionFn) {
  const startTime = Date.now();
  let isFailure = false;
  let error = null;
  
  try {
    const result = await actionFn(context);
    return result;
  } catch (err) {
    isFailure = true;
    error = err;
    throw err;
  } finally {
    const latencyMs = Date.now() - startTime;
    
    // 1. Record metrics (always done, very fast in-memory operation)
    runtimeMetrics.recordExecution({
      id: context.executionId,
      integrationName: context.integrationName,
      status: isFailure ? 'failed' : 'success',
      latencyMs,
      error: error ? error.message : null
    });

    // 2. Check if we should trace this execution
    if (TraceSampler.shouldTrace(isFailure)) {
      // Write trace to database
      // traceRecorder.record(...)
    }

    // 3. Check if we should capture IO payloads
    if (TraceSampler.shouldCaptureIO(isFailure)) {
      // Write IO to database
      // ioRecorder.record(...)
    }
  }
}

/**
 * Example 3: Cache Invalidation
 * When an entity is updated, invalidate its cache entry immediately.
 */
export async function updateIntegrationApp(appId, updates) {
  // Update DB
  // await pb.collection('integration_apps').update(appId, updates);
  
  // Invalidate cache so next read fetches fresh data
  integrationCache.invalidateApp(appId);
}
