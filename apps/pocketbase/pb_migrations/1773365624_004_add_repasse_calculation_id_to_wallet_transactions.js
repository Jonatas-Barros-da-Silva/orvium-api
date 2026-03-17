/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const pbc_6559446490Collection = app.findCollectionByNameOrId("pbc_6559446490");
  const collection = app.findCollectionByNameOrId("wallet_transactions");

  const existing = collection.fields.getByName("repasse_calculation_id");
  if (existing) {
    if (existing.type === "relation") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("repasse_calculation_id"); // exists with wrong type, remove first
  }

  collection.fields.add(new RelationField({
    name: "repasse_calculation_id",
    required: false,
    collectionId: pbc_6559446490Collection.id,
    maxSelect: 1
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");
  collection.fields.removeByName("repasse_calculation_id");
  return app.save(collection);
})
