/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  // Only process ADJUSTMENT ledger entries
  if (e.record.get("ledger_type") !== "ADJUSTMENT") {
    e.next();
    return;
  }

  const professionalId = e.record.get("professional_id");
  const organizationId = e.record.get("organization_id");
  const amount = e.record.get("amount");
  const ledgerEntryId = e.record.id;

  try {
    // Find professional wallet
    const wallet = $app.findFirstRecordByData("professional_wallets", "professional_id", professionalId);
    if (!wallet) {
      throw new BadRequestError("Professional wallet not found for professional_id: " + professionalId);
    }

    const walletId = wallet.id;

    // Create wallet transaction
    const txnRecord = new Record($app.findCollectionByNameOrId("wallet_transactions"));
    txnRecord.set("transaction_id", "txn_" + ledgerEntryId);
    txnRecord.set("wallet_id", walletId);
    txnRecord.set("transaction_type", "adjustment");
    txnRecord.set("amount", amount);
    txnRecord.set("status", "completed");
    txnRecord.set("wallet", walletId);
    txnRecord.set("organization", organizationId);
    txnRecord.set("ledger_entry_id", ledgerEntryId);
    $app.save(txnRecord);

    // Update wallet balance - amount can be positive or negative
    const balanceRecord = $app.findFirstRecordByData("wallet_balances", "wallet_id", walletId);
    if (balanceRecord) {
      const currentAvailable = balanceRecord.get("available_balance") || 0;
      const currentTotal = balanceRecord.get("pending_balance") || 0;
      balanceRecord.set("available_balance", currentAvailable + amount);
      balanceRecord.set("pending_balance", currentTotal + amount);
      $app.save(balanceRecord);
    }
  } catch (err) {
    console.error("Error in ledger-adjustment-to-wallet hook: " + err.message);
    throw err;
  }

  e.next();
}, "financial_ledger_entries");