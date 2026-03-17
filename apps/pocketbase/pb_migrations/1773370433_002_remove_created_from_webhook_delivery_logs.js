/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("webhook_delivery_logs");
  collection.fields.removeByName("created");
  return app.save(collection);
}, (app) => {

  const collection = app.findCollectionByNameOrId("webhook_delivery_logs");
  collection.fields.add(new AutodateField({
    name: "created",
    onCreate: true,
    onUpdate: false
  }));
  return app.save(collection);
})
