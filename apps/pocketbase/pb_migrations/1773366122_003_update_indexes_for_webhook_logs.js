/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("webhook_logs");
  collection.indexes.push("CREATE UNIQUE INDEX idx_webhook_logs_webhook_log_id ON webhook_logs (webhook_log_id)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("webhook_logs");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_webhook_logs_webhook_log_id"));
  return app.save(collection);
})
