/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("units");
  collection.indexes.push("CREATE UNIQUE INDEX idx_units_unit_id ON units (unit_id)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("units");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_units_unit_id"));
  return app.save(collection);
})
