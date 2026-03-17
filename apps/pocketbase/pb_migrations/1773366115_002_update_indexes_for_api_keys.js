/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("api_keys");
  collection.indexes.push("CREATE UNIQUE INDEX idx_api_keys_api_key_id ON api_keys (api_key_id)");
  collection.indexes.push("CREATE UNIQUE INDEX idx_api_keys_api_key ON api_keys (api_key)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("api_keys");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_api_keys_api_key_id"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_api_keys_api_key"));
  return app.save(collection);
})
