/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("capability_actions");

  const existing = collection.fields.getByName("output_schema_json");
  if (existing) {
    if (existing.type === "json") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("output_schema_json"); // exists with wrong type, remove first
  }

  collection.fields.add(new JSONField({
    name: "output_schema_json",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("capability_actions");
  collection.fields.removeByName("output_schema_json");
  return app.save(collection);
})
