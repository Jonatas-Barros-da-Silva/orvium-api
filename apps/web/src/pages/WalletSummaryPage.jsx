
import React from 'react';
import { useProfessionalWallet } from '@/hooks/useProfessionalWallet.js';
import WalletSummaryCard from '@/components/WalletSummaryCard.jsx';

const WalletSummaryPage = () => {
  const { transactions, organizations, balance, loading } = useProfessionalWallet();

  if (loading) return <div className="py-12 text-center text-slate-500">Carregando resumo...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Resumo Detalhado</h1>
        <p className="text-slate-500 mt-1">Análise de ganhos por organização e últimas movimentações.</p>
      </div>

      <WalletSummaryCard 
        transactions={transactions} 
        organizations={organizations} 
        balance={balance} 
      />
    </div>
  );
};

export default WalletSummaryPage;
