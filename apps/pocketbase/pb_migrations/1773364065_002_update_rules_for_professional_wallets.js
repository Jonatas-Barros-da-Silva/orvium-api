/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("professional_wallets");
  collection.listRule = "professional_id = @request.auth.id";
  collection.viewRule = "professional_id = @request.auth.id";
  collection.createRule = "@request.auth.id != ''";
  collection.updateRule = "professional_id = @request.auth.id";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("professional_wallets");
  collection.listRule = "professional_id = @request.auth.id || @request.auth.role = 'admin'";
  collection.viewRule = "professional_id = @request.auth.id || @request.auth.role = 'admin'";
  collection.createRule = "@request.auth.role = 'admin'";
  collection.updateRule = "@request.auth.role = 'admin'";
  collection.deleteRule = null;
  return app.save(collection);
})
