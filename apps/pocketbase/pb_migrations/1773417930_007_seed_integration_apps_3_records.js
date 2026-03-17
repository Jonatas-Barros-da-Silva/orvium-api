/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("integration_apps");

  const record0 = new Record(collection);
    record0.set("name", "Analytics");
    record0.set("slug", "analytics");
    record0.set("description", "Track events and metrics");
    record0.set("category", "analytics");
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
    record1.set("name", "Slack");
    record1.set("slug", "slack");
    record1.set("description", "Send notifications to Slack");
    record1.set("category", "communication");
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
    record2.set("name", "CRM");
    record2.set("slug", "crm");
    record2.set("description", "Sync data with CRM");
    record2.set("category", "crm");
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
