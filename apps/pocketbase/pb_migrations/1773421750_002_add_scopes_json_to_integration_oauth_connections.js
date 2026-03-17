/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_oauth_connections");

  const existing = collection.fields.getByName("scopes_json");
  if (existing) {
    if (existing.type === "json") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("scopes_json"); // exists with wrong type, remove first
  }

  collection.fields.add(new JSONField({
    name: "scopes_json",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_oauth_connections");
  collection.fields.removeByName("scopes_json");
  return app.save(collection);
})
