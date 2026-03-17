/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("financial_ledger_entries");
  const field = collection.fields.getByName("professional_id");
  field.required = true;
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("financial_ledger_entries");
  const field = collection.fields.getByName("professional_id");
  field.required = true;
  return app.save(collection);
})
