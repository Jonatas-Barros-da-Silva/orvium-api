/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_app_versions");
  const field = collection.fields.getByName("version");
  field.name = "version_name";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_app_versions");
  const field = collection.fields.getByName("version_name");
  field.name = "version";
  return app.save(collection);
})
