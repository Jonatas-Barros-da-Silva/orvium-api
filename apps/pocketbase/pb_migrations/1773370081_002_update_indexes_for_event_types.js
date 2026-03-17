/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("event_types");
  collection.indexes.push("CREATE UNIQUE INDEX idx_event_types_event_name ON event_types (event_name)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("event_types");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_event_types_event_name"));
  return app.save(collection);
})
