/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const payoutsCollection = app.findCollectionByNameOrId("payouts");
  const collection = app.findCollectionByNameOrId("wallet_transactions");

  const existing = collection.fields.getByName("payout");
  if (existing) {
    if (existing.type === "relation") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("payout"); // exists with wrong type, remove first
  }

  collection.fields.add(new RelationField({
    name: "payout",
    required: false,
    collectionId: payoutsCollection.id,
    maxSelect: 1
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");
  collection.fields.removeByName("payout");
  return app.save(collection);
})
