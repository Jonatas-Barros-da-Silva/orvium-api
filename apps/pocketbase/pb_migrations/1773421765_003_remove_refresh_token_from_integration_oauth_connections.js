/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_oauth_connections");
  collection.fields.removeByName("refresh_token");
  return app.save(collection);
}, (app) => {

  const collection = app.findCollectionByNameOrId("integration_oauth_connections");
  collection.fields.add(new TextField({
    name: "refresh_token",
    required: false
  }));
  return app.save(collection);
})
