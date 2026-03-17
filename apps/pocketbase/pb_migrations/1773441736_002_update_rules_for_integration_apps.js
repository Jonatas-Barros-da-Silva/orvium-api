/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_apps");
  collection.listRule = "";
  collection.viewRule = "";
  collection.createRule = "";
  collection.updateRule = "";
  collection.deleteRule = "";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_apps");
  collection.listRule = "status = \"active\"";
  collection.viewRule = "status = \"active\"";
  collection.createRule = null;
  collection.updateRule = null;
  collection.deleteRule = null;
  return app.save(collection);
})
