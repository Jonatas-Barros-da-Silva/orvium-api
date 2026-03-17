
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Building2, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

const WalletSummaryCard = ({ transactions, organizations, balance }) => {
  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  // Calculate breakdown by organization
  const orgStats = {};
  
  transactions.forEach(t => {
    if (!orgStats[t.organization_id]) {
      const orgName = organizations.find(o => o.organization_id === t.organization_id)?.organization_name || t.organization_id;
      orgStats[t.organization_id] = { name: orgName, earnings: 0, pending: 0, available: 0 };
    }
    
    if (t.transaction_type === 'repasse_credit' && t.status === 'completed') {
      orgStats[t.organization_id].earnings += t.amount;
      orgStats[t.organization_id].available += t.amount;
    }
    if (t.transaction_type === 'payout_debit' && t.status === 'completed') {
      orgStats[t.organization_id].available -= t.amount;
    }
    if (t.status === 'pending') {
      orgStats[t.organization_id].pending += t.amount;
    }
  });

  const orgList = Object.values(orgStats).sort((a, b) => b.earnings - a.earnings);
  const recentTransactions = transactions.slice(0, 10);

  const getTypeIcon = (type) => {
    if (type === 'repasse_credit') return <ArrowDownRight className="w-4 h-4 text-blue-600" />;
    if (type === 'payout_debit') return <ArrowUpRight className="w-4 h-4 text-red-600" />;
    return <Clock className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      <div className="prof-wallet-card">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Resumo por Organização
        </h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200">
                <TableHead className="font-semibold text-slate-600">Organização</TableHead>
                <TableHead className="text-right font-semibold text-slate-600">Ganhos Totais</TableHead>
                <TableHead className="text-right font-semibold text-slate-600">Pendente</TableHead>
                <TableHead className="text-right font-semibold text-slate-600">Disponível (Est.)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgList.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-6 text-slate-500">Nenhum dado disponível.</TableCell></TableRow>
              ) : (
                orgList.map((org, idx) => (
                  <TableRow key={idx} className="prof-table-row">
                    <TableCell className="font-medium text-slate-800">{org.name}</TableCell>
                    <TableCell className="text-right font-mono-num text-blue-600 font-medium">{formatCurrency(org.earnings)}</TableCell>
                    <TableCell className="text-right font-mono-num text-orange-600">{formatCurrency(org.pending)}</TableCell>
                    <TableCell className="text-right font-mono-num text-green-600 font-bold">{formatCurrency(org.available)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="prof-wallet-card">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Transações Recentes</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200">
                <TableHead className="font-semibold text-slate-600">Data</TableHead>
                <TableHead className="font-semibold text-slate-600">Tipo</TableHead>
                <TableHead className="font-semibold text-slate-600">Organização</TableHead>
                <TableHead className="text-right font-semibold text-slate-600">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-6 text-slate-500">Nenhuma transação recente.</TableCell></TableRow>
              ) : (
                recentTransactions.map((t) => {
                  const orgName = organizations.find(o => o.organization_id === t.organization_id)?.organization_name || t.organization_id;
                  return (
                    <TableRow key={t.id} className="prof-table-row">
                      <TableCell className="text-sm text-slate-600">
                        {new Date(t.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(t.transaction_type)}
                          <span className="text-sm font-medium text-slate-700">
                            {t.transaction_type === 'repasse_credit' ? 'Crédito' : t.transaction_type === 'payout_debit' ? 'Saque' : 'Ajuste'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">{orgName}</TableCell>
                      <TableCell className={`text-right font-mono-num font-bold ${t.transaction_type === 'payout_debit' ? 'text-red-600' : 'text-blue-600'}`}>
                        {t.transaction_type === 'payout_debit' ? '-' : '+'}{formatCurrency(t.amount)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default WalletSummaryCard;
