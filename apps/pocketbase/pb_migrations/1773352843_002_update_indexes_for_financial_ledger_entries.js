/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("financial_ledger_entries");
  collection.indexes.push("CREATE UNIQUE INDEX idx_financial_ledger_entries_ledger_entry_id ON financial_ledger_entries (ledger_entry_id)");
  collection.indexes.push("CREATE INDEX idx_financial_ledger_entries_organization ON financial_ledger_entries (organization_id)");
  collection.indexes.push("CREATE INDEX idx_financial_ledger_entries_professional ON financial_ledger_entries (professional_id)");
  collection.indexes.push("CREATE INDEX idx_financial_ledger_entries_event ON financial_ledger_entries (event_id)");
  collection.indexes.push("CREATE INDEX idx_financial_ledger_entries_repasse_calculation ON financial_ledger_entries (repasse_calculation_id)");
  collection.indexes.push("CREATE INDEX idx_financial_ledger_entries_entry_type ON financial_ledger_entries (entry_type)");
  collection.indexes.push("CREATE INDEX idx_financial_ledger_entries_entry_date ON financial_ledger_entries (entry_date)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("financial_ledger_entries");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_financial_ledger_entries_ledger_entry_id"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_financial_ledger_entries_organization"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_financial_ledger_entries_professional"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_financial_ledger_entries_event"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_financial_ledger_entries_repasse_calculation"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_financial_ledger_entries_entry_type"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_financial_ledger_entries_entry_date"));
  return app.save(collection);
})
