/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("procedures");
  collection.indexes.push("CREATE UNIQUE INDEX idx_procedures_procedure_id ON procedures (procedure_id)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("procedures");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_procedures_procedure_id"));
  return app.save(collection);
})
