
import React from 'react';
import { Activity, DollarSign, TrendingUp, CheckCircle, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const FinancialMetricsCards = ({ metrics, loading }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="metric-card h-[120px]">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      
      <div className="metric-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-500">Procedimentos Executados</span>
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h4 className="text-2xl font-bold text-slate-800 font-mono-num">{formatNumber(metrics.totalProcedures)}</h4>
        </div>
      </div>

      <div className="metric-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-500">Receita Bruta Gerada</span>
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h4 className="text-2xl font-bold text-slate-800 font-mono-num">{formatCurrency(metrics.totalRevenue)}</h4>
        </div>
      </div>

      <div className="metric-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-500">Repasse Calculado</span>
          <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h4 className="text-2xl font-bold text-slate-800 font-mono-num">{formatCurrency(metrics.totalRepasse)}</h4>
        </div>
      </div>

      <div className="metric-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-500">Total Pago (Efetivado)</span>
          <div className="p-2 bg-green-50 rounded-lg text-green-600">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h4 className="text-2xl font-bold text-slate-800 font-mono-num">{formatCurrency(metrics.totalPaid)}</h4>
        </div>
      </div>

      <div className="metric-card border-l-4 border-l-[hsl(var(--destructive))]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-500">Saldo Pendente Atual</span>
          <div className="p-2 bg-red-50 rounded-lg text-red-600">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h4 className="text-2xl font-bold text-slate-800 font-mono-num">{formatCurrency(metrics.outstandingBalance)}</h4>
        </div>
      </div>

    </div>
  );
};

export default FinancialMetricsCards;
