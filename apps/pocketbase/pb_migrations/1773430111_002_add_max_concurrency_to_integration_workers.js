/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_workers");

  const existing = collection.fields.getByName("max_concurrency");
  if (existing) {
    if (existing.type === "number") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("max_concurrency"); // exists with wrong type, remove first
  }

  collection.fields.add(new NumberField({
    name: "max_concurrency",
    required: true,
    min: 1
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_workers");
  collection.fields.removeByName("max_concurrency");
  return app.save(collection);
})
