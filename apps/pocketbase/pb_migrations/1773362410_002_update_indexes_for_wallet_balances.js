/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("wallet_balances");
  collection.indexes.push("CREATE INDEX idx_wallet_balances_wallet_id ON wallet_balances (wallet_id)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("wallet_balances");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_wallet_balances_wallet_id"));
  return app.save(collection);
})
