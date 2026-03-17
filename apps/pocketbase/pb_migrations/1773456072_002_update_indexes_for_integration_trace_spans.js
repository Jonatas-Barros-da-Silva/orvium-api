/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_trace_spans");
  collection.indexes.push("CREATE INDEX idx_integration_trace_spans_trace_id ON integration_trace_spans (trace_id)");
  collection.indexes.push("CREATE INDEX idx_integration_trace_spans_span_name ON integration_trace_spans (span_name)");
  collection.indexes.push("CREATE INDEX idx_integration_trace_spans_span_type ON integration_trace_spans (span_type)");
  collection.indexes.push("CREATE INDEX idx_integration_trace_spans_duration_ms ON integration_trace_spans (duration_ms)");
  collection.indexes.push("CREATE INDEX idx_integration_trace_spans_status ON integration_trace_spans (status)");
  collection.indexes.push("CREATE INDEX idx_integration_trace_spans_composite ON integration_trace_spans (trace_id, span_type)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_trace_spans");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_integration_trace_spans_trace_id"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_integration_trace_spans_span_name"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_integration_trace_spans_span_type"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_integration_trace_spans_duration_ms"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_integration_trace_spans_status"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_integration_trace_spans_composite"));
  return app.save(collection);
})
