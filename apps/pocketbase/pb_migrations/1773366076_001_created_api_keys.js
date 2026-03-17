/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Fetch related collections to get their IDs
  const organizationsCollection = app.findCollectionByNameOrId("organizations");

  const collection = new Collection({
    "createRule": "organization_id = @request.auth.organization_id",
    "deleteRule": null,
    "fields":     [
          {
                "autogeneratePattern": "[a-z0-9]{15}",
                "hidden": false,
                "id": "text7594229803",
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
                "id": "text7804165430",
                "name": "api_key_id",
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
                "id": "relation0222087237",
                "name": "organization_id",
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
                "id": "text8854704646",
                "name": "api_key",
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
                "id": "select4260595632",
                "name": "status",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "select",
                "maxSelect": 1,
                "values": [
                      "active",
                      "inactive",
                      "revoked"
                ]
          },
          {
                "hidden": false,
                "id": "date8215266236",
                "name": "expires_at",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "date",
                "max": "",
                "min": ""
          },
          {
                "hidden": false,
                "id": "autodate9389141093",
                "name": "last_used_at",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "autodate",
                "onCreate": false,
                "onUpdate": true
          },
          {
                "hidden": false,
                "id": "text4842532024",
                "name": "description",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "text",
                "autogeneratePattern": "",
                "max": 0,
                "min": 0,
                "pattern": ""
          },
          {
                "hidden": false,
                "id": "autodate9974532782",
                "name": "created",
                "onCreate": true,
                "onUpdate": false,
                "presentable": false,
                "system": false,
                "type": "autodate"
          },
          {
                "hidden": false,
                "id": "autodate2337371450",
                "name": "updated",
                "onCreate": true,
                "onUpdate": true,
                "presentable": false,
                "system": false,
                "type": "autodate"
          }
    ],
    "id": "pbc_6717683761",
    "indexes": [],
    "listRule": "organization_id = @request.auth.organization_id",
    "name": "api_keys",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": "organization_id = @request.auth.organization_id"
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
    const collection = app.findCollectionByNameOrId("pbc_6717683761");
    return app.delete(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
