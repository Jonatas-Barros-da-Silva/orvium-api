/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_executions");

  const existing = collection.fields.getByName("replay_source");
  if (existing) {
    if (existing.type === "select") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("replay_source"); // exists with wrong type, remove first
  }

  collection.fields.add(new SelectField({
    name: "replay_source",
    required: false,
    values: ["original", "manual_debug", "api_replay", "test_run"]
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_executions");
  collection.fields.removeByName("replay_source");
  return app.save(collection);
})
