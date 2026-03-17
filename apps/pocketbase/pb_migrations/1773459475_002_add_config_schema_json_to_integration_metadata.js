/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_metadata");

  const existing = collection.fields.getByName("config_schema_json");
  if (existing) {
    if (existing.type === "json") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("config_schema_json"); // exists with wrong type, remove first
  }

  collection.fields.add(new JSONField({
    name: "config_schema_json",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_metadata");
  collection.fields.removeByName("config_schema_json");
  return app.save(collection);
})
