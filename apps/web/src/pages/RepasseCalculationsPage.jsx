
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, FileText } from 'lucide-react';

const RepasseCalculationsPage = () => {
  const [calculations, setCalculations] = useState([]);
  const [professionals, setProfessionals] = useState({});
  const [rules, setRules] = useState({});
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [selectedCalc, setSelectedCalc] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [calcsData, profsData, rulesData, eventsData] = await Promise.all([
        pb.collection('repasse_calculations').getFullList({ sort: '-created', $autoCancel: false }),
        pb.collection('professionals').getFullList({ $autoCancel: false }),
        pb.collection('repasse_rules').getFullList({ $autoCancel: false }),
        pb.collection('financial_events').getFullList({ $autoCancel: false })
      ]);

      const profMap = {};
      profsData.forEach(p => profMap[p.professional_id] = p);
      setProfessionals(profMap);

      const ruleMap = {};
      rulesData.forEach(r => ruleMap[r.repasse_rule_id] = r);
      setRules(ruleMap);

      const eventMap = {};
      eventsData.forEach(e => eventMap[e.event_id] = e);
      setEvents(eventMap);

      setCalculations(calcsData);
    } catch (error) {
      console.error("Error fetching repasse calculations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRowClick = (calc) => {
    setSelectedCalc(calc);
    setIsModalOpen(true);
  };

  const filteredCalculations = calculations.filter(calc => {
    if (!searchQuery) return true;
    const profName = professionals[calc.professional_id]?.professional_name || calc.professional_id;
    const event = events[calc.event_id];
    const procName = event?.metadata?.procedure_name || event?.procedure_id || '';
    
    return profName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           procName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           calc.event_id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <Badge className="orvium-badge-success" variant="outline">Concluído</Badge>;
      case 'pending': return <Badge className="orvium-badge-warning" variant="outline">Pendente</Badge>;
      case 'failed': return <Badge className="orvium-badge-destructive" variant="outline">Falhou</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderFormula = (rule, gross) => {
    if (!rule) return 'Regra não encontrada';
    if (rule.repasse_model === 'percentage') {
      return `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gross)} × (${rule.percentage_value}%)`;
    }
    if (rule.repasse_model === 'fixed') {
      return `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rule.fixed_amount)}`;
    }
    if (rule.repasse_model === 'hybrid') {
      return `(${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gross)} × ${rule.percentage_value}%) + ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rule.fixed_amount)}`;
    }
    return 'N/A';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-[700] tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Cálculos de Repasse
          </h1>
          <p className="text-muted-foreground mt-1 font-[400]">Histórico de comissionamentos calculados pelo motor de repasse.</p>
        </div>
      </div>

      <div className="orvium-card p-4 bg-white">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Buscar por profissional, procedimento ou evento..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-200 h-11"
          />
        </div>
      </div>

      <div className="orvium-card p-0 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="border-b border-slate-200">
              <TableHead className="font-[600] text-slate-600 py-4">Profissional</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">Procedimento</TableHead>
              <TableHead className="text-right font-[600] text-slate-600 py-4">Valor Bruto</TableHead>
              <TableHead className="text-right font-[600] text-slate-600 py-4">Repasse Calculado</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">Data</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-500">Carregando cálculos...</TableCell></TableRow>
            ) : filteredCalculations.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-500">Nenhum cálculo encontrado.</TableCell></TableRow>
            ) : (
              filteredCalculations.map((calc) => {
                const prof = professionals[calc.professional_id];
                const event = events[calc.event_id];
                const procName = event?.metadata?.procedure_name || event?.procedure_id || 'Desconhecido';

                return (
                  <TableRow key={calc.id} className="orvium-table-row" onClick={() => handleRowClick(calc)}>
                    <TableCell className="py-4 font-medium text-slate-700">
                      {prof?.professional_name || calc.professional_id}
                    </TableCell>
                    <TableCell className="py-4 text-slate-600">
                      {procName}
                    </TableCell>
                    <TableCell className="text-right py-4 text-slate-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.gross_amount || 0)}
                    </TableCell>
                    <TableCell className="text-right py-4 font-[700] text-[hsl(var(--success))]">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calc.calculated_repasse_amount || 0)}
                    </TableCell>
                    <TableCell className="py-4 text-slate-500 text-sm">
                      {new Date(calc.calculation_date || calc.created).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="py-4">
                      {getStatusBadge(calc.calculation_status)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              Detalhes do Cálculo
              {selectedCalc && getStatusBadge(selectedCalc.calculation_status)}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCalc && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Valor Bruto</p>
                  <p className="text-lg font-semibold text-slate-700">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedCalc.gross_amount || 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Repasse Final</p>
                  <p className="text-2xl font-bold text-[hsl(var(--success))]">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedCalc.calculated_repasse_amount || 0)}
                  </p>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Regra Aplicada
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Nome da Regra</p>
                    <p className="text-sm font-medium">{rules[selectedCalc.repasse_rule_id]?.rule_name || selectedCalc.repasse_rule_id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Modelo</p>
                    <p className="text-sm font-medium capitalize">{rules[selectedCalc.repasse_rule_id]?.repasse_model || 'N/A'}</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Fórmula de Cálculo</p>
                    <code className="text-sm bg-slate-100 px-2 py-1 rounded text-slate-700 block mt-1">
                      {renderFormula(rules[selectedCalc.repasse_rule_id], selectedCalc.gross_amount)}
                    </code>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Profissional</p>
                  <p className="text-sm font-medium">{professionals[selectedCalc.professional_id]?.professional_name || selectedCalc.professional_id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Evento Referência</p>
                  <p className="text-sm font-medium font-mono text-primary">{selectedCalc.event_id}</p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-right">
                Calculado em: {new Date(selectedCalc.calculation_date || selectedCalc.created).toLocaleString('pt-BR')}
              </div>
            </div>
          )}
          
          <div className="flex justify-end mt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RepasseCalculationsPage;
