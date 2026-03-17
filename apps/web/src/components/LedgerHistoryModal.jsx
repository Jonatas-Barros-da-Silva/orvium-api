
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, History } from 'lucide-react';
import LedgerEntryDetailsModal from './LedgerEntryDetailsModal.jsx';

const LedgerHistoryModal = ({ professionalId, professionalName, isOpen, onClose }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [entryType, setEntryType] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  useEffect(() => {
    if (!isOpen || !professionalId) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        // Fetch all entries for the professional to calculate running balance accurately
        const records = await pb.collection('financial_ledger_entries').getFullList({
          filter: `professional_id="${professionalId}"`,
          sort: 'entry_date,created', // Chronological order for running balance
          $autoCancel: false
        });

        let currentBalance = 0;
        const processed = records.map(entry => {
          const isCredit = entry.entry_type === 'PROFESSIONAL_PAYABLE' || entry.entry_type === 'REPASSE_EXPENSE';
          const isDebit = entry.entry_type === 'PAYOUT_DEDUCTION';
          
          if (isCredit) currentBalance += entry.amount;
          else if (isDebit) currentBalance -= entry.amount;

          return {
            ...entry,
            running_balance: currentBalance,
            isCredit,
            isDebit
          };
        });

        // Reverse to show newest first
        setEntries(processed.reverse());
      } catch (error) {
        console.error("Error fetching ledger history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, professionalId]);

  const handleRowClick = (entry) => {
    setSelectedEntry(entry);
    setIsDetailsOpen(true);
  };

  // Apply local filters
  const filteredEntries = entries.filter(entry => {
    if (dateFrom && entry.entry_date < dateFrom) return false;
    if (dateTo && entry.entry_date > dateTo) return false;
    if (entryType && entry.entry_type !== entryType) return false;
    if (minAmount && entry.amount < Number(minAmount)) return false;
    if (maxAmount && entry.amount > Number(maxAmount)) return false;
    return true;
  });

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Extrato Financeiro: {professionalName || professionalId}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4 flex-1 overflow-hidden">
            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Data Inicial</label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Data Final</label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Tipo</label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={entryType}
                  onChange={e => setEntryType(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="PROFESSIONAL_PAYABLE">Crédito (Repasse)</option>
                  <option value="REPASSE_EXPENSE">Crédito (Despesa)</option>
                  <option value="PAYOUT_DEDUCTION">Débito (Pagamento)</option>
                  <option value="ADJUSTMENT">Ajuste</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Valor Min (R$)</label>
                <Input type="number" placeholder="0.00" value={minAmount} onChange={e => setMinAmount(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Valor Max (R$)</label>
                <Input type="number" placeholder="9999.00" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-200 rounded-lg overflow-y-auto flex-1 bg-white">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="font-[600] text-slate-600">Data</TableHead>
                    <TableHead className="font-[600] text-slate-600">Tipo</TableHead>
                    <TableHead className="font-[600] text-slate-600">Descrição</TableHead>
                    <TableHead className="text-right font-[600] text-slate-600">Valor</TableHead>
                    <TableHead className="text-right font-[600] text-slate-600">Saldo Acumulado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-500">Carregando extrato...</TableCell></TableRow>
                  ) : filteredEntries.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-500">Nenhum lançamento encontrado.</TableCell></TableRow>
                  ) : (
                    filteredEntries.map((entry) => (
                      <TableRow key={entry.id} className="orvium-table-row" onClick={() => handleRowClick(entry)}>
                        <TableCell className="py-3 text-sm text-slate-600 whitespace-nowrap">
                          {new Date(entry.entry_date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline" className={entry.isCredit ? 'orvium-badge-success' : entry.isDebit ? 'orvium-badge-destructive' : 'bg-slate-100 text-slate-600'}>
                            {entry.entry_type === 'PROFESSIONAL_PAYABLE' || entry.entry_type === 'REPASSE_EXPENSE' ? 'CRÉDITO' : entry.entry_type === 'PAYOUT_DEDUCTION' ? 'DÉBITO' : entry.entry_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-sm text-slate-700 max-w-[200px] truncate" title={entry.description}>
                          {entry.description}
                        </TableCell>
                        <TableCell className={`text-right py-3 font-[600] font-mono-num ${entry.isCredit ? 'text-[hsl(var(--success))]' : entry.isDebit ? 'text-[hsl(var(--destructive))]' : 'text-slate-600'}`}>
                          {entry.isDebit ? '-' : '+'}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.amount || 0)}
                        </TableCell>
                        <TableCell className="text-right py-3 font-[700] font-mono-num text-slate-800">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.running_balance || 0)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={onClose}>Fechar Extrato</Button>
          </div>
        </DialogContent>
      </Dialog>

      <LedgerEntryDetailsModal 
        entry={selectedEntry} 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
      />
    </>
  );
};

export default LedgerHistoryModal;
