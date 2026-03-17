/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("financial_ledger_entries");

  const existing = collection.fields.getByName("reference_id");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("reference_id"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "reference_id",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("financial_ledger_entries");
  collection.fields.removeByName("reference_id");
  return app.save(collection);
})
