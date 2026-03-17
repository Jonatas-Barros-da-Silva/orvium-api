/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");
  const field = collection.fields.getByName("amount");
  field.min = 0;
  field.required = true;
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");
  const field = collection.fields.getByName("amount");
  field.min = None;
  field.required = true;
  return app.save(collection);
})
