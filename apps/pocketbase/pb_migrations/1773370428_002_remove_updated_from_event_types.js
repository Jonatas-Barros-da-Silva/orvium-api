/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("event_types");
  collection.fields.removeByName("updated");
  return app.save(collection);
}, (app) => {

  const collection = app.findCollectionByNameOrId("event_types");
  collection.fields.add(new AutodateField({
    name: "updated",
    onCreate: true,
    onUpdate: true
  }));
  return app.save(collection);
})
