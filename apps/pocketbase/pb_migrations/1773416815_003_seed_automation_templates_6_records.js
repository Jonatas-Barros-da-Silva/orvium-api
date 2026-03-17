/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("automation_templates");

  const record0 = new Record(collection);
    record0.set("name", "Large Payout Alert");
    record0.set("description", "Alert when payout amount exceeds 5000");
    record0.set("category", "financial_alerts");
    record0.set("event_type", "event.payout.sent");
    record0.set("conditions_json", "{'amount_greater_than': 5000}");
    record0.set("actions_json", [{"type": "send_notification", "channel": "internal"}]);
    record0.set("is_active", true);
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
    record1.set("name", "Wallet Low Balance Alert");
    record1.set("description", "Alert when wallet balance drops below 1000");
    record1.set("category", "financial_alerts");
    record1.set("event_type", "event.wallet.updated");
    record1.set("conditions_json", "{'amount_less_than': 1000}");
    record1.set("actions_json", [{"type": "send_notification", "channel": "internal"}]);
    record1.set("is_active", true);
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
    record2.set("name", "Repasse Completed Notification");
    record2.set("description", "Notify when repasse calculation completes");
    record2.set("category", "operations");
    record2.set("event_type", "event.repasse.completed");
    record2.set("conditions_json", "{}");
    record2.set("actions_json", [{"type": "send_notification", "channel": "internal"}, {"type": "trigger_integration", "integration": "analytics"}]);
    record2.set("is_active", true);
  try {
    app.save(record2);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record3 = new Record(collection);
    record3.set("name", "High Value Transaction Alert");
    record3.set("description", "Alert for transactions exceeding 10000");
    record3.set("category", "risk_monitoring");
    record3.set("event_type", "event.ledger.entry.created");
    record3.set("conditions_json", "{'amount_greater_than': 10000}");
    record3.set("actions_json", [{"type": "send_notification", "channel": "internal"}, {"type": "create_internal_task", "task_type": "review_transaction"}]);
    record3.set("is_active", true);
  try {
    app.save(record3);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record4 = new Record(collection);
    record4.set("name", "Daily Analytics Sync");
    record4.set("description", "Sync payout data to analytics system daily");
    record4.set("category", "analytics");
    record4.set("event_type", "event.payout.sent");
    record4.set("conditions_json", "{}");
    record4.set("actions_json", [{"type": "trigger_integration", "integration": "analytics"}]);
    record4.set("is_active", true);
  try {
    app.save(record4);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record5 = new Record(collection);
    record5.set("name", "Ledger Entry Logging");
    record5.set("description", "Log all ledger entries to analytics");
    record5.set("category", "operations");
    record5.set("event_type", "event.ledger.entry.created");
    record5.set("conditions_json", "{}");
    record5.set("actions_json", [{"type": "trigger_integration", "integration": "analytics"}]);
    record5.set("is_active", true);
  try {
    app.save(record5);
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
