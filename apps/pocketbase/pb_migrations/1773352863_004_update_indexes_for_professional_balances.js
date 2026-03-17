/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("professional_balances");
  collection.indexes.push("CREATE UNIQUE INDEX idx_professional_balances_composite ON professional_balances (organization_id, professional_id)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("professional_balances");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_professional_balances_composite"));
  return app.save(collection);
})
