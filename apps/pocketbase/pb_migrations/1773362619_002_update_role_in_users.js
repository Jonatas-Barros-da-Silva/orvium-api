/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  const field = collection.fields.getByName("role");
  field.values = ["user", "admin", "professional_user"];
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  const field = collection.fields.getByName("role");
  field.values = ["user", "admin"];
  return app.save(collection);
})
