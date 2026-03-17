/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("professionals");

  const existing = collection.fields.getByName("repasse_rule_id");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("repasse_rule_id"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "repasse_rule_id",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("professionals");
  collection.fields.removeByName("repasse_rule_id");
  return app.save(collection);
})
