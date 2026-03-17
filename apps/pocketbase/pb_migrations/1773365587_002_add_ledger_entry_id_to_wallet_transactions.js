/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const pbc_8438530157Collection = app.findCollectionByNameOrId("pbc_8438530157");
  const collection = app.findCollectionByNameOrId("wallet_transactions");

  const existing = collection.fields.getByName("ledger_entry_id");
  if (existing) {
    if (existing.type === "relation") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("ledger_entry_id"); // exists with wrong type, remove first
  }

  collection.fields.add(new RelationField({
    name: "ledger_entry_id",
    required: false,
    collectionId: pbc_8438530157Collection.id,
    maxSelect: 1
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");
  collection.fields.removeByName("ledger_entry_id");
  return app.save(collection);
})
