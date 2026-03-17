/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const pbc_3006407302Collection = app.findCollectionByNameOrId("pbc_3006407302");
  const collection = app.findCollectionByNameOrId("wallet_transactions");

  const existing = collection.fields.getByName("payout_id");
  if (existing) {
    if (existing.type === "relation") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("payout_id"); // exists with wrong type, remove first
  }

  collection.fields.add(new RelationField({
    name: "payout_id",
    required: false,
    collectionId: pbc_3006407302Collection.id,
    maxSelect: 1
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");
  collection.fields.removeByName("payout_id");
  return app.save(collection);
})
