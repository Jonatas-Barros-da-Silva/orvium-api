
import React, { useState } from 'react';
import { useProfessionalWallet } from '@/hooks/useProfessionalWallet.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';
import TransactionDetailModal from '@/components/TransactionDetailModal.jsx';

const TransactionHistoryPage = () => {
  const { transactions, organizations, loading } = useProfessionalWallet();
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  
  const [selectedTx, setSelectedTx] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const handleRowClick = (tx) => {
    const orgName = organizations.find(o => o.organization_id === tx.organization_id)?.organization_name || tx.organization_id;
    setSelectedTx({ ...tx, organization_name: orgName });
    setIsModalOpen(true);
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.transaction_id.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter ? tx.transaction_type === typeFilter : true;
    const matchesOrg = orgFilter ? tx.organization_id === orgFilter : true;
    return matchesSearch && matchesType && matchesOrg;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <Badge className="bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20">Concluído</Badge>;
      case 'pending': return <Badge className="bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/20">Pendente</Badge>;
      case 'failed': return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Falhou</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'repasse_credit': return <span className="text-blue-600 font-medium">Crédito</span>;
      case 'payout_debit': return <span className="text-red-600 font-medium">Saque</span>;
      case 'adjustment': return <span className="text-slate-600 font-medium">Ajuste</span>;
      case 'refund': return <span className="text-orange-600 font-medium">Reembolso</span>;
      default: return type;
    }
  };

  if (loading) return <div className="py-12 text-center text-slate-500">Carregando histórico...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Histórico Financeiro</h1>
        <p className="text-slate-500 mt-1">Visualize todas as movimentações da sua carteira.</p>
      </div>

      <div className="prof-wallet-card p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por ID da transação..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 h-11"
            />
          </div>
          <select 
            className="flex h-11 w-full md:w-48 rounded-md border border-input bg-slate-50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Todos os Tipos</option>
            <option value="repasse_credit">Créditos</option>
            <option value="payout_debit">Saques</option>
            <option value="adjustment">Ajustes</option>
          </select>
          <select 
            className="flex h-11 w-full md:w-48 rounded-md border border-input bg-slate-50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
          >
            <option value="">Todas as Organizações</option>
            {organizations.map(org => (
              <option key={org.id} value={org.organization_id}>{org.organization_name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="prof-wallet-card p-0 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-600 py-4">Data</TableHead>
              <TableHead className="font-semibold text-slate-600 py-4">ID Transação</TableHead>
              <TableHead className="font-semibold text-slate-600 py-4">Organização</TableHead>
              <TableHead className="font-semibold text-slate-600 py-4">Tipo</TableHead>
              <TableHead className="text-right font-semibold text-slate-600 py-4">Valor</TableHead>
              <TableHead className="font-semibold text-slate-600 py-4">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-500">Nenhuma transação encontrada.</TableCell></TableRow>
            ) : (
              filteredTransactions.map((tx) => {
                const orgName = organizations.find(o => o.organization_id === tx.organization_id)?.organization_name || tx.organization_id;
                return (
                  <TableRow key={tx.id} className="prof-table-row cursor-pointer" onClick={() => handleRowClick(tx)}>
                    <TableCell className="py-4 text-sm text-slate-600">
                      {new Date(tx.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="py-4 font-mono text-xs text-slate-500">
                      {tx.transaction_id.substring(0, 12)}...
                    </TableCell>
                    <TableCell className="py-4 font-medium text-slate-700">{orgName}</TableCell>
                    <TableCell className="py-4">{getTypeLabel(tx.transaction_type)}</TableCell>
                    <TableCell className={`text-right py-4 font-mono-num font-bold ${tx.transaction_type === 'payout_debit' ? 'text-red-600' : 'text-blue-600'}`}>
                      {tx.transaction_type === 'payout_debit' ? '-' : '+'}{formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell className="py-4">{getStatusBadge(tx.status)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <TransactionDetailModal 
        transaction={selectedTx} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default TransactionHistoryPage;
