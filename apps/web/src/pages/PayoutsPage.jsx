
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, DollarSign, Plus, Eye, History } from 'lucide-react';
import CreatePayoutModal from '@/components/CreatePayoutModal.jsx';
import PayoutDetailModal from '@/components/PayoutDetailModal.jsx';
import PayoutHistoryModal from '@/components/PayoutHistoryModal.jsx';

const PayoutsPage = () => {
  const [payouts, setPayouts] = useState([]);
  const [professionals, setProfessionals] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const [historyProfId, setHistoryProfId] = useState(null);
  const [historyProfName, setHistoryProfName] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payoutsData, profsData] = await Promise.all([
        pb.collection('payouts').getFullList({ sort: '-created', $autoCancel: false }),
        pb.collection('professionals').getFullList({ $autoCancel: false })
      ]);

      const profMap = {};
      profsData.forEach(p => profMap[p.professional_id] = p.professional_name);
      setProfessionals(profMap);
      setPayouts(payoutsData);
    } catch (error) {
      console.error("Error fetching payouts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRowClick = (payout) => {
    setSelectedPayout(payout);
    setIsDetailOpen(true);
  };

  const openHistory = (e, profId, profName) => {
    e.stopPropagation();
    setHistoryProfId(profId);
    setHistoryProfName(profName);
    setIsHistoryOpen(true);
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

  const filteredPayouts = payouts.filter(p => {
    const profName = professionals[p.professional_id] || p.professional_id;
    const matchesSearch = profName.toLowerCase().includes(searchQuery.toLowerCase()) || p.payout_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? p.payout_status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-[700] tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            Pagamentos (Payouts)
          </h1>
          <p className="text-muted-foreground mt-1 font-[400]">Gerencie as solicitações e efetivações de repasses aos profissionais.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="orvium-btn-primary font-[600]">
          <Plus className="w-4 h-4 mr-2" /> Nova Solicitação
        </Button>
      </div>

      <div className="orvium-card p-4 bg-white">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por profissional ou ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 h-11"
            />
          </div>
          <select 
            className="flex h-11 w-full md:w-48 rounded-md border border-input bg-slate-50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="approved">Aprovado</option>
            <option value="paid">Pago</option>
            <option value="canceled">Cancelado</option>
          </select>
        </div>
      </div>

      <div className="orvium-card p-0 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="border-b border-slate-200">
              <TableHead className="font-[600] text-slate-600 py-4">Profissional</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">Período Ref.</TableHead>
              <TableHead className="text-right font-[600] text-slate-600 py-4">Valor</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">Status</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">Data Pagamento</TableHead>
              <TableHead className="text-right font-[600] text-slate-600 py-4">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-500">Carregando pagamentos...</TableCell></TableRow>
            ) : filteredPayouts.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-500">Nenhum pagamento encontrado.</TableCell></TableRow>
            ) : (
              filteredPayouts.map((payout) => {
                const profName = professionals[payout.professional_id] || payout.professional_id;
                return (
                  <TableRow key={payout.id} className="orvium-table-row" onClick={() => handleRowClick(payout)}>
                    <TableCell className="font-[600] text-slate-700 py-4">
                      <div>{profName}</div>
                      <div className="text-xs text-slate-400 font-normal font-mono">{payout.payout_id}</div>
                    </TableCell>
                    <TableCell className="py-4 text-slate-600 font-medium">{payout.reference_period}</TableCell>
                    <TableCell className="text-right py-4 font-[700] font-mono-num text-[hsl(var(--success))]">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payout.payout_amount || 0)}
                    </TableCell>
                    <TableCell className="py-4">
                      {getStatusBadge(payout.payout_status)}
                    </TableCell>
                    <TableCell className="py-4 text-slate-500 text-sm">
                      {payout.payout_date ? new Date(payout.payout_date).toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex justify-end items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => openHistory(e, payout.professional_id, profName)}
                          className="text-slate-500 hover:text-primary hover:bg-primary/5"
                          title="Ver Histórico do Profissional"
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-slate-500 hover:text-primary hover:bg-primary/5"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <CreatePayoutModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onSuccess={fetchData} 
      />

      <PayoutDetailModal 
        payout={selectedPayout}
        professionalName={selectedPayout ? professionals[selectedPayout.professional_id] : ''}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdate={() => {
          setIsDetailOpen(false);
          fetchData();
        }}
      />

      <PayoutHistoryModal
        professionalId={historyProfId}
        professionalName={historyProfName}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
};

export default PayoutsPage;
