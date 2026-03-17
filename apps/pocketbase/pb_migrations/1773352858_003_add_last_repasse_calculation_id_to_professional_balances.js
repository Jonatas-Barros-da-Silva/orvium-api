/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("professional_balances");

  const existing = collection.fields.getByName("last_repasse_calculation_id");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("last_repasse_calculation_id"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "last_repasse_calculation_id"
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("professional_balances");
  collection.fields.removeByName("last_repasse_calculation_id");
  return app.save(collection);
})
