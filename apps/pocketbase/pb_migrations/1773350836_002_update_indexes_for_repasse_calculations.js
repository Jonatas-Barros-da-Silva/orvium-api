/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("repasse_calculations");
  collection.indexes.push("CREATE UNIQUE INDEX idx_repasse_calculations_id ON repasse_calculations (repasse_calculation_id)");
  collection.indexes.push("CREATE INDEX idx_repasse_calculations_organization ON repasse_calculations (organization_id)");
  collection.indexes.push("CREATE INDEX idx_repasse_calculations_event ON repasse_calculations (event_id)");
  collection.indexes.push("CREATE INDEX idx_repasse_calculations_professional ON repasse_calculations (professional_id)");
  collection.indexes.push("CREATE INDEX idx_repasse_calculations_rule ON repasse_calculations (repasse_rule_id)");
  collection.indexes.push("CREATE INDEX idx_repasse_calculations_status ON repasse_calculations (calculation_status)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("repasse_calculations");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_repasse_calculations_id"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_repasse_calculations_organization"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_repasse_calculations_event"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_repasse_calculations_professional"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_repasse_calculations_rule"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_repasse_calculations_status"));
  return app.save(collection);
})
