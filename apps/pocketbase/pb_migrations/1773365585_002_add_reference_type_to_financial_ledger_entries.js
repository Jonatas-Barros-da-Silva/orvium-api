/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("financial_ledger_entries");

  const existing = collection.fields.getByName("reference_type");
  if (existing) {
    if (existing.type === "select") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("reference_type"); // exists with wrong type, remove first
  }

  collection.fields.add(new SelectField({
    name: "reference_type",
    required: false,
    values: ["repasse_calculation", "payout", "adjustment", "refund"]
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("financial_ledger_entries");
  collection.fields.removeByName("reference_type");
  return app.save(collection);
})
