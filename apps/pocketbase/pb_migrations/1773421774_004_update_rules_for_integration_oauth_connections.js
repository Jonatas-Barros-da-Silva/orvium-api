/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_oauth_connections");
  collection.listRule = "workspace_integration_id.workspace_id = @request.auth.organization_id";
  collection.viewRule = "workspace_integration_id.workspace_id = @request.auth.organization_id";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("integration_oauth_connections");
  collection.listRule = "workspace_integration_id.workspace_id = @request.auth.organization_id";
  collection.viewRule = "workspace_integration_id.workspace_id = @request.auth.organization_id";
  collection.createRule = null;
  collection.updateRule = null;
  collection.deleteRule = null;
  return app.save(collection);
})
