/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_execution_context");

  const existing = collection.fields.getByName("missing_permissions");
  if (existing) {
    if (existing.type === "json") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("missing_permissions"); // exists with wrong type, remove first
  }

  collection.fields.add(new JSONField({
    name: "missing_permissions",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_execution_context");
  collection.fields.removeByName("missing_permissions");
  return app.save(collection);
})
