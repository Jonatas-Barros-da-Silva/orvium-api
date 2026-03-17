/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_traces");
  collection.indexes.push("CREATE UNIQUE INDEX idx_integration_traces_trace_id ON integration_traces (trace_id)");
  collection.indexes.push("CREATE INDEX idx_integration_traces_execution_id ON integration_traces (execution_id)");
  collection.indexes.push("CREATE INDEX idx_integration_traces_integration_id ON integration_traces (integration_id)");
  collection.indexes.push("CREATE INDEX idx_integration_traces_status ON integration_traces (status)");
  collection.indexes.push("CREATE INDEX idx_integration_traces_started_at ON integration_traces (started_at)");
  collection.indexes.push("CREATE INDEX idx_integration_traces_total_duration_ms ON integration_traces (total_duration_ms)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_traces");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_integration_traces_trace_id"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_integration_traces_execution_id"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_integration_traces_integration_id"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_integration_traces_status"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_integration_traces_started_at"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_integration_traces_total_duration_ms"));
  return app.save(collection);
})
