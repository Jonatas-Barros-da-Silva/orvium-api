/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const financial_eventsCollection = app.findCollectionByNameOrId("financial_events");
  const collection = app.findCollectionByNameOrId("wallet_transactions");

  const existing = collection.fields.getByName("financial_event");
  if (existing) {
    if (existing.type === "relation") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("financial_event"); // exists with wrong type, remove first
  }

  collection.fields.add(new RelationField({
    name: "financial_event",
    required: false,
    collectionId: financial_eventsCollection.id,
    maxSelect: 1
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");
  collection.fields.removeByName("financial_event");
  return app.save(collection);
})
