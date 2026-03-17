/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_metadata");

  const existing = collection.fields.getByName("authentication_type");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("authentication_type"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "authentication_type",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_metadata");
  collection.fields.removeByName("authentication_type");
  return app.save(collection);
})
