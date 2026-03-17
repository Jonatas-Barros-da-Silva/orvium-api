
/**
 * EXAMPLE: Distributed Tracing Instrumentation
 * 
 * This file demonstrates how to integrate the TraceContext into the 
 * integration execution runtime to track distributed spans.
 * 
 * ⚠️ DO NOT MODIFY CORE RUNTIME FILES DIRECTLY WITH THIS CODE.
 * This is purely an example of the pattern to use.
 */

import { TraceContext } from '../trace/trace.context.js';

/**
 * Example wrapper for executing an integration with full tracing
 */
export async function executeIntegrationWithTracing(context, actionFn) {
  // 1. Initialize Trace Context
  const trace = new TraceContext(
    context.executionId,
    context.integrationId,
    context.versionId
  );

  try {
    // 2. Span: Integration Resolution
    const resolveSpan = trace.createSpan('Resolve Integration', 'integration_resolution');
    // ... resolution logic ...
    await new Promise(r => setTimeout(r, 10)); // simulate work
    resolveSpan.finish('completed', { resolved_version: context.versionId });

    // 3. Span: Sandbox Execution
    const sandboxSpan = trace.createSpan('Execute Sandbox', 'sandbox_execution');
    
    try {
      // 4. Span: External API Call (nested inside sandbox)
      const apiSpan = trace.createSpan('Fetch External Data', 'external_api_call');
      // ... api call logic ...
      await new Promise(r => setTimeout(r, 150)); // simulate network
      apiSpan.finish('completed', { url: 'https://api.example.com/data', status: 200 });

      // Execute the actual integration logic
      const result = await actionFn(context);
      
      sandboxSpan.finish('completed');
      
      // 5. Span: Execution Completed
      const completeSpan = trace.createSpan('Finalize Execution', 'execution_completed');
      completeSpan.finish('completed');

      // Finish Trace
      trace.finish('completed');
      return result;

    } catch (sandboxError) {
      sandboxSpan.finish('failed', { error: sandboxError.message });
      throw sandboxError;
    }

  } catch (error) {
    // Span: Execution Failed
    const failSpan = trace.createSpan('Handle Failure', 'execution_failed');
    failSpan.finish('completed', { error_code: error.code });

    // Finish Trace as failed
    trace.finish('failed');
    throw error;
  }
}
