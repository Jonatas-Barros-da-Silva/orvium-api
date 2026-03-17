/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("payouts");
  collection.indexes.push("CREATE UNIQUE INDEX idx_payouts_payout_id ON payouts (payout_id)");
  collection.indexes.push("CREATE INDEX idx_payouts_organization ON payouts (organization_id)");
  collection.indexes.push("CREATE INDEX idx_payouts_professional ON payouts (professional_id)");
  collection.indexes.push("CREATE INDEX idx_payouts_status ON payouts (payout_status)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("payouts");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_payouts_payout_id"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_payouts_organization"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_payouts_professional"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_payouts_status"));
  return app.save(collection);
})
