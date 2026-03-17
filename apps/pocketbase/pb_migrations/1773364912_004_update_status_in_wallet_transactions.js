/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");
  const field = collection.fields.getByName("status");
  field.values = ["pending", "completed", "failed"];
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");
  const field = collection.fields.getByName("status");
  field.values = ["pending", "completed", "failed"];
  return app.save(collection);
})
