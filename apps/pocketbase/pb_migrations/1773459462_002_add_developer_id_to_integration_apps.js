/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_apps");

  const existing = collection.fields.getByName("developer_id");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("developer_id"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "developer_id",
    required: true
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_apps");
  collection.fields.removeByName("developer_id");
  return app.save(collection);
})
