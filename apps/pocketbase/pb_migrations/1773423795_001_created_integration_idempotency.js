/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Fetch related collections to get their IDs
  const pbc_6714589687Collection = app.findCollectionByNameOrId("pbc_6714589687");
  const pbc_5432251382Collection = app.findCollectionByNameOrId("pbc_5432251382");

  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields":     [
          {
                "autogeneratePattern": "[a-z0-9]{15}",
                "hidden": false,
                "id": "text0690045775",
                "max": 15,
                "min": 15,
                "name": "id",
                "pattern": "^[a-z0-9]+$",
                "presentable": false,
                "primaryKey": true,
                "required": true,
                "system": true,
                "type": "text"
          },
          {
                "hidden": false,
                "id": "relation1722275743",
                "name": "workspace_integration_id",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "relation",
                "cascadeDelete": false,
                "collectionId": pbc_6714589687Collection.id,
                "displayFields": [],
                "maxSelect": 1,
                "minSelect": 0
          },
          {
                "hidden": false,
                "id": "text9840441277",
                "name": "idempotency_key",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "text",
                "autogeneratePattern": "",
                "max": 0,
                "min": 0,
                "pattern": ""
          },
          {
                "hidden": false,
                "id": "relation5509561109",
                "name": "execution_id",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "relation",
                "cascadeDelete": false,
                "collectionId": pbc_5432251382Collection.id,
                "displayFields": [],
                "maxSelect": 1,
                "minSelect": 0
          },
          {
                "hidden": false,
                "id": "select5183235519",
                "name": "status",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "select",
                "maxSelect": 1,
                "values": [
                      "processing",
                      "completed",
                      "failed",
                      "skipped"
                ]
          },
          {
                "hidden": false,
                "id": "autodate1676516675",
                "name": "created_at",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "autodate",
                "onCreate": true,
                "onUpdate": false
          },
          {
                "hidden": false,
                "id": "autodate9237342387",
                "name": "updated_at",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "autodate",
                "onCreate": true,
                "onUpdate": true
          },
          {
                "hidden": false,
                "id": "autodate4207073409",
                "name": "created",
                "onCreate": true,
                "onUpdate": false,
                "presentable": false,
                "system": false,
                "type": "autodate"
          },
          {
                "hidden": false,
                "id": "autodate3838853720",
                "name": "updated",
                "onCreate": true,
                "onUpdate": true,
                "presentable": false,
                "system": false,
                "type": "autodate"
          }
    ],
    "id": "pbc_9084590313",
    "indexes": ["CREATE UNIQUE INDEX idx_integration_idempotency_key ON integration_idempotency (idempotency_key)", "CREATE INDEX idx_integration_idempotency_workspace_integration_id ON integration_idempotency (workspace_integration_id)", "CREATE INDEX idx_integration_idempotency_status ON integration_idempotency (status)", "CREATE INDEX idx_integration_idempotency_created_at ON integration_idempotency (created_at)"],
    "listRule": "workspace_integration_id.workspace_id = @request.auth.organization_id",
    "name": "integration_idempotency",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": "workspace_integration_id.workspace_id = @request.auth.organization_id"
  });

  try {
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("Collection name must be unique")) {
      console.log("Collection already exists, skipping");
      return;
    }
    throw e;
  }
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("pbc_9084590313");
    return app.delete(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
