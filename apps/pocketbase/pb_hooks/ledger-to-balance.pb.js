/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  // Extract data from ledger entry
  const professionalId = e.record.get("professional_id");
  const organizationId = e.record.get("organization_id");
  const amount = e.record.get("amount");
  const entryType = e.record.get("entry_type");
  const ledgerEntryId = e.record.get("ledger_entry_id");
  const eventId = e.record.get("event_id");
  const repasseCalculationId = e.record.get("repasse_calculation_id");
  
  // Fetch or create professional_balances record for (organization_id, professional_id)
  const balancesCollection = $app.findCollectionByNameOrId("professional_balances");
  let balanceRecord = $app.findFirstRecordByFilter("professional_balances", "organization_id = {:org} && professional_id = {:prof}", {
    "org": organizationId,
    "prof": professionalId
  });
  
  if (!balanceRecord) {
    // Create new balance record if it doesn't exist
    balanceRecord = new Record(balancesCollection);
    balanceRecord.set("professional_id", professionalId);
    balanceRecord.set("organization_id", organizationId);
    balanceRecord.set("current_balance", 0);
  }
  
  // Update current_balance based on entry_type
  let currentBalance = balanceRecord.get("current_balance") || 0;
  
  if (entryType === "PROFESSIONAL_PAYABLE") {
    currentBalance += amount;
  } else if (entryType === "PAYOUT_DEDUCTION") {
    currentBalance -= amount;
  }
  
  balanceRecord.set("current_balance", currentBalance);
  balanceRecord.set("last_ledger_entry_id", ledgerEntryId);
  balanceRecord.set("last_event_id", eventId);
  balanceRecord.set("last_repasse_calculation_id", repasseCalculationId);
  
  $app.save(balanceRecord);
  e.next();
}, "financial_ledger_entries");