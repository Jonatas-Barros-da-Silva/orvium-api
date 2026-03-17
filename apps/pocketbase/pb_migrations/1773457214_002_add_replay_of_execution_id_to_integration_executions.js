/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_executions");

  const existing = collection.fields.getByName("replay_of_execution_id");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("replay_of_execution_id"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "replay_of_execution_id",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_executions");
  collection.fields.removeByName("replay_of_execution_id");
  return app.save(collection);
})
