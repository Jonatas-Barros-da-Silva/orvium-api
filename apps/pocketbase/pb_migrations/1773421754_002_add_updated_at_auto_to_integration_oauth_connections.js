/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_oauth_connections");

  const existing = collection.fields.getByName("updated_at_auto");
  if (existing) {
    if (existing.type === "autodate") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("updated_at_auto"); // exists with wrong type, remove first
  }

  collection.fields.add(new AutodateField({
    name: "updated_at_auto",
    onCreate: true,
    onUpdate: true
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_oauth_connections");
  collection.fields.removeByName("updated_at_auto");
  return app.save(collection);
})
