/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_execution_context");

  const existing = collection.fields.getByName("required_permissions");
  if (existing) {
    if (existing.type === "json") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("required_permissions"); // exists with wrong type, remove first
  }

  collection.fields.add(new JSONField({
    name: "required_permissions",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_execution_context");
  collection.fields.removeByName("required_permissions");
  return app.save(collection);
})
