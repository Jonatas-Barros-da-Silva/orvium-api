/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("webhook_delivery_logs");

  const existing = collection.fields.getByName("trigger_type");
  if (existing) {
    if (existing.type === "select") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("trigger_type"); // exists with wrong type, remove first
  }

  collection.fields.add(new SelectField({
    name: "trigger_type",
    required: true,
    values: ["automatic", "manual_retry", "event_replay"]
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("webhook_delivery_logs");
  collection.fields.removeByName("trigger_type");
  return app.save(collection);
})
