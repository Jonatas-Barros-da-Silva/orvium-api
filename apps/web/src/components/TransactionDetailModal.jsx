
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TransactionDetailModal = ({ transaction, isOpen, onClose }) => {
  const { toast } = useToast();

  if (!transaction) return null;

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "ID da transação copiado para a área de transferência.",
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <Badge className="bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20"><CheckCircle className="w-3 h-3 mr-1"/> Concluído</Badge>;
      case 'pending': return <Badge className="bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/20"><Clock className="w-3 h-3 mr-1"/> Pendente</Badge>;
      case 'failed': return <Badge className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="w-3 h-3 mr-1"/> Falhou</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'repasse_credit': return <span className="text-blue-600 font-medium">Crédito de Repasse</span>;
      case 'payout_debit': return <span className="text-red-600 font-medium">Débito de Saque</span>;
      case 'adjustment': return <span className="text-slate-600 font-medium">Ajuste</span>;
      case 'refund': return <span className="text-orange-600 font-medium">Reembolso</span>;
      default: return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            Detalhes da Transação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">Valor</p>
              <p className={`text-3xl font-bold font-mono-num ${transaction.transaction_type === 'payout_debit' ? 'text-red-600' : 'text-blue-600'}`}>
                {transaction.transaction_type === 'payout_debit' ? '-' : '+'}{formatCurrency(transaction.amount)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 font-medium mb-1">Status</p>
              {getStatusBadge(transaction.status)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
            <div>
              <p className="text-slate-500 font-medium mb-1">ID da Transação</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-800 truncate max-w-[150px]">{transaction.transaction_id}</span>
                <button onClick={() => copyToClipboard(transaction.transaction_id)} className="text-slate-400 hover:text-primary">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div>
              <p className="text-slate-500 font-medium mb-1">Data e Hora</p>
              <p className="text-slate-800 font-medium">{new Date(transaction.created_at).toLocaleString('pt-BR')}</p>
            </div>

            <div>
              <p className="text-slate-500 font-medium mb-1">Tipo</p>
              <p>{getTypeLabel(transaction.transaction_type)}</p>
            </div>

            <div>
              <p className="text-slate-500 font-medium mb-1">Organização</p>
              <p className="text-slate-800 font-medium">{transaction.organization_name || transaction.organization_id}</p>
            </div>

            {transaction.event_id && (
              <div className="col-span-2">
                <p className="text-slate-500 font-medium mb-1">ID do Evento Origem</p>
                <p className="font-mono text-slate-600">{transaction.event_id}</p>
              </div>
            )}
            
            {transaction.repasse_calculation_id && (
              <div className="col-span-2">
                <p className="text-slate-500 font-medium mb-1">ID do Cálculo de Repasse</p>
                <p className="font-mono text-slate-600">{transaction.repasse_calculation_id}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetailModal;
