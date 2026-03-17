/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const repasse_calculationsCollection = app.findCollectionByNameOrId("repasse_calculations");
  const collection = app.findCollectionByNameOrId("wallet_transactions");

  const existing = collection.fields.getByName("repasse_calculation");
  if (existing) {
    if (existing.type === "relation") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("repasse_calculation"); // exists with wrong type, remove first
  }

  collection.fields.add(new RelationField({
    name: "repasse_calculation",
    required: false,
    collectionId: repasse_calculationsCollection.id,
    maxSelect: 1
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");
  collection.fields.removeByName("repasse_calculation");
  return app.save(collection);
})
