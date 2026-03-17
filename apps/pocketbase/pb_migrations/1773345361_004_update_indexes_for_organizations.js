/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("organizations");
  collection.indexes.push("CREATE UNIQUE INDEX idx_organizations_organization_id ON organizations (organization_id)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("organizations");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_organizations_organization_id"));
  return app.save(collection);
})
