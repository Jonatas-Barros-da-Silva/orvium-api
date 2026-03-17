/// <reference path="../pb_data/types.d.ts" />
onRecordUpdate((e) => {
  // Check if payout status is being changed to 'paid'
  const originalStatus = e.record.original().get("payout_status");
  const newStatus = e.record.get("payout_status");

  if (originalStatus !== "paid" && newStatus === "paid") {
    // Get professional_id and payout_amount from payout
    const professionalId = e.record.get("professional_id");
    const organizationId = e.record.get("organization_id");
    const payoutId = e.record.id;
    const payoutAmount = e.record.get("payout_amount");

    // Query professional_wallets to get wallet_id where professional_id matches
    const walletRecord = $app.findFirstRecordByData("professional_wallets", "professional_id", professionalId);
    
    if (!walletRecord) {
      console.log("No wallet found for professional_id: " + professionalId);
      e.next();
      return;
    }

    const walletId = walletRecord.get("wallet_id");

    // Create wallet_transaction with transaction_type='payout_debit'
    const walletTransactionRecord = new Record("wallet_transactions", {
      transaction_id: "wt_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      wallet_id: walletId,
      organization_id: organizationId,
      payout_id: payoutId,
      transaction_type: "payout_debit",
      amount: payoutAmount,
      status: "completed"
    });

    $app.save(walletTransactionRecord);

    // Update wallet_balances: available_balance -= amount where wallet_id matches
    const balanceRecord = $app.findFirstRecordByData("wallet_balances", "wallet_id", walletId);
    
    if (balanceRecord) {
      const currentBalance = balanceRecord.get("available_balance") || 0;
      balanceRecord.set("available_balance", currentBalance - payoutAmount);
      $app.save(balanceRecord);
    }
  }

  e.next();
}, "payouts");