
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users, Link as LinkIcon, Eye } from 'lucide-react';

const ProfessionalsPage = () => {
  const [professionals, setProfessionals] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [selectedProfForRule, setSelectedProfForRule] = useState(null);
  const [selectedRuleId, setSelectedRuleId] = useState('');

  const [formData, setFormData] = useState({
    professional_id: '',
    organization_id: '',
    professional_name: '',
    professional_role: '',
    active_status: true
  });

  const fetchData = async () => {
    try {
      const [profs, rulesData] = await Promise.all([
        pb.collection('professionals').getFullList({ sort: '-created', $autoCancel: false }),
        pb.collection('repasse_rules').getFullList({ filter: 'active_status=true', $autoCancel: false })
      ]);
      setProfessionals(profs);
      setRules(rulesData);
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
      await pb.collection('professionals').create(formData, { $autoCancel: false });
      setIsDialogOpen(false);
      setFormData({ professional_id: '', organization_id: '', professional_name: '', professional_role: '', active_status: true });
      fetchData();
    } catch (error) {
      console.error("Error creating professional:", error);
      alert("Erro ao criar profissional.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este profissional?')) {
      try {
        await pb.collection('professionals').delete(id, { $autoCancel: false });
        fetchData();
      } catch (error) {
        console.error("Error deleting professional:", error);
      }
    }
  };

  const openRuleDialog = (prof) => {
    setSelectedProfForRule(prof);
    setSelectedRuleId(prof.repasse_rule_id || '');
    setIsRuleDialogOpen(true);
  };

  const handleAssignRule = async () => {
    if (!selectedProfForRule) return;
    try {
      await pb.collection('professionals').update(selectedProfForRule.id, {
        repasse_rule_id: selectedRuleId
      }, { $autoCancel: false });
      setIsRuleDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error assigning rule:", error);
      alert("Erro ao vincular regra.");
    }
  };

  const getRuleName = (ruleId) => {
    if (!ruleId) return null;
    const rule = rules.find(r => r.repasse_rule_id === ruleId);
    return rule ? rule.rule_name : ruleId;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-[700] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Profissionais
          </h1>
          <p className="text-muted-foreground mt-1 font-[400]">Gerencie o corpo clínico e regras de repasse.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="orvium-btn-primary font-[600]">
              <Plus className="w-4 h-4 mr-2" /> Novo Profissional
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-[700] text-xl">Cadastrar Novo Profissional</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div className="space-y-2">
                <Label htmlFor="professional_id">ID do Profissional *</Label>
                <Input id="professional_id" required value={formData.professional_id} onChange={e => setFormData({...formData, professional_id: e.target.value})} className="bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization_id">ID da Organização *</Label>
                <Input id="organization_id" required value={formData.organization_id} onChange={e => setFormData({...formData, organization_id: e.target.value})} className="bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="professional_name">Nome Completo *</Label>
                <Input id="professional_name" required value={formData.professional_name} onChange={e => setFormData({...formData, professional_name: e.target.value})} className="bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="professional_role">Especialidade/Cargo</Label>
                <Input id="professional_role" value={formData.professional_role} onChange={e => setFormData({...formData, professional_role: e.target.value})} className="bg-slate-50" />
              </div>
              <Button type="submit" className="w-full orvium-btn-primary font-[600] h-11">Salvar Profissional</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="orvium-card p-0 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="border-b border-slate-200">
              <TableHead className="font-[600] text-slate-600 py-4">Nome</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">Especialidade</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">Regra de Repasse</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">Status</TableHead>
              <TableHead className="text-right font-[600] text-slate-600 py-4">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-500">Carregando dados...</TableCell></TableRow>
            ) : professionals.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-500">Nenhum profissional encontrado.</TableCell></TableRow>
            ) : (
              professionals.map((prof) => {
                const ruleName = getRuleName(prof.repasse_rule_id);
                return (
                  <TableRow key={prof.id} className="orvium-table-row">
                    <TableCell className="font-[600] text-slate-700 py-4">
                      <div>{prof.professional_name}</div>
                      <div className="text-xs text-slate-400 font-normal">{prof.professional_id}</div>
                    </TableCell>
                    <TableCell className="py-4 text-slate-500">{prof.professional_role}</TableCell>
                    <TableCell className="py-4">
                      {ruleName ? (
                        <Badge variant="secondary" className="bg-blue-50 text-primary border-blue-100">
                          {ruleName}
                        </Badge>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Sem regra vinculada</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-[600] ${prof.active_status ? 'orvium-badge-success' : 'bg-slate-100 text-slate-600'}`}>
                        {prof.active_status ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex justify-end items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openRuleDialog(prof)} className="text-slate-600 hover:text-primary">
                          <LinkIcon className="w-4 h-4 mr-1" /> Vincular Regra
                        </Button>
                        <div className="w-px h-6 bg-border mx-1"></div>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(prof.id)} className="text-slate-400 hover:text-destructive hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
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

      {/* Assign Rule Dialog */}
      <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Vincular Regra de Repasse</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Profissional</Label>
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200 font-medium text-sm">
                {selectedProfForRule?.professional_name}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rule_select">Selecione a Regra *</Label>
              <select 
                id="rule_select"
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedRuleId}
                onChange={(e) => setSelectedRuleId(e.target.value)}
              >
                <option value="">Nenhuma regra (Remover vínculo)</option>
                {rules.filter(r => r.organization_id === selectedProfForRule?.organization_id || !selectedProfForRule).map(r => (
                  <option key={r.id} value={r.repasse_rule_id}>{r.rule_name} ({r.repasse_model})</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRuleDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAssignRule} className="orvium-btn-primary">
              Salvar Vínculo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ProfessionalsPage;
