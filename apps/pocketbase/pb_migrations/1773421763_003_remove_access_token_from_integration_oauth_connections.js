/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_oauth_connections");
  collection.fields.removeByName("access_token");
  return app.save(collection);
}, (app) => {

  const collection = app.findCollectionByNameOrId("integration_oauth_connections");
  collection.fields.add(new TextField({
    name: "access_token",
    required: true
  }));
  return app.save(collection);
})
