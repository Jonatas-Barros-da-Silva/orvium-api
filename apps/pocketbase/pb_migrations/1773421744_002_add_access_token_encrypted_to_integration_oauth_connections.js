/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_oauth_connections");

  const existing = collection.fields.getByName("access_token_encrypted");
  if (existing) {
    if (existing.type === "json") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("access_token_encrypted"); // exists with wrong type, remove first
  }

  collection.fields.add(new JSONField({
    name: "access_token_encrypted",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_oauth_connections");
  collection.fields.removeByName("access_token_encrypted");
  return app.save(collection);
})
