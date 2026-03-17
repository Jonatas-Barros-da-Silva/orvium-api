/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("professional_wallets");
  collection.listRule = "professional_id = @request.auth.id || @request.auth.role = 'admin'";
  collection.viewRule = "professional_id = @request.auth.id || @request.auth.role = 'admin'";
  collection.createRule = "@request.auth.role = 'admin'";
  collection.updateRule = "@request.auth.role = 'admin'";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("professional_wallets");
  collection.listRule = "@request.auth.role = 'admin'";
  collection.viewRule = "@request.auth.role = 'admin'";
  collection.createRule = "@request.auth.role = 'admin'";
  collection.updateRule = "@request.auth.role = 'admin'";
  return app.save(collection);
})
