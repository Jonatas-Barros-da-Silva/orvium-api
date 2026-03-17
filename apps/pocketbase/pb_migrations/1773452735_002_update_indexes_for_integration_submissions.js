/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_submissions");
  collection.indexes.push("CREATE UNIQUE INDEX idx_integration_submissions_composite ON integration_submissions (integration_id, developer_id)");
  collection.indexes.push("CREATE INDEX idx_integration_submissions_status ON integration_submissions (status)");
  collection.indexes.push("CREATE INDEX idx_integration_submissions_developer ON integration_submissions (developer_id)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_submissions");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_integration_submissions_composite"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_integration_submissions_status"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_integration_submissions_developer"));
  return app.save(collection);
})
