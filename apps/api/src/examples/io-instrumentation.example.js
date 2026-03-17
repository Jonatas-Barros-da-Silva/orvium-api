
/**
 * EXAMPLE: Execution IO Capture Instrumentation
 * 
 * This file demonstrates how to integrate the IORecorder into the 
 * integration execution runtime to capture inputs, outputs, and errors.
 * 
 * ⚠️ DO NOT MODIFY CORE RUNTIME FILES DIRECTLY WITH THIS CODE.
 * This is purely an example of the pattern to use.
 */

import { ioRecorder } from '../execution-io/io.recorder.js';

/**
 * Example wrapper for executing an integration with IO capture
 */
export async function executeIntegrationWithIO(context, actionFn) {
  // 1. Record Input before execution
  // This is non-blocking and will be processed in the background
  ioRecorder.recordExecutionInput({
    execution_id: context.executionId,
    trace_id: context.traceId,
    integration_id: context.integrationId,
    version_id: context.versionId,
    capability: context.capability,
    action: context.action,
    input_payload: context.payload,
    context: {
      workspace_id: context.workspaceId,
      environment: context.environment,
      timestamp: new Date().toISOString()
    }
  });

  try {
    // 2. Execute the actual integration logic
    const result = await actionFn(context);
    
    // 3. Record Output on success
    ioRecorder.recordExecutionOutput({
      execution_id: context.executionId,
      output_payload: result
    });

    return result;

  } catch (error) {
    // 4. Record Error on failure
    ioRecorder.recordExecutionError({
      execution_id: context.executionId,
      error_payload: {
        name: error.name,
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        stack: error.stack,
        details: error.details || null
      }
    });

    throw error;
  }
}
