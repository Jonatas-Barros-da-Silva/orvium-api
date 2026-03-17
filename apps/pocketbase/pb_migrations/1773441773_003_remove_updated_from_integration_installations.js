/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_installations");
  collection.fields.removeByName("updated");
  return app.save(collection);
}, (app) => {

  const collection = app.findCollectionByNameOrId("integration_installations");
  collection.fields.add(new AutodateField({
    name: "updated",
    onCreate: true,
    onUpdate: true
  }));
  return app.save(collection);
})
