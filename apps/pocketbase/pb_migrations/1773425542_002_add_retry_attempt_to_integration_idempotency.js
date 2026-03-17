/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_idempotency");

  const existing = collection.fields.getByName("retry_attempt");
  if (existing) {
    if (existing.type === "number") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("retry_attempt"); // exists with wrong type, remove first
  }

  collection.fields.add(new NumberField({
    name: "retry_attempt",
    required: true,
    min: 1
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_idempotency");
  collection.fields.removeByName("retry_attempt");
  return app.save(collection);
})
