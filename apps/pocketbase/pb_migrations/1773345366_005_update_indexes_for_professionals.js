/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("professionals");
  collection.indexes.push("CREATE UNIQUE INDEX idx_professionals_professional_id ON professionals (professional_id)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("professionals");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_professionals_professional_id"));
  return app.save(collection);
})
