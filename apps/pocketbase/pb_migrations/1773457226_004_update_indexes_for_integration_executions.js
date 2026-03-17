/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_executions");
  collection.indexes.push("CREATE INDEX idx_integration_executions_replay_of ON integration_executions (replay_of_execution_id)");
  collection.indexes.push("CREATE INDEX idx_integration_executions_replay_source ON integration_executions (replay_source)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_executions");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_integration_executions_replay_of"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_integration_executions_replay_source"));
  return app.save(collection);
})
