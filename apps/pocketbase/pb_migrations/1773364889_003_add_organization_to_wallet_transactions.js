/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const organizationsCollection = app.findCollectionByNameOrId("organizations");
  const collection = app.findCollectionByNameOrId("wallet_transactions");

  const existing = collection.fields.getByName("organization");
  if (existing) {
    if (existing.type === "relation") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("organization"); // exists with wrong type, remove first
  }

  collection.fields.add(new RelationField({
    name: "organization",
    required: true,
    collectionId: organizationsCollection.id,
    maxSelect: 1
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");
  collection.fields.removeByName("organization");
  return app.save(collection);
})
