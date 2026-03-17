
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Receipt, History } from 'lucide-react';
import EventModal from '@/components/EventModal.jsx';

const FinancialEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Ledger Modal State
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [eventLedgerEntries, setEventLedgerEntries] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [selectedEventForLedger, setSelectedEventForLedger] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: ''
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let filterStr = [];
      if (filters.search) {
        filterStr.push(`(professional_id ~ "${filters.search}" || procedure_id ~ "${filters.search}" || event_id ~ "${filters.search}")`);
      }
      if (filters.type) filterStr.push(`event_type = "${filters.type}"`);
      if (filters.status) filterStr.push(`status = "${filters.status}"`);

      const records = await pb.collection('financial_events').getList(1, 50, { 
        sort: '-created_at',
        filter: filterStr.join(' && '),
        $autoCancel: false 
      });
      setEvents(records.items);
    } catch (error) {
      console.error("Error fetching financial events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEvents();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [filters]);

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

  const handleRowClick = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const openLedgerEntries = async (e, event) => {
    e.stopPropagation(); // Prevent row click
    setSelectedEventForLedger(event);
    setIsLedgerModalOpen(true);
    setLoadingLedger(true);
    
    try {
      const entries = await pb.collection('financial_ledger_entries').getFullList({
        filter: `event_id="${event.event_id}"`,
        sort: '-created',
        $autoCancel: false
      });
      setEventLedgerEntries(entries);
    } catch (error) {
      console.error("Error fetching ledger entries for event:", error);
    } finally {
      setLoadingLedger(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-[700] tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-primary" />
            Eventos Financeiros
          </h1>
          <p className="text-muted-foreground mt-1 font-[400]">Log imutável de todas as transações e repasses.</p>
        </div>
      </div>

      <div className="orvium-card p-4 mb-6 bg-white">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por ID, Profissional ou Procedimento..." 
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="pl-9 bg-slate-50 border-slate-200 h-11"
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <select 
              className="flex h-11 w-full md:w-48 rounded-md border border-input bg-slate-50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
            >
              <option value="">Todos os Tipos</option>
              <option value="PROCEDURE_EXECUTED">Procedimento Executado</option>
              <option value="PROCEDURE_CANCELED">Procedimento Cancelado</option>
              <option value="PROCEDURE_REFUNDED">Procedimento Reembolsado</option>
              <option value="FINANCIAL_ADJUSTMENT">Ajuste Financeiro</option>
              <option value="PAYOUT_CREATED">Repasse Criado</option>
              <option value="PAYOUT_COMPLETED">Repasse Concluído</option>
            </select>
            <select 
              className="flex h-11 w-full md:w-40 rounded-md border border-input bg-slate-50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="">Qualquer Status</option>
              <option value="pending">Pendente</option>
              <option value="processed">Processado</option>
              <option value="completed">Concluído</option>
              <option value="failed">Falhou</option>
            </select>
          </div>
        </div>
      </div>

      <div className="orvium-card p-0 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="border-b border-slate-200">
              <TableHead className="font-[600] text-slate-600 py-4">Tipo de Evento</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">Profissional</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">Procedimento</TableHead>
              <TableHead className="text-right font-[600] text-slate-600 py-4">Valor Bruto</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">Status</TableHead>
              <TableHead className="text-right font-[600] text-slate-600 py-4">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-500">Carregando eventos...</TableCell></TableRow>
            ) : events.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-500">Nenhum evento encontrado.</TableCell></TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id} className="orvium-table-row" onClick={() => handleRowClick(event)}>
                  <TableCell className="py-4">
                    <Badge variant="secondary" className={getEventTypeColor(event.event_type)}>
                      {event.event_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 font-medium text-slate-700">
                    {event.metadata?.professional_name || event.professional_id}
                  </TableCell>
                  <TableCell className="py-4 text-slate-600">
                    {event.metadata?.procedure_name || event.procedure_id}
                  </TableCell>
                  <TableCell className="text-right py-4 font-[700] text-slate-800">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(event.gross_amount || 0)}
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant="outline" className={getStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => openLedgerEntries(e, event)}
                      className="text-primary hover:bg-primary/10"
                    >
                      <History className="w-4 h-4 mr-2" /> Lançamentos
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EventModal 
        event={selectedEvent} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      {/* Ledger Entries Modal */}
      <Dialog open={isLedgerModalOpen} onOpenChange={(open) => !open && setIsLedgerModalOpen(false)}>
        <DialogContent className="sm:max-w-[700px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Lançamentos do Evento
            </DialogTitle>
            <p className="text-sm text-muted-foreground font-mono mt-1">
              Ref: {selectedEventForLedger?.event_id}
            </p>
          </DialogHeader>
          
          <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-[600] text-slate-600">Tipo</TableHead>
                  <TableHead className="font-[600] text-slate-600">Descrição</TableHead>
                  <TableHead className="font-[600] text-slate-600">Profissional</TableHead>
                  <TableHead className="text-right font-[600] text-slate-600">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingLedger ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">Buscando lançamentos...</TableCell></TableRow>
                ) : eventLedgerEntries.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">Nenhum lançamento contábil gerado para este evento.</TableCell></TableRow>
                ) : (
                  eventLedgerEntries.map((entry) => {
                    const isCredit = entry.entry_type === 'PROFESSIONAL_PAYABLE' || entry.entry_type === 'REPASSE_EXPENSE';
                    const isDebit = entry.entry_type === 'PAYOUT_DEDUCTION';
                    
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="py-3">
                          <Badge variant="outline" className={isCredit ? 'orvium-badge-success' : isDebit ? 'orvium-badge-destructive' : 'bg-slate-100 text-slate-600'}>
                            {entry.entry_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-sm text-slate-700">{entry.description}</TableCell>
                        <TableCell className="py-3 text-sm text-slate-500 font-mono">{entry.professional_id}</TableCell>
                        <TableCell className={`text-right py-3 font-[600] font-mono-num ${isCredit ? 'text-[hsl(var(--success))]' : isDebit ? 'text-[hsl(var(--destructive))]' : 'text-slate-600'}`}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.amount || 0)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-end mt-2">
            <Button variant="outline" onClick={() => setIsLedgerModalOpen(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancialEventsPage;
