/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_metadata");

  const existing = collection.fields.getByName("timeout_ms");
  if (existing) {
    if (existing.type === "number") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("timeout_ms"); // exists with wrong type, remove first
  }

  collection.fields.add(new NumberField({
    name: "timeout_ms",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_metadata");
  collection.fields.removeByName("timeout_ms");
  return app.save(collection);
})
