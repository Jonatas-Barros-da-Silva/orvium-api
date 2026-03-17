/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("event_subscriptions");
  collection.indexes.push("CREATE UNIQUE INDEX idx_event_subscriptions_secret ON event_subscriptions (secret)");
  collection.indexes.push("CREATE INDEX idx_event_subscriptions_workspace_id ON event_subscriptions (workspace_id)");
  collection.indexes.push("CREATE INDEX idx_event_subscriptions_event_type ON event_subscriptions (event_type)");
  collection.indexes.push("CREATE INDEX idx_event_subscriptions_status ON event_subscriptions (status)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("event_subscriptions");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_event_subscriptions_secret"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_event_subscriptions_workspace_id"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_event_subscriptions_event_type"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_event_subscriptions_status"));
  return app.save(collection);
})
