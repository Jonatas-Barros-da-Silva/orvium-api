
/**
 * EXAMPLE: Worker Instrumentation for Analytics
 * 
 * This file demonstrates how to integrate the AnalyticsRecorder into the 
 * integration execution runtime (e.g., Sandbox or Dispatcher).
 * 
 * ⚠️ DO NOT MODIFY CORE RUNTIME FILES DIRECTLY WITH THIS CODE.
 * This is purely an example of the pattern to use.
 */

import { analyticsRecorder } from '../analytics/analytics.recorder.js';

/**
 * Categorize an error into standard analytics error types
 * @param {Error} error 
 * @returns {string}
 */
function categorizeError(error) {
  if (!error) return 'unknown_error';
  
  const msg = error.message?.toLowerCase() || '';
  const name = error.name || '';

  if (name === 'ValidationError' || msg.includes('validation')) return 'validation_error';
  if (msg.includes('auth') || msg.includes('unauthorized') || msg.includes('forbidden')) return 'authentication_error';
  if (msg.includes('network') || msg.includes('econnrefused')) return 'network_error';
  if (msg.includes('timeout')) return 'timeout_error';
  
  return 'runtime_error';
}

/**
 * Example wrapper for executing an integration action
 */
export async function executeIntegrationWithAnalytics(context, actionFn) {
  const startedAt = new Date();
  const startTime = process.hrtime.bigint();
  
  let status = 'success';
  let errorDetails = null;

  try {
    // Execute the actual integration logic
    const result = await actionFn(context);
    return result;
    
  } catch (error) {
    status = 'error';
    errorDetails = {
      error_code: error.code || 'ERR_INTERNAL',
      error_type: categorizeError(error),
      error_message: error.message
    };
    throw error;
    
  } finally {
    // Calculate latency
    const endTime = process.hrtime.bigint();
    const latencyMs = Number(endTime - startTime) / 1_000_000;
    const finishedAt = new Date();

    // Record analytics non-blockingly
    analyticsRecorder.recordExecution({
      integration_id: context.integrationId,
      version_id: context.versionId,
      capability: context.capability,
      action: context.action,
      status: status,
      latency_ms: Math.round(latencyMs),
      trigger_type: context.triggerType || 'manual',
      worker_id: process.env.WORKER_ID || 'local-worker',
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      ...errorDetails
    });
  }
}
