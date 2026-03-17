/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");
  collection.listRule = "wallet.professional_id = @request.auth.id";
  collection.viewRule = "wallet.professional_id = @request.auth.id";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");
  collection.listRule = "@request.auth.id != ''";
  collection.viewRule = "@request.auth.id != ''";
  collection.createRule = "@request.auth.role = 'admin'";
  collection.updateRule = "@request.auth.role = 'admin'";
  collection.deleteRule = null;
  return app.save(collection);
})
