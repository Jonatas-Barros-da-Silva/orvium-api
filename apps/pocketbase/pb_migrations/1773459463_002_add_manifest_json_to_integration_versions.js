/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_versions");

  const existing = collection.fields.getByName("manifest_json");
  if (existing) {
    if (existing.type === "json") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("manifest_json"); // exists with wrong type, remove first
  }

  collection.fields.add(new JSONField({
    name: "manifest_json",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_versions");
  collection.fields.removeByName("manifest_json");
  return app.save(collection);
})
