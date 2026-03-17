/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_installations");

  const existing = collection.fields.getByName("updated");
  if (existing) {
    if (existing.type === "autodate") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("updated"); // exists with wrong type, remove first
  }

  collection.fields.add(new AutodateField({
    name: "updated",
    onCreate: true,
    onUpdate: true
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_installations");
  collection.fields.removeByName("updated");
  return app.save(collection);
})
