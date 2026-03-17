/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("professional_balances");
  const field = collection.fields.getByName("current_balance");
  field.required = true;
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("professional_balances");
  const field = collection.fields.getByName("current_balance");
  field.required = false;
  return app.save(collection);
})
