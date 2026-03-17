/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("wallet_transactions");
  collection.fields.removeByName("payout_id");
  return app.save(collection);
}, (app) => {

  const collection = app.findCollectionByNameOrId("wallet_transactions");
  collection.fields.add(new TextField({
    name: "payout_id",
    required: false,
    min: 0,
    max: 0
  }));
  return app.save(collection);
})
