/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Fetch related collections to get their IDs
  const organizationsCollection = app.findCollectionByNameOrId("organizations");
  const integration_appsCollection = app.findCollectionByNameOrId("integration_apps");
  const integration_app_versionsCollection = app.findCollectionByNameOrId("integration_app_versions");

  const collection = new Collection({
    "createRule": "workspace_id = @request.auth.organization_id",
    "deleteRule": "workspace_id = @request.auth.organization_id",
    "fields":     [
          {
                "autogeneratePattern": "[a-z0-9]{15}",
                "hidden": false,
                "id": "text6085999688",
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
                "id": "relation3688857757",
                "name": "workspace_id",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "relation",
                "cascadeDelete": false,
                "collectionId": organizationsCollection.id,
                "displayFields": [],
                "maxSelect": 1,
                "minSelect": 0
          },
          {
                "hidden": false,
                "id": "relation4616826898",
                "name": "app_id",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "relation",
                "cascadeDelete": false,
                "collectionId": integration_appsCollection.id,
                "displayFields": [],
                "maxSelect": 1,
                "minSelect": 0
          },
          {
                "hidden": false,
                "id": "relation2944464880",
                "name": "app_version_id",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "relation",
                "cascadeDelete": false,
                "collectionId": integration_app_versionsCollection.id,
                "displayFields": [],
                "maxSelect": 1,
                "minSelect": 0
          },
          {
                "hidden": false,
                "id": "select1342815356",
                "name": "status",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "select",
                "maxSelect": 1,
                "values": [
                      "active",
                      "disabled"
                ]
          },
          {
                "hidden": false,
                "id": "text3528459044",
                "name": "installed_by",
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
                "id": "autodate0246583650",
                "name": "installed_at",
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
                "id": "json2164432354",
                "name": "config",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "json",
                "maxSize": 0
          },
          {
                "hidden": false,
                "id": "autodate8139653851",
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
                "id": "autodate6715759125",
                "name": "created",
                "onCreate": true,
                "onUpdate": false,
                "presentable": false,
                "system": false,
                "type": "autodate"
          },
          {
                "hidden": false,
                "id": "autodate5375603426",
                "name": "updated",
                "onCreate": true,
                "onUpdate": true,
                "presentable": false,
                "system": false,
                "type": "autodate"
          }
    ],
    "id": "pbc_6714589687",
    "indexes": ["CREATE INDEX idx_workspace_integrations_workspace_id ON workspace_integrations (workspace_id)", "CREATE INDEX idx_workspace_integrations_app_id ON workspace_integrations (app_id)", "CREATE INDEX idx_workspace_integrations_status ON workspace_integrations (status)", "CREATE UNIQUE INDEX idx_workspace_integrations_composite ON workspace_integrations (workspace_id, app_id)"],
    "listRule": "workspace_id = @request.auth.organization_id",
    "name": "workspace_integrations",
    "system": false,
    "type": "base",
    "updateRule": "workspace_id = @request.auth.organization_id",
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
    const collection = app.findCollectionByNameOrId("pbc_6714589687");
    return app.delete(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
