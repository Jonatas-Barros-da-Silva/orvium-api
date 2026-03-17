/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const professional_walletsCollection = app.findCollectionByNameOrId("professional_wallets");
  const collection = app.findCollectionByNameOrId("wallet_balances");

  const existing = collection.fields.getByName("wallet");
  if (existing) {
    if (existing.type === "relation") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("wallet"); // exists with wrong type, remove first
  }

  collection.fields.add(new RelationField({
    name: "wallet",
    required: true,
    collectionId: professional_walletsCollection.id,
    maxSelect: 1
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("wallet_balances");
  collection.fields.removeByName("wallet");
  return app.save(collection);
})
