/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("wallet_balances");
  // No rules to update
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("wallet_balances");
  collection.updateRule = "wallet.professional_id = @request.auth.id";
  collection.deleteRule = null;
  return app.save(collection);
})
