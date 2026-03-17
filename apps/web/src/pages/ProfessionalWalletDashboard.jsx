
import React from 'react';
import { useProfessionalWallet } from '@/hooks/useProfessionalWallet.js';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Clock, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import WalletSummaryCard from '@/components/WalletSummaryCard.jsx';

const ProfessionalWalletDashboard = () => {
  const { balance, transactions, organizations, loading, error } = useProfessionalWallet();

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 text-center">
        <p className="font-semibold text-lg">{error}</p>
      </div>
    );
  }

  // Calculate Metrics
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  
  let earningsThisMonth = 0;
  let totalReceived = 0;

  transactions.forEach(t => {
    if (t.transaction_type === 'repasse_credit' && t.status === 'completed') {
      totalReceived += t.amount;
      if (t.created_at >= startOfMonth) {
        earningsThisMonth += t.amount;
      }
    }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Visão Geral da Carteira</h1>
        <p className="text-slate-500 mt-1">Acompanhe seus ganhos, saldos e histórico de repasses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="prof-wallet-card border-l-4 border-l-[hsl(var(--wallet-available))] relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <p className="prof-metric-label">Saldo Disponível</p>
            <div className="p-2 bg-green-50 rounded-lg text-green-600"><Wallet className="w-5 h-5" /></div>
          </div>
          <p className="prof-metric-value text-green-700">{formatCurrency(balance?.available_balance)}</p>
          <Link to="/professional/payout-request" className="absolute bottom-0 left-0 right-0 bg-green-50 py-2 px-6 text-xs font-semibold text-green-700 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            Solicitar Saque <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="prof-wallet-card border-l-4 border-l-[hsl(var(--wallet-pending))]">
          <div className="flex justify-between items-start">
            <p className="prof-metric-label">Saldo Pendente</p>
            <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Clock className="w-5 h-5" /></div>
          </div>
          <p className="prof-metric-value text-orange-700">{formatCurrency(balance?.pending_balance)}</p>
        </div>

        <div className="prof-wallet-card border-l-4 border-l-[hsl(var(--wallet-earnings))]">
          <div className="flex justify-between items-start">
            <p className="prof-metric-label">Ganhos no Mês</p>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><TrendingUp className="w-5 h-5" /></div>
          </div>
          <p className="prof-metric-value text-blue-700">{formatCurrency(earningsThisMonth)}</p>
        </div>

        <div className="prof-wallet-card border-l-4 border-l-[hsl(var(--wallet-total))]">
          <div className="flex justify-between items-start">
            <p className="prof-metric-label">Total Recebido</p>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><DollarSign className="w-5 h-5" /></div>
          </div>
          <p className="prof-metric-value text-slate-700">{formatCurrency(totalReceived)}</p>
        </div>

      </div>

      <WalletSummaryCard 
        transactions={transactions} 
        organizations={organizations} 
        balance={balance} 
      />
    </div>
  );
};

export default ProfessionalWalletDashboard;
