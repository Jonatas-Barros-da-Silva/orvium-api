
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const FinancialFlowVisualization = ({ metrics, loading }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value || 0);
  };

  if (loading) {
    return <Skeleton className="w-full h-[160px] rounded-xl mb-6" />;
  }

  const repassePercentage = metrics.totalRevenue > 0 ? ((metrics.totalRepasse / metrics.totalRevenue) * 100).toFixed(1) : 0;
  const paidPercentage = metrics.totalRepasse > 0 ? ((metrics.totalPaid / metrics.totalRepasse) * 100).toFixed(1) : 0;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
      <h3 className="text-lg font-bold text-slate-800 mb-6">Fluxo Financeiro</h3>
      
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Revenue */}
        <div className="flow-card border-t-4 border-t-[hsl(var(--flow-revenue))]">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Receita Bruta</p>
          <p className="text-3xl font-bold text-slate-800 font-mono-num">{formatCurrency(metrics.totalRevenue)}</p>
          <div className="absolute -right-4 -bottom-4 opacity-5">
            <div className="w-24 h-24 rounded-full bg-[hsl(var(--flow-revenue))]"></div>
          </div>
        </div>

        <div className="hidden lg:flex flex-col items-center text-slate-400 px-2">
          <span className="text-xs font-medium mb-1">{repassePercentage}%</span>
          <ArrowRight className="w-6 h-6" />
        </div>

        {/* Repasse */}
        <div className="flow-card border-t-4 border-t-[hsl(var(--flow-repasse))]">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Repasse Gerado</p>
          <p className="text-3xl font-bold text-slate-800 font-mono-num">{formatCurrency(metrics.totalRepasse)}</p>
          <div className="absolute -right-4 -bottom-4 opacity-5">
            <div className="w-24 h-24 rounded-full bg-[hsl(var(--flow-repasse))]"></div>
          </div>
        </div>

        <div className="hidden lg:flex flex-col items-center text-slate-400 px-2">
          <span className="text-xs font-medium mb-1">{paidPercentage}% pago</span>
          <ArrowRight className="w-6 h-6" />
        </div>

        {/* Split: Paid & Outstanding */}
        <div className="flex flex-col gap-3 flex-1 min-w-[200px]">
          <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex justify-between items-center">
            <span className="text-sm font-medium text-green-800">Efetivamente Pago</span>
            <span className="text-lg font-bold text-green-700 font-mono-num">{formatCurrency(metrics.totalPaid)}</span>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex justify-between items-center">
            <span className="text-sm font-medium text-red-800">Saldo Pendente</span>
            <span className="text-lg font-bold text-red-700 font-mono-num">{formatCurrency(metrics.outstandingBalance)}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FinancialFlowVisualization;
