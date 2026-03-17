/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_oauth_connections");

  const existing = collection.fields.getByName("expires_at_datetime");
  if (existing) {
    if (existing.type === "date") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("expires_at_datetime"); // exists with wrong type, remove first
  }

  collection.fields.add(new DateField({
    name: "expires_at_datetime",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_oauth_connections");
  collection.fields.removeByName("expires_at_datetime");
  return app.save(collection);
})
