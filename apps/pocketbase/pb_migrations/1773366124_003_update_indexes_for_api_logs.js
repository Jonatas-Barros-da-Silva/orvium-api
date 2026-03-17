/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("api_logs");
  collection.indexes.push("CREATE UNIQUE INDEX idx_api_logs_api_log_id ON api_logs (api_log_id)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("api_logs");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_api_logs_api_log_id"));
  return app.save(collection);
})
