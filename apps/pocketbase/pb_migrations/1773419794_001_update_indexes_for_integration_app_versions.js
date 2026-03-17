/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_app_versions");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_integration_app_versions_version"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_integration_app_versions_composite"));
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_app_versions");
  collection.indexes.push("CREATE INDEX idx_integration_app_versions_version ON integration_app_versions (version)");
  collection.indexes.push("CREATE UNIQUE INDEX idx_integration_app_versions_composite ON integration_app_versions (app_id, version)");
  return app.save(collection);
})
