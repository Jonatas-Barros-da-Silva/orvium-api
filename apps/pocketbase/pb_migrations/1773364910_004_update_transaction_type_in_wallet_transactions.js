/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");
  const field = collection.fields.getByName("transaction_type");
  field.values = ["repasse_credit", "payout_debit", "adjustment", "refund"];
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");
  const field = collection.fields.getByName("transaction_type");
  field.values = ["repasse_credit", "payout_debit", "adjustment", "refund"];
  return app.save(collection);
})
