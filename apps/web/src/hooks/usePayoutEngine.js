
import { useState } from 'react';
import pb from '@/lib/pocketbaseClient';

export const usePayoutEngine = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const processPayoutPayment = async (payout, professionalName) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // 1. Update Payout Status to 'paid'
      const today = new Date().toISOString().split('T')[0];
      await pb.collection('payouts').update(payout.id, {
        payout_status: 'paid',
        payout_date: today
      }, { $autoCancel: false });

      // 2. Create Ledger Entry (PAYOUT_DEDUCTION)
      const ledgerEntryId = `LEDGER-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      await pb.collection('financial_ledger_entries').create({
        ledger_entry_id: ledgerEntryId,
        organization_id: payout.organization_id,
        professional_id: payout.professional_id,
        event_id: payout.payout_id, // Link to payout
        repasse_calculation_id: 'N/A',
        debit_account: 'PROFESSIONAL_PAYABLE',
        credit_account: 'CASH',
        amount: payout.payout_amount,
        entry_type: 'PAYOUT_DEDUCTION',
        entry_date: today,
        description: `Pagamento realizado para ${professionalName || payout.professional_id} - Ref: ${payout.reference_period}`
      }, { $autoCancel: false });

      // 3. Update Professional Balance
      const balances = await pb.collection('professional_balances').getFullList({
        filter: `professional_id="${payout.professional_id}" && organization_id="${payout.organization_id}"`,
        $autoCancel: false
      });

      if (balances.length > 0) {
        const currentBalanceRecord = balances[0];
        const newBalance = currentBalanceRecord.current_balance - payout.payout_amount;
        
        await pb.collection('professional_balances').update(currentBalanceRecord.id, {
          current_balance: newBalance,
          last_ledger_entry_id: ledgerEntryId
        }, { $autoCancel: false });
      } else {
        console.warn(`No balance record found for professional ${payout.professional_id} to deduct payout.`);
      }

      return { success: true };
    } catch (err) {
      console.error("Error processing payout payment:", err);
      setError(err.message || "Falha ao processar o pagamento.");
      return { success: false, error: err };
    } finally {
      setIsProcessing(false);
    }
  };

  const changePayoutStatus = async (payoutId, newStatus) => {
    setIsProcessing(true);
    setError(null);
    try {
      await pb.collection('payouts').update(payoutId, {
        payout_status: newStatus
      }, { $autoCancel: false });
      return { success: true };
    } catch (err) {
      console.error(`Error changing payout status to ${newStatus}:`, err);
      setError(err.message || "Falha ao alterar status.");
      return { success: false, error: err };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processPayoutPayment,
    changePayoutStatus,
    isProcessing,
    error
  };
};
