
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const EventModal = ({ event, isOpen, onClose }) => {
  if (!event) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30';
      case 'processed': return 'bg-primary/20 text-primary border-primary/30';
      case 'failed': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'completed': return 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-[hsl(var(--success))]/30';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getEventTypeColor = (type) => {
    if (type.includes('EXECUTED') || type.includes('COMPLETED')) return 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]';
    if (type.includes('CANCELED') || type.includes('FAILED')) return 'bg-destructive/10 text-destructive';
    if (type.includes('REFUNDED')) return 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]';
    return 'bg-primary/10 text-primary';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-3">
            Detalhes do Evento
            <Badge variant="outline" className={getStatusColor(event.status)}>
              {event.status.toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">ID do Evento</p>
              <p className="text-sm font-semibold font-mono">{event.event_id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Data do Evento</p>
              <p className="text-sm font-semibold">{new Date(event.event_date).toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Tipo de Evento</p>
              <Badge variant="secondary" className={getEventTypeColor(event.event_type)}>
                {event.event_type}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Valor Bruto</p>
              <p className="text-lg font-bold text-foreground">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(event.gross_amount || 0)}
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-4 grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Organização</p>
              <p className="text-sm font-medium">{event.organization_id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Unidade</p>
              <p className="text-sm font-medium">{event.metadata?.unit_name || event.unit_id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Profissional</p>
              <p className="text-sm font-medium">{event.metadata?.professional_name || event.professional_id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Procedimento</p>
              <p className="text-sm font-medium">{event.metadata?.procedure_name || event.procedure_id}</p>
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Metadata (JSON)</p>
            <pre className="bg-slate-50 p-4 rounded-lg text-xs font-mono text-slate-700 overflow-x-auto border border-slate-200">
              {JSON.stringify(event.metadata || {}, null, 2)}
            </pre>
          </div>

          <div className="text-xs text-muted-foreground text-right">
            Criado em: {new Date(event.created_at || event.created).toLocaleString('pt-BR')}
          </div>
        </div>
        
        <div className="flex justify-end mt-2">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventModal;
