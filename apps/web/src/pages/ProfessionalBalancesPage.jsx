
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, DollarSign, History, ArrowUpDown } from 'lucide-react';
import LedgerHistoryModal from '@/components/LedgerHistoryModal.jsx';

const ProfessionalBalancesPage = () => {
  const [balances, setBalances] = useState([]);
  const [professionals, setProfessionals] = useState({});
  const [organizations, setOrganizations] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [filterOrg, setFilterOrg] = useState('');
  const [searchName, setSearchName] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'current_balance', direction: 'desc' });

  // Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedProfId, setSelectedProfId] = useState(null);
  const [selectedProfName, setSelectedProfName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [bals, profs, orgs] = await Promise.all([
          pb.collection('professional_balances').getFullList({ $autoCancel: false }),
          pb.collection('professionals').getFullList({ $autoCancel: false }),
          pb.collection('organizations').getFullList({ $autoCancel: false })
        ]);

        const profMap = {};
        profs.forEach(p => profMap[p.professional_id] = p.professional_name);
        setProfessionals(profMap);

        const orgMap = {};
        orgs.forEach(o => orgMap[o.organization_id] = o.organization_name);
        setOrganizations(orgMap);

        setBalances(bals);
      } catch (error) {
        console.error("Error fetching balances data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const openHistory = (profId, profName) => {
    setSelectedProfId(profId);
    setSelectedProfName(profName);
    setIsHistoryOpen(true);
  };

  const processedBalances = balances.map(b => ({
    ...b,
    professional_name: professionals[b.professional_id] || b.professional_id,
    organization_name: organizations[b.organization_id] || b.organization_id
  }));

  const filteredBalances = processedBalances.filter(b => {
    const matchesOrg = filterOrg ? b.organization_id === filterOrg : true;
    const matchesName = b.professional_name.toLowerCase().includes(searchName.toLowerCase());
    return matchesOrg && matchesName;
  });

  const sortedBalances = [...filteredBalances].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-[700] tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            Saldos Profissionais
          </h1>
          <p className="text-muted-foreground mt-1 font-[400]">Acompanhamento de saldos e repasses pendentes.</p>
        </div>
      </div>

      <div className="orvium-card p-4 bg-white">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nome do profissional..." 
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 h-11"
            />
          </div>
          <select 
            className="flex h-11 w-full md:w-64 rounded-md border border-input bg-slate-50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={filterOrg}
            onChange={(e) => setFilterOrg(e.target.value)}
          >
            <option value="">Todas as Organizações</option>
            {Object.entries(organizations).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="orvium-card p-0 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="border-b border-slate-200">
              <TableHead className="font-[600] text-slate-600 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('professional_name')}>
                <div className="flex items-center gap-1">Profissional <ArrowUpDown className="w-3 h-3" /></div>
              </TableHead>
              <TableHead className="font-[600] text-slate-600 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('organization_name')}>
                <div className="flex items-center gap-1">Organização <ArrowUpDown className="w-3 h-3" /></div>
              </TableHead>
              <TableHead className="text-right font-[600] text-slate-600 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('current_balance')}>
                <div className="flex items-center justify-end gap-1">Saldo Atual <ArrowUpDown className="w-3 h-3" /></div>
              </TableHead>
              <TableHead className="text-right font-[600] text-slate-600 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('updated')}>
                <div className="flex items-center justify-end gap-1">Última Atualização <ArrowUpDown className="w-3 h-3" /></div>
              </TableHead>
              <TableHead className="text-right font-[600] text-slate-600 py-4">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-500">Carregando saldos...</TableCell></TableRow>
            ) : sortedBalances.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-500">Nenhum saldo encontrado.</TableCell></TableRow>
            ) : (
              sortedBalances.map((balance) => {
                const isNegative = balance.current_balance < 0;
                const isPositive = balance.current_balance > 0;
                
                return (
                  <TableRow key={balance.id} className="orvium-table-row">
                    <TableCell className="font-[600] text-slate-700 py-4">
                      <div>{balance.professional_name}</div>
                      <div className="text-xs text-slate-400 font-normal">{balance.professional_id}</div>
                    </TableCell>
                    <TableCell className="py-4 text-slate-600">{balance.organization_name}</TableCell>
                    <TableCell className={`text-right font-[700] font-mono-num py-4 ${isNegative ? 'text-[hsl(var(--destructive))]' : isPositive ? 'text-[hsl(var(--success))]' : 'text-slate-500'}`}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance.current_balance || 0)}
                    </TableCell>
                    <TableCell className="text-right text-slate-500 text-sm py-4">
                      {new Date(balance.last_update || balance.updated).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openHistory(balance.professional_id, balance.professional_name)}
                        className="text-primary border-primary/20 hover:bg-primary/5"
                      >
                        <History className="w-4 h-4 mr-2" /> Extrato
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <LedgerHistoryModal 
        professionalId={selectedProfId}
        professionalName={selectedProfName}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
};

export default ProfessionalBalancesPage;
