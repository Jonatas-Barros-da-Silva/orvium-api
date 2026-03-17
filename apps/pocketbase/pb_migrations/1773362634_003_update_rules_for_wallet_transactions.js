/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");
  collection.listRule = "@request.auth.role = 'admin'";
  collection.viewRule = "@request.auth.role = 'admin'";
  collection.createRule = "@request.auth.role = 'admin'";
  collection.updateRule = "@request.auth.role = 'admin'";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");
  collection.listRule = "@request.auth.role = 'admin' || wallet_id = (SELECT wallet_id FROM professional_wallets WHERE professional_id = @request.auth.id LIMIT 1)";
  collection.viewRule = "@request.auth.role = 'admin' || wallet_id = (SELECT wallet_id FROM professional_wallets WHERE professional_id = @request.auth.id LIMIT 1)";
  collection.createRule = "@request.auth.role = 'admin'";
  collection.updateRule = "@request.auth.role = 'admin'";
  return app.save(collection);
})
