/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("payouts");
  collection.listRule = "professional_id = @request.auth.id || @request.auth.role = 'organization_admin' || @request.auth.role = 'platform_admin'";
  collection.viewRule = "professional_id = @request.auth.id || @request.auth.role = 'organization_admin' || @request.auth.role = 'platform_admin'";
  collection.createRule = "@request.auth.id != ''";
  collection.updateRule = "professional_id = @request.auth.id || @request.auth.role = 'organization_admin' || @request.auth.role = 'platform_admin'";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("payouts");
  collection.listRule = "professional_id = @request.auth.id || @request.auth.role = 'organization_admin' || @request.auth.role = 'platform_admin'";
  collection.viewRule = "professional_id = @request.auth.id || @request.auth.role = 'organization_admin' || @request.auth.role = 'platform_admin'";
  collection.createRule = "@request.auth.id != ''";
  collection.updateRule = "professional_id = @request.auth.id || @request.auth.role = 'organization_admin' || @request.auth.role = 'platform_admin'";
  collection.deleteRule = null;
  return app.save(collection);
})
