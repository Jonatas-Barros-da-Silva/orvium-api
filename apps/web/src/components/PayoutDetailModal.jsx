
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePayoutEngine } from '@/hooks/usePayoutEngine.js';
import { FileText, Calendar, User, CheckCircle, XCircle, DollarSign, History } from 'lucide-react';

const PayoutDetailModal = ({ payout, professionalName, isOpen, onClose, onUpdate }) => {
  const { processPayoutPayment, changePayoutStatus, isProcessing } = usePayoutEngine();
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  useEffect(() => {
    if (isOpen && payout && payout.payout_status === 'paid') {
      fetchLedgerEntries();
    } else {
      setLedgerEntries([]);
    }
  }, [isOpen, payout]);

  const fetchLedgerEntries = async () => {
    setLoadingLedger(true);
    try {
      const entries = await pb.collection('financial_ledger_entries').getFullList({
        filter: `event_id="${payout.payout_id}" && entry_type="PAYOUT_DEDUCTION"`,
        $autoCancel: false
      });
      setLedgerEntries(entries);
    } catch (error) {
      console.error("Error fetching ledger entries for payout:", error);
    } finally {
      setLoadingLedger(false);
    }
  };

  if (!payout) return null;

  const handleApprove = async () => {
    const res = await changePayoutStatus(payout.id, 'approved');
    if (res.success) onUpdate();
  };

  const handleCancel = async () => {
    if (window.confirm('Tem certeza que deseja cancelar esta solicitação de pagamento?')) {
      const res = await changePayoutStatus(payout.id, 'canceled');
      if (res.success) onUpdate();
    }
  };

  const handlePay = async () => {
    if (window.confirm('Confirmar o pagamento? Isso irá deduzir o valor do saldo do profissional e gerar um lançamento contábil.')) {
      const res = await processPayoutPayment(payout, professionalName);
      if (res.success) onUpdate();
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <Badge className="payout-badge-pending">Pendente</Badge>;
      case 'approved': return <Badge className="payout-badge-approved">Aprovado</Badge>;
      case 'paid': return <Badge className="payout-badge-paid">Pago</Badge>;
      case 'canceled': return <Badge className="payout-badge-canceled">Cancelado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Detalhes do Pagamento
            </div>
            {getStatusBadge(payout.payout_status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <User className="w-4 h-4" /> Profissional
              </p>
              <p className="text-base font-semibold text-slate-700">
                {professionalName || payout.professional_id}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-4 h-4" /> Valor do Pagamento
              </p>
              <p className="text-2xl font-bold text-[hsl(var(--success))] font-mono-num">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payout.payout_amount || 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Período de Referência
              </p>
              <p className="text-sm font-medium text-slate-800">{payout.reference_period}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Data de Criação
              </p>
              <p className="text-sm font-medium text-slate-800">
                {new Date(payout.created).toLocaleDateString('pt-BR')}
              </p>
            </div>
            {payout.payout_date && (
              <div className="space-y-1 col-span-2">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-[hsl(var(--success))]" /> Data do Pagamento Efetivo
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {new Date(payout.payout_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </div>

          {payout.payout_status === 'paid' && (
            <div className="border-t border-border pt-4 space-y-3">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <History className="w-4 h-4" /> Lançamentos Contábeis Gerados
              </h4>
              {loadingLedger ? (
                <p className="text-sm text-slate-500">Buscando lançamentos...</p>
              ) : ledgerEntries.length > 0 ? (
                <div className="border border-slate-200 rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-xs py-2">ID Lançamento</TableHead>
                        <TableHead className="text-xs py-2">Conta Débito</TableHead>
                        <TableHead className="text-xs py-2 text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ledgerEntries.map(entry => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-xs font-mono text-slate-500 py-2">{entry.ledger_entry_id}</TableCell>
                          <TableCell className="text-xs py-2">{entry.debit_account}</TableCell>
                          <TableCell className="text-xs text-right font-mono-num text-[hsl(var(--destructive))] font-medium py-2">
                            -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">Nenhum lançamento encontrado para este pagamento.</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-6 border-t border-border mt-6 flex sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>Fechar</Button>
          
          <div className="flex gap-2">
            {(payout.payout_status === 'pending' || payout.payout_status === 'approved') && (
              <Button variant="outline" className="text-destructive hover:bg-destructive/10 border-destructive/20" onClick={handleCancel} disabled={isProcessing}>
                <XCircle className="w-4 h-4 mr-2" /> Cancelar
              </Button>
            )}
            
            {payout.payout_status === 'pending' && (
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleApprove} disabled={isProcessing}>
                <CheckCircle className="w-4 h-4 mr-2" /> Aprovar
              </Button>
            )}

            {payout.payout_status === 'approved' && (
              <Button className="bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-white" onClick={handlePay} disabled={isProcessing}>
                <DollarSign className="w-4 h-4 mr-2" /> Efetuar Pagamento
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PayoutDetailModal;
