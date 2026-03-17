/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_metadata");
  collection.fields.removeByName("updated_at");
  return app.save(collection);
}, (app) => {

  const collection = app.findCollectionByNameOrId("integration_metadata");
  collection.fields.add(new AutodateField({
    name: "updated_at",
    onCreate: true,
    onUpdate: true
  }));
  return app.save(collection);
})
