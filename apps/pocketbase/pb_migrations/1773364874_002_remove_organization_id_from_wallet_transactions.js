/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_wallet_transactions_organization_id"));
  collection.fields.removeByName("organization_id");
  return app.save(collection);
}, (app) => {

  const collection = app.findCollectionByNameOrId("wallet_transactions");
  collection.fields.add(new TextField({
    name: "organization_id",
    required: true,
    min: 0,
    max: 0
  }));
  collection.indexes.push("CREATE INDEX idx_wallet_transactions_organization_id ON wallet_transactions (organization_id)");
  return app.save(collection);
})
