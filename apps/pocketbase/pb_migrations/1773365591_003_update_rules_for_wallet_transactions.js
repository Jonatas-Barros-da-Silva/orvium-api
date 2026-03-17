/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");
  // No rules to update
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");
  collection.updateRule = "@request.auth.role = 'admin'";
  collection.deleteRule = null;
  return app.save(collection);
})
