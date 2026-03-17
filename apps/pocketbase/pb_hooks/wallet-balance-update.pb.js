/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  const walletId = e.record.get("wallet_id");
  const transactionType = e.record.get("transaction_type");
  const status = e.record.get("status");
  const amount = e.record.get("amount");
  
  // Get current wallet_balances record
  const walletBalance = $app.findFirstRecordByData("wallet_balances", "wallet_id", walletId);
  if (!walletBalance) {
    e.next();
    return;
  }
  
  let currentAvailable = walletBalance.get("available_balance") || 0;
  
  // Update balance based on transaction type and status
  if (status === "completed") {
    if (transactionType === "repasse_credit") {
      currentAvailable += amount;
    } else if (transactionType === "payout_debit") {
      currentAvailable -= amount;
    }
  }
  
  walletBalance.set("available_balance", currentAvailable);
  $app.save(walletBalance);
  
  e.next();
}, "wallet_transactions");