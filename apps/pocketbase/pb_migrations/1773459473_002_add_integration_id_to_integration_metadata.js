/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const pbc_8238442555Collection = app.findCollectionByNameOrId("pbc_8238442555");
  const collection = app.findCollectionByNameOrId("integration_metadata");

  const existing = collection.fields.getByName("integration_id");
  if (existing) {
    if (existing.type === "relation") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("integration_id"); // exists with wrong type, remove first
  }

  collection.fields.add(new RelationField({
    name: "integration_id",
    required: true,
    collectionId: pbc_8238442555Collection.id
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_metadata");
  collection.fields.removeByName("integration_id");
  return app.save(collection);
})
