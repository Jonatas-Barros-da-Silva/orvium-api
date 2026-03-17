/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  const professional_id = e.record.get("professional_id");
  const amount = e.record.get("amount");
  const entry_type = e.record.get("entry_type");
  const ledger_entry_id = e.record.get("ledger_entry_id");
  const event_id = e.record.get("event_id");
  const repasse_calculation_id = e.record.get("repasse_calculation_id");
  const organization_id = e.record.get("organization_id");

  const dao = $app.dao();

  // Find or create professional_balances record
  let balanceRecord = null;
  try {
    balanceRecord = dao.findFirstRecordByFilter(
      "professional_balances",
      "professional_id = {:professional_id} && organization_id = {:organization_id}",
      { professional_id: professional_id, organization_id: organization_id }
    );
  } catch (err) {
    // Record doesn't exist, create it
    balanceRecord = new Record("professional_balances", {});
    balanceRecord.set("professional_id", professional_id);
    balanceRecord.set("organization_id", organization_id);
    balanceRecord.set("current_balance", 0);
  }

  // Update balance based on entry_type
  let currentBalance = balanceRecord.get("current_balance") || 0;
  if (entry_type === "PROFESSIONAL_PAYABLE") {
    currentBalance += amount;
  } else if (entry_type === "PAYOUT_DEDUCTION") {
    currentBalance -= amount;
  }

  balanceRecord.set("current_balance", currentBalance);
  balanceRecord.set("last_ledger_entry_id", ledger_entry_id);
  balanceRecord.set("last_event_id", event_id);
  balanceRecord.set("last_repasse_calculation_id", repasse_calculation_id);

  // Save the balance record
  dao.save(balanceRecord);

  e.next();
}, "financial_ledger_entries");