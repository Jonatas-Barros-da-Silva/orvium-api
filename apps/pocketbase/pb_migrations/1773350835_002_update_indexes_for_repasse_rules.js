/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("repasse_rules");
  collection.indexes.push("CREATE UNIQUE INDEX idx_repasse_rules_composite ON repasse_rules (organization_id, repasse_rule_id)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("repasse_rules");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_repasse_rules_composite"));
  return app.save(collection);
})
