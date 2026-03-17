/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const pbc_3253275158Collection = app.findCollectionByNameOrId("pbc_3253275158");
  const collection = app.findCollectionByNameOrId("automation_logs");

  const existing = collection.fields.getByName("rule_version_id");
  if (existing) {
    if (existing.type === "relation") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("rule_version_id"); // exists with wrong type, remove first
  }

  collection.fields.add(new RelationField({
    name: "rule_version_id",
    required: false,
    collectionId: pbc_3253275158Collection.id,
    maxSelect: 1
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("automation_logs");
  collection.fields.removeByName("rule_version_id");
  return app.save(collection);
})
