/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("financial_ledger_entries");

  const existing = collection.fields.getByName("ledger_type");
  if (existing) {
    if (existing.type === "select") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("ledger_type"); // exists with wrong type, remove first
  }

  collection.fields.add(new SelectField({
    name: "ledger_type",
    required: true,
    values: ["REPASSE_CREDIT", "PAYOUT_DEDUCTION", "ADJUSTMENT", "REFUND"]
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("financial_ledger_entries");
  collection.fields.removeByName("ledger_type");
  return app.save(collection);
})
