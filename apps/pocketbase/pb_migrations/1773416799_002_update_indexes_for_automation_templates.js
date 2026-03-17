/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("automation_templates");
  collection.indexes.push("CREATE INDEX idx_automation_templates_category ON automation_templates (category)");
  collection.indexes.push("CREATE INDEX idx_automation_templates_event_type ON automation_templates (event_type)");
  collection.indexes.push("CREATE INDEX idx_automation_templates_is_active ON automation_templates (is_active)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("automation_templates");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_automation_templates_category"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_automation_templates_event_type"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_automation_templates_is_active"));
  return app.save(collection);
})
