/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  // Extract data from repasse_calculation record
  const professionalId = e.record.get("professional_id");
  const calculatedRepasseAmount = e.record.get("calculated_repasse_amount");
  const repasseCalculationId = e.record.get("repasse_calculation_id");
  const eventId = e.record.get("event_id");
  const organizationId = e.record.get("organization_id");
  
  // Fetch professional_name from professionals collection
  const professional = $app.findFirstRecordByData("professionals", "professional_id", professionalId);
  const professionalName = professional ? professional.get("professional_name") : "Unknown Professional";
  
  // Fetch procedure_name from financial_events collection using event_id
  const financialEvent = $app.findFirstRecordByData("financial_events", "event_id", eventId);
  const procedureName = financialEvent ? financialEvent.get("procedure_id") : "Unknown Procedure";
  
  // Create ledger entry in financial_ledger_entries
  const ledgerCollection = $app.findCollectionByNameOrId("financial_ledger_entries");
  const ledgerEntry = new Record(ledgerCollection);
  
  ledgerEntry.set("ledger_entry_id", $app.generateId());
  ledgerEntry.set("organization_id", organizationId);
  ledgerEntry.set("event_id", eventId);
  ledgerEntry.set("repasse_calculation_id", repasseCalculationId);
  ledgerEntry.set("professional_id", professionalId);
  ledgerEntry.set("debit_account", "REPASSE_EXPENSE");
  ledgerEntry.set("credit_account", "PROFESSIONAL_PAYABLE");
  ledgerEntry.set("amount", calculatedRepasseAmount);
  ledgerEntry.set("entry_type", "REPASSE_EXPENSE");
  ledgerEntry.set("entry_date", new Date().toISOString().split('T')[0]);
  ledgerEntry.set("description", "Repasse for " + professionalName + " - " + procedureName);
  
  $app.save(ledgerEntry);
  e.next();
}, "repasse_calculations");