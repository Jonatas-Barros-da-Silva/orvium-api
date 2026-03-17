/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Fetch related collections to get their IDs
  const pbc_9990090165Collection = app.findCollectionByNameOrId("pbc_9990090165");
  const pbc_5672333577Collection = app.findCollectionByNameOrId("pbc_5672333577");

  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields":     [
          {
                "autogeneratePattern": "[a-z0-9]{15}",
                "hidden": false,
                "id": "text6759683043",
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
                "id": "relation4192671901",
                "name": "rule_id",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "relation",
                "cascadeDelete": false,
                "collectionId": pbc_9990090165Collection.id,
                "displayFields": [],
                "maxSelect": 1,
                "minSelect": 0
          },
          {
                "hidden": false,
                "id": "relation2232429450",
                "name": "workspace_id",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "relation",
                "cascadeDelete": false,
                "collectionId": pbc_5672333577Collection.id,
                "displayFields": [],
                "maxSelect": 1,
                "minSelect": 0
          },
          {
                "hidden": false,
                "id": "number1380637482",
                "name": "version_number",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "number",
                "max": null,
                "min": null,
                "onlyInt": false
          },
          {
                "hidden": false,
                "id": "text6235187609",
                "name": "event_type",
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
                "id": "json2144439435",
                "name": "conditions_json",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "json",
                "maxSize": 0
          },
          {
                "hidden": false,
                "id": "json3165656125",
                "name": "actions_json",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "json",
                "maxSize": 0
          },
          {
                "hidden": false,
                "id": "autodate7866049924",
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
                "id": "autodate0339231916",
                "name": "created",
                "onCreate": true,
                "onUpdate": false,
                "presentable": false,
                "system": false,
                "type": "autodate"
          },
          {
                "hidden": false,
                "id": "autodate8481764697",
                "name": "updated",
                "onCreate": true,
                "onUpdate": true,
                "presentable": false,
                "system": false,
                "type": "autodate"
          }
    ],
    "id": "pbc_3253275158",
    "indexes": ["CREATE INDEX idx_automation_rule_versions_rule_id ON automation_rule_versions (rule_id)", "CREATE INDEX idx_automation_rule_versions_workspace_id ON automation_rule_versions (workspace_id)", "CREATE INDEX idx_automation_rule_versions_version_number ON automation_rule_versions (version_number)", "CREATE UNIQUE INDEX idx_automation_rule_versions_composite ON automation_rule_versions (rule_id, version_number)"],
    "listRule": "workspace_id = @request.auth.organization_id",
    "name": "automation_rule_versions",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": "workspace_id = @request.auth.organization_id"
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
    const collection = app.findCollectionByNameOrId("pbc_3253275158");
    return app.delete(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
