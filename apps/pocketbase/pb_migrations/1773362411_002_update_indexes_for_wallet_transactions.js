/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");
  collection.indexes.push("CREATE UNIQUE INDEX idx_wallet_transactions_transaction_id ON wallet_transactions (transaction_id)");
  collection.indexes.push("CREATE INDEX idx_wallet_transactions_wallet_id ON wallet_transactions (wallet_id)");
  collection.indexes.push("CREATE INDEX idx_wallet_transactions_organization_id ON wallet_transactions (organization_id)");
  collection.indexes.push("CREATE INDEX idx_wallet_transactions_transaction_type ON wallet_transactions (transaction_type)");
  collection.indexes.push("CREATE INDEX idx_wallet_transactions_status ON wallet_transactions (status)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_wallet_transactions_transaction_id"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_wallet_transactions_wallet_id"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_wallet_transactions_organization_id"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_wallet_transactions_transaction_type"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_wallet_transactions_status"));
  return app.save(collection);
})
