/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_app_versions");

  const record0 = new Record(collection);
    const record0_app_idLookup = app.findFirstRecordByFilter("integration_apps", "slug='analytics'");
    if (!record0_app_idLookup) { throw new Error("Lookup failed for app_id: no record in 'integration_apps' matching \"slug='analytics'\""); }
    record0.set("app_id", record0_app_idLookup.id);
    record0.set("version", "1.0.0");
    record0.set("adapter_type", "event_tracker");
    record0.set("config_schema", "{'type': 'object', 'properties': {'api_key': {'type': 'string', 'description': 'Analytics API key'}, 'endpoint': {'type': 'string', 'description': 'Analytics endpoint URL'}}}");
    record0.set("status", "active");
  try {
    app.save(record0);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record1 = new Record(collection);
    const record1_app_idLookup = app.findFirstRecordByFilter("integration_apps", "slug='slack'");
    if (!record1_app_idLookup) { throw new Error("Lookup failed for app_id: no record in 'integration_apps' matching \"slug='slack'\""); }
    record1.set("app_id", record1_app_idLookup.id);
    record1.set("version", "1.0.0");
    record1.set("adapter_type", "webhook_notifier");
    record1.set("config_schema", "{'type': 'object', 'properties': {'webhook_url': {'type': 'string', 'description': 'Slack webhook URL'}, 'channel': {'type': 'string', 'description': 'Default channel for notifications'}}}");
    record1.set("status", "active");
  try {
    app.save(record1);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record2 = new Record(collection);
    const record2_app_idLookup = app.findFirstRecordByFilter("integration_apps", "slug='crm'");
    if (!record2_app_idLookup) { throw new Error("Lookup failed for app_id: no record in 'integration_apps' matching \"slug='crm'\""); }
    record2.set("app_id", record2_app_idLookup.id);
    record2.set("version", "1.0.0");
    record2.set("adapter_type", "crm_sync");
    record2.set("config_schema", "{'type': 'object', 'properties': {'api_key': {'type': 'string', 'description': 'CRM API key'}, 'base_url': {'type': 'string', 'description': 'CRM base URL'}, 'sync_interval': {'type': 'integer', 'description': 'Sync interval in minutes'}}}");
    record2.set("status", "active");
  try {
    app.save(record2);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }
}, (app) => {
  // Rollback: record IDs not known, manual cleanup needed
})
