
import crypto from 'crypto';
import { traceRecorder } from './trace.recorder.js';

export class Span {
  constructor(traceId, name, type) {
    this.traceId = traceId;
    this.name = name;
    this.type = type;
    this.startTime = new Date();
    this.startHrTime = process.hrtime.bigint();
    this.status = 'started';
    
    // Record start non-blockingly
    this.internalId = traceRecorder.recordSpanStart({
      trace_id: this.traceId,
      span_name: this.name,
      span_type: this.type,
      start_time: this.startTime.toISOString()
    });
  }

  finish(status = 'completed', metadata = null) {
    this.status = status;
    const endTime = new Date();
    const endHrTime = process.hrtime.bigint();
    const durationMs = Number(endHrTime - this.startHrTime) / 1_000_000;

    traceRecorder.recordSpanFinish(this.internalId, {
      end_time: endTime.toISOString(),
      duration_ms: Math.round(durationMs),
      status: this.status,
      metadata
    });

    return durationMs;
  }
}

export class TraceContext {
  constructor(executionId, integrationId, versionId) {
    this.traceId = crypto.randomUUID();
    this.executionId = executionId;
    this.integrationId = integrationId;
    this.versionId = versionId;
    this.startTime = new Date();
    this.startHrTime = process.hrtime.bigint();
    this.spans = [];
    this.status = 'started';

    this.internalId = traceRecorder.recordTraceStart({
      trace_id: this.traceId,
      execution_id: this.executionId,
      integration_id: this.integrationId,
      version_id: this.versionId,
      started_at: this.startTime.toISOString()
    });
  }

  createSpan(name, type) {
    const span = new Span(this.traceId, name, type);
    this.spans.push(span);
    return span;
  }

  finish(status = 'completed') {
    this.status = status;
    const endTime = new Date();
    const endHrTime = process.hrtime.bigint();
    const durationMs = Number(endHrTime - this.startHrTime) / 1_000_000;

    traceRecorder.recordTraceFinish(this.internalId, {
      status: this.status,
      finished_at: endTime.toISOString(),
      total_duration_ms: Math.round(durationMs),
      span_count: this.spans.length
    });

    return this.getSummary();
  }

  getSummary() {
    return {
      trace_id: this.traceId,
      execution_id: this.executionId,
      status: this.status,
      span_count: this.spans.length
    };
  }
}
