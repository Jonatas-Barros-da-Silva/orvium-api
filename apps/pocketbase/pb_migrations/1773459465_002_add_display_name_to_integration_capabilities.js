/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_capabilities");

  const existing = collection.fields.getByName("display_name");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("display_name"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "display_name",
    required: true
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_capabilities");
  collection.fields.removeByName("display_name");
  return app.save(collection);
})
