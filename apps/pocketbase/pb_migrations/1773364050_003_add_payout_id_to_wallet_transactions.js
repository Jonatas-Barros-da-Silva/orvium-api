/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");

  const existing = collection.fields.getByName("payout_id");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("payout_id"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "payout_id",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");
  collection.fields.removeByName("payout_id");
  return app.save(collection);
})
