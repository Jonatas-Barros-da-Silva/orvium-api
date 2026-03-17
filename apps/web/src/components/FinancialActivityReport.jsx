
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const FinancialActivityReport = ({ data }) => {
  const [search, setSearch] = useState('');

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const filteredData = data.filter(e => 
    e.professional_name.toLowerCase().includes(search.toLowerCase()) || 
    e.procedure_name.toLowerCase().includes(search.toLowerCase()) ||
    e.event_type.toLowerCase().includes(search.toLowerCase())
  );

  const getEventTypeColor = (type) => {
    if (type.includes('EXECUTED') || type.includes('COMPLETED')) return 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]';
    if (type.includes('CANCELED') || type.includes('FAILED')) return 'bg-destructive/10 text-destructive';
    if (type.includes('REFUNDED')) return 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]';
    return 'bg-primary/10 text-primary';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">Atividade Recente (Últimos 50 eventos)</h3>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Buscar atividade..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-white"
          />
        </div>
      </div>

      <div className="table-container">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-600">Data</TableHead>
              <TableHead className="font-semibold text-slate-600">Tipo de Evento</TableHead>
              <TableHead className="font-semibold text-slate-600">Profissional</TableHead>
              <TableHead className="font-semibold text-slate-600">Procedimento</TableHead>
              <TableHead className="text-right font-semibold text-slate-600">Valor Bruto</TableHead>
              <TableHead className="font-semibold text-slate-600">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">Nenhuma atividade encontrada.</TableCell></TableRow>
            ) : (
              filteredData.map((event) => (
                <TableRow key={event.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell className="py-3 text-sm text-slate-600 whitespace-nowrap">
                    {new Date(event.created).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="secondary" className={getEventTypeColor(event.event_type)}>
                      {event.event_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 font-medium text-slate-700">{event.professional_name}</TableCell>
                  <TableCell className="py-3 text-slate-600">{event.procedure_name}</TableCell>
                  <TableCell className="text-right py-3 font-mono-num font-semibold text-slate-800">
                    {formatCurrency(event.gross_amount)}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
                      {event.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default FinancialActivityReport;
