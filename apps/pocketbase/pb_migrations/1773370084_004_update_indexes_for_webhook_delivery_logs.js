/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("webhook_delivery_logs");
  collection.indexes.push("CREATE INDEX idx_webhook_delivery_logs_subscription_id ON webhook_delivery_logs (subscription_id)");
  collection.indexes.push("CREATE INDEX idx_webhook_delivery_logs_event_id ON webhook_delivery_logs (event_id)");
  collection.indexes.push("CREATE INDEX idx_webhook_delivery_logs_status ON webhook_delivery_logs (status)");
  collection.indexes.push("CREATE INDEX idx_webhook_delivery_logs_created_at ON webhook_delivery_logs (created_at)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("webhook_delivery_logs");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_webhook_delivery_logs_subscription_id"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_webhook_delivery_logs_event_id"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_webhook_delivery_logs_status"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_webhook_delivery_logs_created_at"));
  return app.save(collection);
})
