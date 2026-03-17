
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowRightLeft, Calendar, Hash, User, Building2 } from 'lucide-react';

const LedgerEntryDetailsModal = ({ entry, isOpen, onClose }) => {
  if (!entry) return null;

  const isCredit = entry.entry_type === 'PROFESSIONAL_PAYABLE' || entry.entry_type === 'REPASSE_EXPENSE';
  const isDebit = entry.entry_type === 'PAYOUT_DEDUCTION';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-3">
            Detalhes do Lançamento
            <Badge variant="outline" className={isCredit ? 'orvium-badge-success' : isDebit ? 'orvium-badge-destructive' : 'bg-slate-100 text-slate-600'}>
              {entry.entry_type}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Data do Lançamento
              </p>
              <p className="text-base font-semibold text-slate-700">
                {new Date(entry.entry_date).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <FileText className="w-4 h-4" /> Valor
              </p>
              <p className={`text-xl font-bold font-mono-num ${isCredit ? 'text-[hsl(var(--success))]' : isDebit ? 'text-[hsl(var(--destructive))]' : 'text-slate-700'}`}>
                {isDebit ? '-' : '+'}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.amount || 0)}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Descrição</p>
              <p className="text-sm font-medium text-slate-800 bg-white border border-slate-200 p-3 rounded-md">
                {entry.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <ArrowRightLeft className="w-4 h-4" /> Conta Débito
                </p>
                <p className="text-sm font-medium font-mono text-slate-600">{entry.debit_account}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <ArrowRightLeft className="w-4 h-4" /> Conta Crédito
                </p>
                <p className="text-sm font-medium font-mono text-slate-600">{entry.credit_account}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Hash className="w-4 h-4" /> ID do Lançamento
                </p>
                <p className="text-xs font-medium font-mono text-slate-500 break-all">{entry.ledger_entry_id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Hash className="w-4 h-4" /> Evento Referência
                </p>
                <p className="text-xs font-medium font-mono text-primary break-all cursor-pointer hover:underline">
                  {entry.event_id || 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <User className="w-4 h-4" /> Profissional
                </p>
                <p className="text-xs font-medium font-mono text-slate-500 break-all">{entry.professional_id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Building2 className="w-4 h-4" /> Organização
                </p>
                <p className="text-xs font-medium font-mono text-slate-500 break-all">{entry.organization_id}</p>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-right border-t border-border pt-4">
            Registrado em: {new Date(entry.created).toLocaleString('pt-BR')}
          </div>
        </div>
        
        <div className="flex justify-end mt-2">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LedgerEntryDetailsModal;
