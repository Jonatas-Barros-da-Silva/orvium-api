/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("professional_wallets");
  collection.indexes.push("CREATE UNIQUE INDEX idx_professional_wallets_wallet_id ON professional_wallets (wallet_id)");
  collection.indexes.push("CREATE UNIQUE INDEX idx_professional_wallets_professional_id ON professional_wallets (professional_id)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("professional_wallets");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_professional_wallets_wallet_id"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_professional_wallets_professional_id"));
  return app.save(collection);
})
