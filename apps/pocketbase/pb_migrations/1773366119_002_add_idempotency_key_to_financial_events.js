/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("financial_events");

  const existing = collection.fields.getByName("idempotency_key");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("idempotency_key"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "idempotency_key",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("financial_events");
  collection.fields.removeByName("idempotency_key");
  return app.save(collection);
})
