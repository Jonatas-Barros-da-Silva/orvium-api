
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Activity, Play, XCircle, RotateCcw } from 'lucide-react';

const ProceduresPage = () => {
  const [procedures, setProcedures] = useState([]);
  const [units, setUnits] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Action Modal State
  const [actionModal, setActionModal] = useState({ isOpen: false, type: null, procedure: null });
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const [formData, setFormData] = useState({
    procedure_id: '',
    organization_id: '',
    procedure_name: '',
    default_price: 0,
    active_status: true
  });

  const fetchData = async () => {
    try {
      const [procs, uns, profs] = await Promise.all([
        pb.collection('procedures').getFullList({ sort: '-created', $autoCancel: false }),
        pb.collection('units').getFullList({ $autoCancel: false }),
        pb.collection('professionals').getFullList({ $autoCancel: false })
      ]);
      setProcedures(procs);
      setUnits(uns);
      setProfessionals(profs);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await pb.collection('procedures').create({...formData, default_price: Number(formData.default_price)}, { $autoCancel: false });
      setIsDialogOpen(false);
      setFormData({ procedure_id: '', organization_id: '', procedure_name: '', default_price: 0, active_status: true });
      fetchData();
    } catch (error) {
      console.error("Error creating procedure:", error);
      alert("Erro ao criar procedimento.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este procedimento?')) {
      try {
        await pb.collection('procedures').delete(id, { $autoCancel: false });
        fetchData();
      } catch (error) {
        console.error("Error deleting procedure:", error);
      }
    }
  };

  const openActionModal = (procedure, type) => {
    setActionModal({ isOpen: true, type, procedure });
    setSelectedUnit('');
    setSelectedProfessional('');
  };

  const handleActionSubmit = async () => {
    if (!selectedUnit || !selectedProfessional) {
      alert("Por favor, selecione a unidade e o profissional.");
      return;
    }

    setIsSubmittingAction(true);
    const { procedure, type } = actionModal;
    
    const unitName = units.find(u => u.unit_id === selectedUnit)?.unit_name || '';
    const profName = professionals.find(p => p.professional_id === selectedProfessional)?.professional_name || '';

    const payload = {
      event_id: crypto.randomUUID(),
      organization_id: procedure.organization_id,
      unit_id: selectedUnit,
      professional_id: selectedProfessional,
      procedure_id: procedure.procedure_id,
      event_type: type,
      gross_amount: procedure.default_price,
      event_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      metadata: {
        procedure_name: procedure.procedure_name,
        unit_name: unitName,
        professional_name: profName
      }
    };

    try {
      await pb.collection('financial_events').create(payload, { $autoCancel: false });
      setActionModal({ isOpen: false, type: null, procedure: null });
      alert(`Evento ${type} registrado com sucesso!`);
    } catch (error) {
      console.error("Error creating financial event:", error);
      alert("Erro ao registrar evento financeiro.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const getActionTitle = (type) => {
    if (type === 'PROCEDURE_EXECUTED') return 'Executar Procedimento';
    if (type === 'PROCEDURE_CANCELED') return 'Cancelar Procedimento';
    if (type === 'PROCEDURE_REFUNDED') return 'Reembolsar Procedimento';
    return 'Ação';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-[700] tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Procedimentos
          </h1>
          <p className="text-muted-foreground mt-1 font-[400]">Catálogo de procedimentos e valores base.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="orvium-btn-primary font-[600]">
              <Plus className="w-4 h-4 mr-2" /> Novo Procedimento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-[700] text-xl">Cadastrar Novo Procedimento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div className="space-y-2">
                <Label htmlFor="procedure_id">ID do Procedimento *</Label>
                <Input id="procedure_id" required value={formData.procedure_id} onChange={e => setFormData({...formData, procedure_id: e.target.value})} className="bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization_id">ID da Organização *</Label>
                <Input id="organization_id" required value={formData.organization_id} onChange={e => setFormData({...formData, organization_id: e.target.value})} className="bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="procedure_name">Nome do Procedimento *</Label>
                <Input id="procedure_name" required value={formData.procedure_name} onChange={e => setFormData({...formData, procedure_name: e.target.value})} className="bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_price">Preço Base (R$)</Label>
                <Input id="default_price" type="number" step="0.01" value={formData.default_price} onChange={e => setFormData({...formData, default_price: e.target.value})} className="bg-slate-50" />
              </div>
              <Button type="submit" className="w-full orvium-btn-primary font-[600] h-11">Salvar Procedimento</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="orvium-card p-0 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="border-b border-slate-200">
              <TableHead className="font-[600] text-slate-600 py-4">ID</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">Nome</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">Preço Base</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">Status</TableHead>
              <TableHead className="text-right font-[600] text-slate-600 py-4">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-500">Carregando dados...</TableCell></TableRow>
            ) : procedures.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-500">Nenhum procedimento encontrado.</TableCell></TableRow>
            ) : (
              procedures.map((proc) => (
                <TableRow key={proc.id} className="orvium-table-row">
                  <TableCell className="font-[600] text-slate-700 py-4">{proc.procedure_id}</TableCell>
                  <TableCell className="py-4">{proc.procedure_name}</TableCell>
                  <TableCell className="py-4 font-[500]">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proc.default_price || 0)}
                  </TableCell>
                  <TableCell className="py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-[600] ${proc.active_status ? 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]' : 'bg-slate-100 text-slate-600'}`}>
                      {proc.active_status ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <div className="flex justify-end items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openActionModal(proc, 'PROCEDURE_EXECUTED')} className="text-[hsl(var(--success))] border-[hsl(var(--success))]/30 hover:bg-[hsl(var(--success))]/10">
                        <Play className="w-4 h-4 mr-1" /> Executar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openActionModal(proc, 'PROCEDURE_CANCELED')} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                        <XCircle className="w-4 h-4 mr-1" /> Cancelar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openActionModal(proc, 'PROCEDURE_REFUNDED')} className="text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30 hover:bg-[hsl(var(--warning))]/10">
                        <RotateCcw className="w-4 h-4 mr-1" /> Reembolsar
                      </Button>
                      <div className="w-px h-6 bg-border mx-1"></div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(proc.id)} className="text-slate-400 hover:text-destructive hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Action Modal */}
      <Dialog open={actionModal.isOpen} onOpenChange={(open) => !open && setActionModal({ isOpen: false, type: null, procedure: null })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{getActionTitle(actionModal.type)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Procedimento</Label>
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200 font-medium text-sm">
                {actionModal.procedure?.procedure_name} ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(actionModal.procedure?.default_price || 0)})
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_select">Unidade de Atendimento *</Label>
              <select 
                id="unit_select"
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
              >
                <option value="">Selecione uma unidade...</option>
                {units.filter(u => u.organization_id === actionModal.procedure?.organization_id).map(u => (
                  <option key={u.id} value={u.unit_id}>{u.unit_name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prof_select">Profissional Responsável *</Label>
              <select 
                id="prof_select"
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedProfessional}
                onChange={(e) => setSelectedProfessional(e.target.value)}
              >
                <option value="">Selecione um profissional...</option>
                {professionals.filter(p => p.organization_id === actionModal.procedure?.organization_id).map(p => (
                  <option key={p.id} value={p.professional_id}>{p.professional_name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModal({ isOpen: false, type: null, procedure: null })}>Cancelar</Button>
            <Button onClick={handleActionSubmit} disabled={isSubmittingAction} className="orvium-btn-primary">
              {isSubmittingAction ? 'Registrando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ProceduresPage;
