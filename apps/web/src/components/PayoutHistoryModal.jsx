
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, DollarSign } from 'lucide-react';

const PayoutHistoryModal = ({ professionalId, professionalName, isOpen, onClose }) => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalPaid: 0, totalPending: 0 });

  useEffect(() => {
    if (!isOpen || !professionalId) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const records = await pb.collection('payouts').getFullList({
          filter: `professional_id="${professionalId}"`,
          sort: '-created',
          $autoCancel: false
        });

        let paid = 0;
        let pending = 0;

        records.forEach(p => {
          if (p.payout_status === 'paid') paid += p.payout_amount;
          if (p.payout_status === 'pending' || p.payout_status === 'approved') pending += p.payout_amount;
        });

        setPayouts(records);
        setSummary({ totalPaid: paid, totalPending: pending });
      } catch (error) {
        console.error("Error fetching payout history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, professionalId]);

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
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] flex flex-col rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Histórico de Pagamentos: {professionalName || professionalId}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4 flex-1 overflow-hidden">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex flex-col justify-center">
              <span className="text-sm font-medium text-green-800 flex items-center gap-1"><DollarSign className="w-4 h-4"/> Total Pago</span>
              <span className="text-2xl font-bold text-green-700 font-mono-num mt-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.totalPaid)}
              </span>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 flex flex-col justify-center">
              <span className="text-sm font-medium text-orange-800 flex items-center gap-1"><History className="w-4 h-4"/> Em Processamento</span>
              <span className="text-2xl font-bold text-orange-700 font-mono-num mt-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.totalPending)}
              </span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-y-auto flex-1 bg-white mt-2">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                <TableRow>
                  <TableHead className="font-[600] text-slate-600">Data Solicitação</TableHead>
                  <TableHead className="font-[600] text-slate-600">Período Ref.</TableHead>
                  <TableHead className="text-right font-[600] text-slate-600">Valor</TableHead>
                  <TableHead className="font-[600] text-slate-600">Status</TableHead>
                  <TableHead className="font-[600] text-slate-600">Data Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-500">Carregando histórico...</TableCell></TableRow>
                ) : payouts.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-500">Nenhum pagamento registrado.</TableCell></TableRow>
                ) : (
                  payouts.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50/50">
                      <TableCell className="py-3 text-sm text-slate-600">
                        {new Date(p.created).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="py-3 text-sm font-medium text-slate-700">
                        {p.reference_period}
                      </TableCell>
                      <TableCell className="text-right py-3 font-[600] font-mono-num text-slate-800">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.payout_amount || 0)}
                      </TableCell>
                      <TableCell className="py-3">
                        {getStatusBadge(p.payout_status)}
                      </TableCell>
                      <TableCell className="py-3 text-sm text-slate-500">
                        {p.payout_date ? new Date(p.payout_date).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>Fechar Histórico</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PayoutHistoryModal;
