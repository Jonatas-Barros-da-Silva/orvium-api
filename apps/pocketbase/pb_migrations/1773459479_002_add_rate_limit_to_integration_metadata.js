/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_metadata");

  const existing = collection.fields.getByName("rate_limit");
  if (existing) {
    if (existing.type === "number") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("rate_limit"); // exists with wrong type, remove first
  }

  collection.fields.add(new NumberField({
    name: "rate_limit",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_metadata");
  collection.fields.removeByName("rate_limit");
  return app.save(collection);
})
