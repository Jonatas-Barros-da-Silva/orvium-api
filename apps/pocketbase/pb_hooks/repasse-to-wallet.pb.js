/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  // Get professional_id and calculated_repasse_amount from repasse_calculation
  const professionalId = e.record.get("professional_id");
  const organizationId = e.record.get("organization_id");
  const eventId = e.record.get("event_id");
  const repasseCalculationId = e.record.id;
  const calculatedRepasseAmount = e.record.get("calculated_repasse_amount");

  // Query professional_wallets to get wallet_id where professional_id matches
  const walletRecord = $app.findFirstRecordByData("professional_wallets", "professional_id", professionalId);
  
  if (!walletRecord) {
    console.log("No wallet found for professional_id: " + professionalId);
    e.next();
    return;
  }

  const walletId = walletRecord.get("wallet_id");

  // Create wallet_transaction with transaction_type='repasse_credit'
  const walletTransactionRecord = new Record("wallet_transactions", {
    transaction_id: "wt_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
    wallet_id: walletId,
    event_id: eventId,
    organization_id: organizationId,
    repasse_calculation_id: repasseCalculationId,
    transaction_type: "repasse_credit",
    amount: calculatedRepasseAmount,
    status: "completed"
  });

  $app.save(walletTransactionRecord);

  // Update wallet_balances: available_balance += amount where wallet_id matches
  const balanceRecord = $app.findFirstRecordByData("wallet_balances", "wallet_id", walletId);
  
  if (balanceRecord) {
    const currentBalance = balanceRecord.get("available_balance") || 0;
    balanceRecord.set("available_balance", currentBalance + calculatedRepasseAmount);
    $app.save(balanceRecord);
  }

  e.next();
}, "repasse_calculations");